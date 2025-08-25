import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { Transaction, TransactionStatusEnum } from '../models/Transaction.js';
import { FlittPaymentService, FlittCallbackData } from '../services/payments/FlittPaymentService.js';

const FLITT_IPS = ['54.154.216.60', '3.75.125.89'];

/**
 * Handle Flitt payment callbacks
 */
export const handleFlittCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Flitt Callback received:', req.body);
    console.log('Client IP:', req.ip);
    console.log('Headers:', req.headers);

    // Validate request IP (in production)
    if (process.env.NODE_ENV === 'production') {
      const clientIP = req.ip || req.connection.remoteAddress;
      if (!clientIP || !FLITT_IPS.some(ip => clientIP.includes(ip))) {
        console.warn('Unauthorized Flitt callback from IP:', clientIP);
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    const callbackData: FlittCallbackData = req.body;
    
    // Validate required fields
    if (!callbackData.order_id || !callbackData.order_status || !callbackData.signature) {
      console.error('Invalid callback data - missing required fields');
      res.status(400).json({ error: 'Invalid callback data' });
      return;
    }

    // Verify signature
    const flittService = new FlittPaymentService();
    if (!flittService.verifySignature(callbackData)) {
      console.error('Invalid signature in callback');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    // Find transaction by order_id (stored in externalTransactionId)
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const userRepository = AppDataSource.getRepository(User);

    const transaction = await transactionRepository.findOne({
      where: { externalTransactionId: callbackData.order_id },
      relations: ['user']
    });

    if (!transaction) {
      console.error('Transaction not found for order_id:', callbackData.order_id);
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Check if transaction is already processed
    if (transaction.status === TransactionStatusEnum.COMPLETED) {
      console.log('Transaction already completed:', transaction.uuid);
      res.status(200).json({ status: 'already_processed' });
      return;
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transactionRepo = queryRunner.manager.getRepository(Transaction);
      const userRepo = queryRunner.manager.getRepository(User);

      // Update transaction based on payment status
      const updatedMetadata = {
        ...transaction.metadata,
        flittCallback: callbackData,
        callbackReceivedAt: new Date().toISOString()
      };

      if (callbackData.order_status === 'success') {
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
          flittPaymentStatus: 'success'
        };
        
        await transactionRepo.save(transaction);

        // Update user balance
        user.balance = newBalance;
        await userRepo.save(user);

        await queryRunner.commitTransaction();

        console.log(`Payment completed successfully for order ${callbackData.order_id}, user ${transaction.userId}, amount: ${topUpAmount}`);
        
        res.status(200).json({ 
          status: 'success',
          message: 'Payment processed successfully'
        });

      } else if (callbackData.order_status === 'failed') {
        // Payment failed
        transaction.status = TransactionStatusEnum.FAILED;
        transaction.metadata = {
          ...updatedMetadata,
          flittPaymentStatus: 'failed',
          failedAt: new Date().toISOString()
        };
        
        await transactionRepo.save(transaction);
        await queryRunner.commitTransaction();

        console.log(`Payment failed for order ${callbackData.order_id}`);
        
        res.status(200).json({ 
          status: 'failed',
          message: 'Payment marked as failed'
        });

      } else {
        // Other status (pending, etc.)
        transaction.metadata = {
          ...updatedMetadata,
          flittPaymentStatus: callbackData.order_status
        };
        
        await transactionRepo.save(transaction);
        await queryRunner.commitTransaction();

        console.log(`Payment status updated to ${callbackData.order_status} for order ${callbackData.order_id}`);
        
        res.status(200).json({ 
          status: 'updated',
          message: `Payment status updated to ${callbackData.order_status}`
        });
      }

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('Flitt callback processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process payment callback'
    });
  }
};