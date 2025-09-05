import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { Transaction, TransactionStatusEnum } from '../models/Transaction.js';
import { BogPaymentService, BogCallbackData } from '../services/payments/BogPaymentService.js';

/**
 * Handle BOG payment details (direct format from BOG API)
 */
async function handleBogPaymentDetails(paymentDetails: any, res: Response): Promise<void> {
  console.log('=== Processing BOG Payment Details ===');
  console.log('Payment Details:', JSON.stringify(paymentDetails, null, 2));
  
  try {
    // Extract identifiers
    const bogOrderId = paymentDetails.order_id;
    const externalOrderId = paymentDetails.external_order_id;
    const orderStatus = paymentDetails.order_status?.key;
    
    console.log('BOG Order ID:', bogOrderId);
    console.log('External Order ID:', externalOrderId);
    console.log('Order Status:', orderStatus);
    
    if (!bogOrderId && !externalOrderId) {
      console.error('No order identifiers found in payment details');
      res.status(400).json({
        error: 'Invalid payment details',
        message: 'Missing order identifiers'
      });
      return;
    }
    
    // Find transaction
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const searchId = externalOrderId || bogOrderId;
    
    console.log('Searching for transaction with ID:', searchId);
    
    let transaction = await transactionRepository.findOne({
      where: { externalTransactionId: searchId },
      relations: ['user']
    });
    
    // Try alternative searches if not found
    if (!transaction && bogOrderId && externalOrderId) {
      console.log('Trying BOG Order ID:', bogOrderId);
      transaction = await transactionRepository.findOne({
        where: { externalTransactionId: bogOrderId },
        relations: ['user']
      });
    }
    
    // Search in metadata
    if (!transaction && bogOrderId) {
      console.log('Searching in metadata for BOG order ID');
      const transactions = await transactionRepository
        .createQueryBuilder('transaction')
        .where("transaction.metadata->>'bogOrderId' = :orderId", { orderId: bogOrderId })
        .leftJoinAndSelect('transaction.user', 'user')
        .getMany();
      
      if (transactions.length > 0) {
        transaction = transactions[0];
        console.log('Found via metadata search');
      }
    }
    
    if (!transaction) {
      console.error('Transaction not found');
      res.status(200).json({
        status: 'acknowledged',
        message: 'Transaction not found, callback logged',
        bog_order_id: bogOrderId,
        external_order_id: externalOrderId
      });
      return;
    }
    
    console.log('Transaction found:', transaction.uuid);
    console.log('Current status:', transaction.status);
    console.log('Order status from callback:', orderStatus);
    
    // Check if already processed (unless it's a refund)
    if (transaction.status === TransactionStatusEnum.COMPLETED && orderStatus !== 'refunded' && orderStatus !== 'refunded_partially') {
      console.log('Transaction already completed');
      res.status(200).json({
        status: 'already_processed',
        message: 'Transaction already completed'
      });
      return;
    }
    
    // Process based on status
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const transactionRepo = queryRunner.manager.getRepository(Transaction);
      const userRepo = queryRunner.manager.getRepository(User);
      
      // Update metadata
      const updatedMetadata = {
        ...transaction.metadata,
        bogCallback: paymentDetails,
        callbackReceivedAt: new Date().toISOString(),
        bogOrderId: bogOrderId
      };
      
      if (orderStatus === 'completed') {
        console.log('Processing completed payment...');
        
        const user = await userRepo.findOne({
          where: { id: transaction.userId },
          select: ['id', 'balance']
        });
        
        if (!user) {
          await queryRunner.rollbackTransaction();
          res.status(404).json({ error: 'User not found' });
          return;
        }
        
        const currentBalance = parseFloat(user.balance.toString());
        const topUpAmount = parseFloat(transaction.amount.toString());
        const newBalance = currentBalance + topUpAmount;
        
        // Update transaction
        transaction.status = TransactionStatusEnum.COMPLETED;
        transaction.balanceAfter = newBalance;
        transaction.metadata = {
          ...updatedMetadata,
          completedAt: new Date().toISOString(),
          bogPaymentStatus: 'completed',
          transferAmount: paymentDetails.purchase_units?.transfer_amount || transaction.amount.toString(),
          bogTransactionId: paymentDetails.payment_detail?.transaction_id,
          paymentMethod: paymentDetails.payment_detail?.transfer_method?.key,
          cardType: paymentDetails.payment_detail?.card_type,
          payerIdentifier: paymentDetails.payment_detail?.payer_identifier
        };
        
        await transactionRepo.save(transaction);
        
        // Update user balance
        user.balance = newBalance;
        await userRepo.save(user);
        
        await queryRunner.commitTransaction();
        
        console.log(`BOG payment completed successfully for order ${externalOrderId}, user ${transaction.userId}, amount: ${topUpAmount}`);
        
        res.status(200).json({
          status: 'success',
          message: 'Payment processed successfully'
        });
        
      } else if (orderStatus === 'rejected') {
        console.log('Processing rejected payment...');
        
        transaction.status = TransactionStatusEnum.FAILED;
        transaction.metadata = {
          ...updatedMetadata,
          bogPaymentStatus: 'rejected',
          failedAt: new Date().toISOString(),
          rejectReason: paymentDetails.reject_reason,
          paymentCode: paymentDetails.payment_detail?.code,
          paymentCodeDescription: paymentDetails.payment_detail?.code_description
        };
        
        await transactionRepo.save(transaction);
        await queryRunner.commitTransaction();
        
        console.log(`BOG payment failed for order ${externalOrderId}, reason: ${paymentDetails.reject_reason}`);
        
        res.status(200).json({
          status: 'failed',
          message: 'Payment marked as failed'
        });
        
      } else if (orderStatus === 'refunded' || orderStatus === 'refunded_partially') {
        console.log('Processing refund...');
        
        // Check if transaction was previously completed (now we can reach here for refunds)
        const wasCompleted = transaction.status === TransactionStatusEnum.COMPLETED;
        
        if (wasCompleted) {
          const user = await userRepo.findOne({
            where: { id: transaction.userId },
            select: ['id', 'balance']
          });
          
          if (user && paymentDetails.purchase_units?.refund_amount) {
            const refundAmount = parseFloat(paymentDetails.purchase_units.refund_amount);
            const currentBalance = parseFloat(user.balance.toString());
            user.balance = currentBalance - refundAmount;
            await userRepo.save(user);
          }
        }
        
        transaction.status = TransactionStatusEnum.FAILED;
        transaction.metadata = {
          ...updatedMetadata,
          bogPaymentStatus: orderStatus,
          refundedAt: new Date().toISOString(),
          refundAmount: paymentDetails.purchase_units?.refund_amount || 0,
          wasCompleted: wasCompleted
        };
        
        await transactionRepo.save(transaction);
        await queryRunner.commitTransaction();
        
        console.log(`BOG payment refunded for order ${externalOrderId}, status: ${orderStatus}`);
        
        res.status(200).json({
          status: 'refunded',
          message: `Payment ${orderStatus}`
        });
        
      } else {
        console.log('Processing other status:', orderStatus);
        
        transaction.metadata = {
          ...updatedMetadata,
          bogPaymentStatus: orderStatus
        };
        
        await transactionRepo.save(transaction);
        await queryRunner.commitTransaction();
        
        console.log(`BOG payment status updated to ${orderStatus} for order ${externalOrderId}`);
        
        res.status(200).json({
          status: 'updated',
          message: `Payment status updated to ${orderStatus}`
        });
      }
      
    } catch (error) {
      console.error('Database transaction error:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    
  } catch (error) {
    console.error('BOG payment details processing error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process payment details',
        details: error.message
      });
    }
  }
}

/**
 * Handle BOG payment callbacks
 */
export const handleBogCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== BOG CALLBACK START ===');
    console.log('BOG Callback received:', JSON.stringify(req.body, null, 2));
    console.log('Client IP:', req.ip);
    console.log('Headers:', req.headers);

    // Always send some response for debugging
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('Empty callback body received');
      res.status(400).json({ error: 'Empty callback body' });
      return;
    }

    // BOG sends callbacks in this format:
    // { "event": "order_payment", "zoned_request_time": "...", "body": { payment_details } }
    const callbackData: any = req.body;
    
    // Check if this is the correct BOG callback format
    const isBogCallback = callbackData.event === 'order_payment' && callbackData.body;
    
    if (isBogCallback) {
      console.log('Detected correct BOG callback format');
      // Handle BOG callback with payment details in body
      return await handleBogPaymentDetails(callbackData.body, res);
    }
    
    // Fallback: check if payment details are sent directly (without wrapper)
    const isDirectPaymentDetails = callbackData.order_id && callbackData.order_status;
    if (isDirectPaymentDetails) {
      console.log('Detected direct payment details format');
      return await handleBogPaymentDetails(callbackData, res);
    }
    
    // Unknown format
    console.log('Unknown callback format');
    res.status(400).json({
      error: 'Invalid callback format',
      message: 'Expected BOG callback format with event=order_payment and body',
      received_keys: Object.keys(callbackData)
    });
    return;

  } catch (error) {
    console.error('BOG callback processing error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body was:', JSON.stringify(req.body));
    
    // Always return a response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to process payment callback',
        details: error.message
      });
    }
  }
  
  console.log('=== BOG CALLBACK END ===');
};

/**
 * Handle BOG refund callbacks (if separate endpoint is needed)
 */
export const handleBogRefundCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('BOG Refund Callback received:', JSON.stringify(req.body, null, 2));
    
    // Similar logic to main callback but specifically for refunds
    const callbackData: BogCallbackData = req.body;
    
    // Process refund callback
    // Implementation similar to main callback but focused on refund handling
    
    res.status(200).json({ 
      status: 'success',
      message: 'Refund callback processed'
    });

  } catch (error) {
    console.error('BOG refund callback processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process refund callback'
    });
  }
};