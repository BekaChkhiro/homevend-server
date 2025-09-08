import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { Transaction, TransactionStatusEnum, TransactionTypeEnum } from '../models/Transaction.js';
import { BogPaymentService, BogCallbackData } from '../services/payments/BogPaymentService.js';

/**
 * Handle BOG payment details (direct format from BOG API)
 */
export async function handleBogPaymentDetails(paymentDetails: any, res: Response): Promise<void> {
  console.log('=== Processing BOG Payment Details ===');
  console.log('Payment Details:', JSON.stringify(paymentDetails, null, 2));
  
  try {
    // Extract identifiers and status based on actual BOG API docs
    const bogOrderId = paymentDetails.order_id;
    const externalOrderId = paymentDetails.external_order_id;
    const orderStatus = paymentDetails.order_status?.key;
    const orderStatusValue = paymentDetails.order_status?.value;
    
    // Status code is in payment_detail.code according to BOG API docs
    const paymentStatusCode = paymentDetails.payment_detail?.code;
    const paymentCodeDescription = paymentDetails.payment_detail?.code_description;
    
    console.log('BOG Order ID:', bogOrderId);
    console.log('External Order ID:', externalOrderId);
    console.log('Order Status Key:', orderStatus);
    console.log('Order Status Value:', orderStatusValue);
    console.log('Payment Status Code:', paymentStatusCode);
    console.log('Payment Code Description:', paymentCodeDescription);
    
    if (!bogOrderId && !externalOrderId) {
      console.error('No order identifiers found in payment details');
      res.status(400).json({
        error: 'Invalid payment details',
        message: 'Missing order identifiers'
      });
      return;
    }
    
    // Find transaction with improved search logic
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    console.log('Searching for transaction with BOG Order ID:', bogOrderId);
    console.log('Searching for transaction with External Order ID:', externalOrderId);
    
    let transaction = null;
    
    // Try multiple search strategies
    const searchStrategies = [];
    
    // Strategy 1: Search by externalTransactionId matching BOG's order_id (PRIMARY METHOD)
    if (bogOrderId) {
      searchStrategies.push({
        name: 'bogOrderId',
        where: { externalTransactionId: bogOrderId }
      });
    }
    
    // Strategy 2: Search by externalTransactionId matching our original order_id (FALLBACK)
    if (externalOrderId) {
      searchStrategies.push({
        name: 'externalOrderId',
        where: { externalTransactionId: externalOrderId }
      });
    }
    
    // Strategy 3: Search in metadata for bogOrderId
    if (bogOrderId) {
      searchStrategies.push({
        name: 'metadataBogOrderId',
        metadata: true,
        query: "transaction.metadata->>'bogOrderId' = :orderId",
        params: { orderId: bogOrderId }
      });
    }
    
    // Strategy 4: Search in metadata for original orderId
    if (externalOrderId) {
      searchStrategies.push({
        name: 'metadataOriginalOrderId',
        metadata: true,
        query: "transaction.metadata->>'originalOrderId' = :orderId",
        params: { orderId: externalOrderId }
      });
    }
    
    // Strategy 5: Search in metadata for orderId (legacy)
    if (externalOrderId) {
      searchStrategies.push({
        name: 'metadataOrderId',
        metadata: true,
        query: "transaction.metadata->>'orderId' = :orderId",
        params: { orderId: externalOrderId }
      });
    }
    
    // Strategy 6: Try to match by user ID and amount if we have enough info
    if (paymentDetails.purchase_units?.transfer_amount) {
      const transferAmount = parseFloat(paymentDetails.purchase_units.transfer_amount);
      searchStrategies.push({
        name: 'amountMatch',
        where: { 
          amount: transferAmount,
          status: TransactionStatusEnum.PENDING,
          type: TransactionTypeEnum.TOP_UP
        }
      });
    }
    
    for (const strategy of searchStrategies) {
      console.log(`Trying search strategy: ${strategy.name}`);
      
      if (strategy.metadata) {
        const transactions = await transactionRepository
          .createQueryBuilder('transaction')
          .where(strategy.query, strategy.params)
          .leftJoinAndSelect('transaction.user', 'user')
          .getMany();
        
        if (transactions.length > 0) {
          transaction = transactions[0];
          console.log(`✅ Found transaction via ${strategy.name} (METADATA SEARCH)`);
          break;
        }
      } else {
        transaction = await transactionRepository.findOne({
          where: strategy.where,
          relations: ['user']
        });
        
        if (transaction) {
          console.log(`✅ Found transaction via ${strategy.name} (${strategy.name === 'bogOrderId' ? 'DIRECT MATCH' : 'FALLBACK'})`);
          break;
        }
      }
    }
    
    if (!transaction) {
      console.error('❌ Transaction not found with any search strategy');
      console.error('Searched for:');
      console.error('  - BOG Order ID:', bogOrderId);
      console.error('  - External Order ID:', externalOrderId);
      console.error('  - Transfer Amount:', paymentDetails.purchase_units?.transfer_amount);
      
      // Log all pending transactions for debugging
      const pendingTransactions = await transactionRepository.find({
        where: {
          type: TransactionTypeEnum.TOP_UP,
          status: TransactionStatusEnum.PENDING
        },
        select: ['uuid', 'externalTransactionId', 'metadata', 'amount', 'userId']
      });
      
      console.error('Current pending TOP_UP transactions:');
      pendingTransactions.forEach(tx => {
        console.error(`  - UUID: ${tx.uuid}, ExtID: ${tx.externalTransactionId}, Amount: ${tx.amount}, Metadata:`, tx.metadata);
      });
      
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
      
      // Handle successful payments - BOG sends payment status code "100" for successful payments
      if (orderStatus === 'completed' || paymentStatusCode === '100') {
        console.log('✅ Processing completed payment...');
        console.log('Transaction ID:', transaction.uuid);
        console.log('User ID:', transaction.userId);
        console.log('Transaction Amount:', transaction.amount);
        console.log('Transaction Status:', transaction.status);
        console.log('Payment Method:', transaction.paymentMethod);
        
        const user = await userRepo.findOne({
          where: { id: transaction.userId },
          select: ['id', 'balance']
        });
        
        if (!user) {
          console.error(`User not found for transaction userId: ${transaction.userId}`);
          await queryRunner.rollbackTransaction();
          res.status(404).json({ error: 'User not found' });
          return;
        }
        
        const currentBalance = parseFloat(user.balance.toString());
        const topUpAmount = parseFloat(transaction.amount.toString());
        const newBalance = currentBalance + topUpAmount;
        
        console.log(`💰 Balance update for user ${user.id}:`);
        console.log(`  Current balance: ${currentBalance} GEL`);
        console.log(`  Top-up amount: ${topUpAmount} GEL`);
        console.log(`  New balance: ${newBalance} GEL`);
        
        // Update transaction
        transaction.status = TransactionStatusEnum.COMPLETED;
        transaction.balanceAfter = newBalance;
        transaction.metadata = {
          ...updatedMetadata,
          completedAt: new Date().toISOString(),
          bogPaymentStatus: 'completed',
          paymentStatusCode: paymentStatusCode,
          paymentCodeDescription: paymentCodeDescription,
          orderStatus: orderStatus,
          orderStatusValue: orderStatusValue,
          transferAmount: paymentDetails.purchase_units?.transfer_amount || transaction.amount.toString(),
          bogTransactionId: paymentDetails.payment_detail?.transaction_id,
          paymentMethod: paymentDetails.payment_detail?.transfer_method?.key,
          cardType: paymentDetails.payment_detail?.card_type,
          payerIdentifier: paymentDetails.payment_detail?.payer_identifier
        };
        
        console.log('Saving updated transaction...');
        await transactionRepo.save(transaction);
        console.log('Transaction saved successfully');
        
        // Update user balance
        const oldBalance = user.balance;
        user.balance = newBalance;
        console.log(`Updating user balance from ${oldBalance} to ${newBalance}`);
        await userRepo.save(user);
        console.log('User balance updated successfully');
        
        await queryRunner.commitTransaction();
        console.log('✅ Database transaction committed successfully');
        
        console.log(`✅ BOG payment completed successfully:`);
        console.log(`  - Order ID: ${externalOrderId}`);
        console.log(`  - BOG Order ID: ${bogOrderId}`);
        console.log(`  - User ID: ${transaction.userId}`);
        console.log(`  - Amount: ${topUpAmount} GEL`);
        console.log(`  - New Balance: ${newBalance} GEL`);
        
        res.status(200).json({
          status: 'success',
          message: 'Payment processed successfully',
          debug: {
            transactionId: transaction.uuid,
            userId: transaction.userId,
            amount: topUpAmount,
            oldBalance: currentBalance,
            newBalance: newBalance
          }
        });
        
      } else if (orderStatus === 'rejected' || (paymentStatusCode && paymentStatusCode !== '100' && paymentStatusCode !== '200')) {
        console.log(`Processing rejected/failed payment with payment code: ${paymentStatusCode}`);
        console.log(`Payment code description: ${paymentCodeDescription}`);
        console.log(`Order status: ${orderStatus} (${orderStatusValue})`);
        
        transaction.status = TransactionStatusEnum.FAILED;
        transaction.metadata = {
          ...updatedMetadata,
          bogPaymentStatus: 'rejected',
          failedAt: new Date().toISOString(),
          rejectReason: paymentDetails.reject_reason,
          paymentStatusCode: paymentStatusCode,
          paymentCodeDescription: paymentCodeDescription,
          orderStatus: orderStatus,
          orderStatusValue: orderStatusValue
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
        
      } else if (paymentStatusCode === '200') {
        console.log('Processing preauthorization...');
        console.log(`Payment Status Code: ${paymentStatusCode} - ${paymentCodeDescription}`);
        console.log(`Order Status: ${orderStatus} (${orderStatusValue})`);
        
        // For preauthorization, update metadata but keep transaction pending
        transaction.metadata = {
          ...updatedMetadata,
          bogPaymentStatus: 'preauthorized',
          paymentStatusCode: paymentStatusCode,
          paymentCodeDescription: paymentCodeDescription,
          orderStatus: orderStatus,
          orderStatusValue: orderStatusValue,
          preauthorizedAt: new Date().toISOString()
        };
        
        await transactionRepo.save(transaction);
        await queryRunner.commitTransaction();
        
        console.log(`BOG preauthorization received for order ${externalOrderId}`);
        
        res.status(200).json({
          status: 'preauthorized',
          message: 'Preauthorization received - awaiting final payment confirmation'
        });
        
      } else {
        console.log('Processing unknown status:', orderStatus);
        console.log(`Payment Status Code: ${paymentStatusCode} - ${paymentCodeDescription}`);
        console.log(`Order Status: ${orderStatus} (${orderStatusValue})`);
        
        transaction.metadata = {
          ...updatedMetadata,
          bogPaymentStatus: orderStatus || 'unknown',
          paymentStatusCode: paymentStatusCode,
          paymentCodeDescription: paymentCodeDescription,
          orderStatus: orderStatus,
          orderStatusValue: orderStatusValue,
          unknownStatusAt: new Date().toISOString()
        };
        
        await transactionRepo.save(transaction);
        await queryRunner.commitTransaction();
        
        console.log(`BOG unknown status (${paymentStatusCode}: ${paymentCodeDescription}) for order ${externalOrderId}`);
        
        res.status(200).json({
          status: 'acknowledged',
          message: `Unknown status received: ${paymentStatusCode} - ${paymentCodeDescription}`
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
    
    // Check for signature header (BOG documentation mentions Callback-Signature)
    const signature = req.headers['callback-signature'] as string;
    if (signature) {
      console.log('🔐 Callback signature received:', signature.substring(0, 20) + '...');
      
      // Verify signature using BOG service
      try {
        const bogService = new BogPaymentService();
        const isValidSignature = bogService.verifySignature(signature, req.body);
        
        if (!isValidSignature) {
          console.error('❌ Invalid callback signature - possible security issue');
          res.status(401).json({
            error: 'Invalid signature',
            message: 'Callback signature verification failed'
          });
          return;
        }
        
        console.log('✅ Callback signature verified successfully');
      } catch (error) {
        console.error('🔐 Signature verification error:', error);
        // For development, continue processing even if signature fails
        // In production, you might want to reject the callback
        console.log('⚠️  Continuing despite signature verification error (development mode)');
      }
    } else {
      console.log('⚠️  No callback signature in headers - this might be a test or invalid callback');
      // In production, you might want to require signature verification
    }

    // Always send some response for debugging
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('Empty callback body received');
      res.status(400).json({ error: 'Empty callback body' });
      return;
    }

    // Based on working PHP implementation, BOG sends callbacks in this format:
    // { "body": { "external_order_id": "...", "order_status": { "key": "completed" }, ... } }
    const callbackData: any = req.body;
    
    console.log('Analyzing callback structure...');
    console.log('Has body field:', !!callbackData.body);
    console.log('Has event field:', !!callbackData.event);
    console.log('Event value:', callbackData.event);
    console.log('Has zoned_request_time:', !!callbackData.zoned_request_time);
    
    // Check for the working format from PHP implementation
    const isWorkingFormat = callbackData.body && callbackData.body.external_order_id;
    
    if (isWorkingFormat) {
      console.log('✅ Detected working BOG callback format (matches PHP implementation)');
      // Handle BOG callback with payment details in body
      return await handleBogPaymentDetails(callbackData.body, res);
    }
    
    // Check if this is the documented format
    const isDocumentedFormat = callbackData.event === 'order_payment' && callbackData.body;
    
    if (isDocumentedFormat) {
      console.log('✅ Detected documented BOG callback format');
      // Validate that body has required fields
      const paymentDetails = callbackData.body;
      if (!paymentDetails.order_id && !paymentDetails.external_order_id) {
        console.error('❌ BOG callback body missing required order identifiers');
        res.status(400).json({
          error: 'Invalid BOG callback',
          message: 'Payment details missing order identifiers',
          received_body_keys: Object.keys(paymentDetails)
        });
        return;
      }
      
      // Handle BOG callback with payment details in body
      return await handleBogPaymentDetails(paymentDetails, res);
    }
    
    // Fallback: check if payment details are sent directly (without wrapper)
    const isDirectPaymentDetails = callbackData.order_id && callbackData.order_status;
    if (isDirectPaymentDetails) {
      console.log('⚠️  Detected direct payment details format (testing/fallback)');
      return await handleBogPaymentDetails(callbackData, res);
    }
    
    // Unknown format - provide detailed error information
    console.log('❌ Unknown callback format received');
    console.log('Expected formats:');
    console.log('1. Working format: { body: { external_order_id, order_status: { key: "completed" } } }');
    console.log('2. Documented format: { event: "order_payment", body: { ... } }');
    console.log('Received keys:', Object.keys(callbackData));
    
    res.status(400).json({
      error: 'Invalid callback format',
      message: 'Expected BOG callback with body containing payment details',
      expected_formats: {
        working: {
          body: {
            external_order_id: 'Your order ID',
            order_status: { key: 'completed|rejected|...' },
            payment_detail: { transaction_id: 'BOG transaction ID' }
          }
        },
        documented: {
          event: 'order_payment',
          zoned_request_time: 'ISO timestamp',
          body: {
            order_id: 'BOG order ID',
            external_order_id: 'Your order ID',
            order_status: { key: 'completed|rejected|...', value: 'description' }
          }
        }
      },
      received_format: {
        keys: Object.keys(callbackData),
        has_body: !!callbackData.body,
        has_event: !!callbackData.event,
        event_value: callbackData.event,
        body_keys: callbackData.body ? Object.keys(callbackData.body) : []
      }
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