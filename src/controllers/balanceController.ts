import { Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { Transaction, TransactionTypeEnum, TransactionStatusEnum } from '../models/Transaction.js';
import { AuthenticatedRequest } from '../types/auth.js';

// Get user balance and recent transactions
export const getUserBalance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRepository = AppDataSource.getRepository(User);
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'fullName', 'email', 'balance']
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Get recent transactions (last 10)
    const recentTransactions = await transactionRepository.find({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
      take: 10,
      select: [
        'id', 'uuid', 'type', 'status', 'amount', 
        'balanceBefore', 'balanceAfter', 'description', 
        'paymentMethod', 'createdAt'
      ]
    });

    // Get last successful top-up
    const lastTopUp = await transactionRepository.findOne({
      where: { 
        userId: userId, 
        type: TransactionTypeEnum.TOP_UP,
        status: TransactionStatusEnum.COMPLETED
      },
      order: { createdAt: 'DESC' }
    });

    res.status(200).json({
      success: true,
      data: {
        balance: parseFloat(user.balance.toString()),
        recentTransactions: recentTransactions.map(tx => ({
          ...tx,
          amount: parseFloat(tx.amount.toString()),
          balanceBefore: parseFloat(tx.balanceBefore.toString()),
          balanceAfter: parseFloat(tx.balanceAfter.toString()),
          createdAt: tx.createdAt.toISOString()
        })),
        lastTopUp: lastTopUp ? {
          amount: parseFloat(lastTopUp.amount.toString()),
          createdAt: lastTopUp.createdAt.toISOString(),
          paymentMethod: lastTopUp.paymentMethod
        } : null
      }
    });
  } catch (error) {
    console.error('Get user balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance'
    });
  }
};

// Process top-up (for testing - simplified)
export const processTopUp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userId = req.user!.id;
    const { amount, paymentMethod = 'test' } = req.body;

    // Validate amount
    const topUpAmount = parseFloat(amount);
    if (!topUpAmount || topUpAmount <= 0 || topUpAmount > 10000) {
      res.status(400).json({
        success: false,
        message: 'Invalid amount. Must be between 0.01 and 10,000'
      });
      return;
    }

    const userRepository = queryRunner.manager.getRepository(User);
    const transactionRepository = queryRunner.manager.getRepository(Transaction);

    // Get current user with balance
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'fullName', 'email', 'balance']
    });

    if (!user) {
      await queryRunner.rollbackTransaction();
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const currentBalance = parseFloat(user.balance.toString());
    const newBalance = currentBalance + topUpAmount;

    // Create transaction record
    const transaction = transactionRepository.create({
      userId: userId,
      type: TransactionTypeEnum.TOP_UP,
      status: TransactionStatusEnum.COMPLETED, // For testing, immediately mark as completed
      amount: topUpAmount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: `Balance top-up via ${paymentMethod}`,
      paymentMethod: paymentMethod,
      externalTransactionId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        testTransaction: true
      }
    });

    await transactionRepository.save(transaction);

    // Update user balance
    user.balance = newBalance;
    await userRepository.save(user);

    await queryRunner.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Top-up processed successfully',
      data: {
        transactionId: transaction.uuid,
        amount: topUpAmount,
        newBalance: newBalance,
        transaction: {
          id: transaction.id,
          uuid: transaction.uuid,
          type: transaction.type,
          status: transaction.status,
          amount: topUpAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: transaction.description,
          paymentMethod: transaction.paymentMethod,
          createdAt: transaction.createdAt.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Process top-up error:', error);
    await queryRunner.rollbackTransaction();
    res.status(500).json({
      success: false,
      message: 'Failed to process top-up'
    });
  } finally {
    await queryRunner.release();
  }
};

// Get transaction history with pagination
export const getTransactionHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, type, status } = req.query;
    
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    // Build where clause
    const whereClause: any = { userId: userId };
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    
    const [transactions, total] = await transactionRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      select: [
        'id', 'uuid', 'type', 'status', 'amount', 
        'balanceBefore', 'balanceAfter', 'description', 
        'paymentMethod', 'createdAt'
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        transactions: transactions.map(tx => ({
          ...tx,
          amount: parseFloat(tx.amount.toString()),
          balanceBefore: parseFloat(tx.balanceBefore.toString()),
          balanceAfter: parseFloat(tx.balanceAfter.toString()),
          createdAt: tx.createdAt.toISOString()
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history'
    });
  }
};