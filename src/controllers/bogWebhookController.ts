import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { Transaction, TransactionStatusEnum } from '../models/Transaction.js';
import { BogPaymentService, BogCallbackData } from '../services/payments/BogPaymentService.js';

/**
 * Handle BOG payment callbacks
 */
export const handleBogCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('BOG Callback received:', JSON.stringify(req.body, null, 2));
    console.log('Client IP:', req.ip);
    console.log('Headers:', req.headers);

    const callbackData: BogCallbackData = req.body;
    
    // Validate required fields
    if (!callbackData.event || !callbackData.body || !callbackData.body.order_id) {
      console.error('Invalid BOG callback data - missing required fields');
      res.status(400).json({ error: 'Invalid callback data' });
      return;
    }

    // Verify signature (if provided)
    const signature = req.headers['callback-signature'] as string;
    if (signature) {
      const bogService = new BogPaymentService();
      if (!bogService.verifySignature(signature, req.body)) {
        console.error('Invalid signature in BOG callback');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    // Find transaction by external order ID
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const userRepository = AppDataSource.getRepository(User);

    const transaction = await transactionRepository.findOne({
      where: { externalTransactionId: callbackData.body.external_order_id },
      relations: ['user']
    });

    if (!transaction) {
      console.error('Transaction not found for external_order_id:', callbackData.body.external_order_id);
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Check if transaction is already processed
    if (transaction.status === TransactionStatusEnum.COMPLETED) {
      console.log('Transaction already completed:', transaction.uuid);
      res.status(200).json({ status: 'already_processed' });
      return;
    }

    // Store original status for refund logic
    const originalStatus = transaction.status;

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transactionRepo = queryRunner.manager.getRepository(Transaction);
      const userRepo = queryRunner.manager.getRepository(User);

      // Update transaction metadata with callback data
      const updatedMetadata = {
        ...transaction.metadata,
        bogCallback: callbackData,
        callbackReceivedAt: new Date().toISOString(),
        bogOrderId: callbackData.body.order_id
      };

      const orderStatus = callbackData.body.order_status.key;
      
      if (orderStatus === 'completed') {
        // Payment successful - complete the transaction
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
          transferAmount: callbackData.body.purchase_units.transfer_amount,
          bogTransactionId: callbackData.body.payment_detail?.transaction_id,
          paymentMethod: callbackData.body.payment_detail?.transfer_method.key,
          cardType: callbackData.body.payment_detail?.card_type,
          payerIdentifier: callbackData.body.payment_detail?.payer_identifier
        };
        
        await transactionRepo.save(transaction);

        // Update user balance
        user.balance = newBalance;
        await userRepo.save(user);

        await queryRunner.commitTransaction();

        console.log(`BOG payment completed successfully for order ${callbackData.body.external_order_id}, user ${transaction.userId}, amount: ${topUpAmount}`);
        
        res.status(200).json({ 
          status: 'success',
          message: 'Payment processed successfully'
        });

      } else if (orderStatus === 'rejected') {
        // Payment failed
        transaction.status = TransactionStatusEnum.FAILED;
        transaction.metadata = {
          ...updatedMetadata,
          bogPaymentStatus: 'rejected',
          failedAt: new Date().toISOString(),
          rejectReason: callbackData.body.reject_reason,
          paymentCode: callbackData.body.payment_detail?.code,
          paymentCodeDescription: callbackData.body.payment_detail?.code_description
        };
        
        await transactionRepo.save(transaction);
        await queryRunner.commitTransaction();

        console.log(`BOG payment failed for order ${callbackData.body.external_order_id}, reason: ${callbackData.body.reject_reason}`);
        
        res.status(200).json({ 
          status: 'failed',
          message: 'Payment marked as failed'
        });

      } else if (orderStatus === 'refunded' || orderStatus === 'refunded_partially') {
        // Payment refunded - check if we need to adjust user balance first
        const wasCompleted = (originalStatus as TransactionStatusEnum) === TransactionStatusEnum.COMPLETED;
        
        if (wasCompleted) {
          // This was a completed transaction, we need to adjust the user balance
          const user = await userRepo.findOne({
            where: { id: transaction.userId },
            select: ['id', 'balance']
          });

          if (user) {
            const refundAmount = parseFloat(callbackData.body.purchase_units.refund_amount);
            const currentBalance = parseFloat(user.balance.toString());
            user.balance = currentBalance - refundAmount;
            await userRepo.save(user);
          }
        }
        
        // Update transaction status
        transaction.status = TransactionStatusEnum.FAILED; // or create a REFUNDED status
        transaction.metadata = {
          ...updatedMetadata,
          bogPaymentStatus: orderStatus,
          refundedAt: new Date().toISOString(),
          refundAmount: callbackData.body.purchase_units.refund_amount,
          wasCompleted: wasCompleted
        };
        
        await transactionRepo.save(transaction);
        
        await queryRunner.commitTransaction();

        console.log(`BOG payment refunded for order ${callbackData.body.external_order_id}, status: ${orderStatus}`);
        
        res.status(200).json({ 
          status: 'refunded',
          message: `Payment ${orderStatus}`
        });

      } else {
        // Other statuses (created, processing, etc.)
        transaction.metadata = {
          ...updatedMetadata,
          bogPaymentStatus: orderStatus
        };
        
        await transactionRepo.save(transaction);
        await queryRunner.commitTransaction();

        console.log(`BOG payment status updated to ${orderStatus} for order ${callbackData.body.external_order_id}`);
        
        res.status(200).json({ 
          status: 'updated',
          message: `Payment status updated to ${orderStatus}`
        });
      }

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('BOG callback processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process payment callback'
    });
  }
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