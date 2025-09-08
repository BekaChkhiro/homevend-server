import { Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { Transaction, TransactionTypeEnum, TransactionStatusEnum } from '../models/Transaction.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { getDetailedTransactionHistory, getTransactionSummary as getTransactionSummaryUtil, TransactionFilter } from '../utils/transactionQueries.js';
import { FlittPaymentService } from '../services/payments/FlittPaymentService.js';
import { BogPaymentService } from '../services/payments/BogPaymentService.js';
import { PaymentProviderEnum, getEnabledPaymentProviders, getPaymentProvider } from '../services/payments/PaymentProviders.js';

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
        'paymentMethod', 'createdAt', 'metadata'
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

// Get available payment providers
export const getPaymentProviders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const providers = getEnabledPaymentProviders();
    
    res.status(200).json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Get payment providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment providers'
    });
  }
};

// Initiate top-up process (creates payment order)
export const initiateTopUp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { amount, provider = PaymentProviderEnum.TEST } = req.body;

    // Validate amount
    const topUpAmount = parseFloat(amount);
    if (!topUpAmount || topUpAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
      return;
    }

    // Get payment provider
    const paymentProvider = getPaymentProvider(provider);
    if (!paymentProvider || !paymentProvider.isEnabled) {
      res.status(400).json({
        success: false,
        message: 'Invalid or disabled payment provider'
      });
      return;
    }

    // Validate amount against provider limits
    if (topUpAmount < paymentProvider.minAmount || topUpAmount > paymentProvider.maxAmount) {
      res.status(400).json({
        success: false,
        message: `Amount must be between ${paymentProvider.minAmount} and ${paymentProvider.maxAmount} ${paymentProvider.currency}`
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const transactionRepository = AppDataSource.getRepository(Transaction);

    // Get current user
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

    const currentBalance = parseFloat(user.balance.toString());

    // Create pending transaction
    const orderId = `topup_${userId}_${Date.now()}`;
    const transaction = transactionRepository.create({
      userId: userId,
      type: TransactionTypeEnum.TOP_UP,
      status: TransactionStatusEnum.PENDING,
      amount: topUpAmount,
      balanceBefore: currentBalance,
      balanceAfter: currentBalance, // Will be updated when payment is confirmed
      description: `Balance top-up via ${paymentProvider.displayName}`,
      paymentMethod: provider,
      externalTransactionId: orderId,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        provider: provider,
        orderId: orderId
      }
    });

    await transactionRepository.save(transaction);

    // Handle different payment providers
    if (provider === PaymentProviderEnum.TEST) {
      // For test provider, immediately complete the transaction
      const newBalance = currentBalance + topUpAmount;
      
      transaction.status = TransactionStatusEnum.COMPLETED;
      transaction.balanceAfter = newBalance;
      transaction.metadata = {
        ...transaction.metadata,
        testTransaction: true,
        completedAt: new Date().toISOString()
      };
      
      await transactionRepository.save(transaction);
      
      // Update user balance
      user.balance = newBalance;
      await userRepository.save(user);

      res.status(200).json({
        success: true,
        provider: 'test',
        message: 'Test payment completed successfully',
        data: {
          transactionId: transaction.uuid,
          amount: topUpAmount,
          newBalance: newBalance,
          status: 'completed'
        }
      });
    } else if (provider === PaymentProviderEnum.FLITT) {
      // For Flitt, create payment order
      try {
        console.log('🔄 Creating Flitt payment service...');
        const flittService = new FlittPaymentService();
        const baseUrl = process.env.BASE_URL || 'https://homevend.ge';
        
        console.log('🔄 Creating Flitt order with params:', {
          orderId: orderId,
          amount: topUpAmount,
          description: `ბალანსის შევსება - ${topUpAmount} ლარი`,
          callbackUrl: `${baseUrl}/api/balance/flitt/callback`,
          responseUrl: `${baseUrl}/dashboard/balance?payment=success`
        });

        const orderResult = await flittService.createOrder({
          orderId: orderId,
          amount: topUpAmount,
          description: `ბალანსის შევსება - ${topUpAmount} ლარი`,
          callbackUrl: `${baseUrl}/api/balance/flitt/callback`,
          responseUrl: `${baseUrl}/dashboard/balance?payment=success`
        });

        console.log('🔄 Flitt order result:', orderResult);

        if (orderResult.response_status === 'success') {
          // Update transaction with Flitt payment ID
          transaction.metadata = {
            ...transaction.metadata,
            flittPaymentId: orderResult.payment_id,
            flittToken: orderResult.token
          };
          await transactionRepository.save(transaction);

          res.status(200).json({
            success: true,
            provider: 'flitt',
            message: 'Payment order created successfully',
            data: {
              transactionId: transaction.uuid,
              checkoutUrl: orderResult.checkout_url,
              paymentId: orderResult.payment_id,
              amount: topUpAmount
            }
          });
        } else {
          // Mark transaction as failed
          transaction.status = TransactionStatusEnum.FAILED;
          transaction.metadata = {
            ...transaction.metadata,
            flittError: orderResult.error_message,
            flittErrorCode: orderResult.error_code
          };
          await transactionRepository.save(transaction);

          const errorMessage = orderResult.error_message || 'Unknown error occurred';
          const errorCode = orderResult.error_code || 'UNKNOWN_ERROR';
          
          res.status(400).json({
            success: false,
            message: `Payment order creation failed: ${errorMessage}`,
            error_code: errorCode,
            debug_info: orderResult
          });
        }
      } catch (error: any) {
        console.error('Flitt service error:', error);
        
        // Mark transaction as failed
        transaction.status = TransactionStatusEnum.FAILED;
        transaction.metadata = {
          ...transaction.metadata,
          error: error.message
        };
        await transactionRepository.save(transaction);

        res.status(500).json({
          success: false,
          message: 'Failed to create payment order'
        });
      }
    } else if (provider === PaymentProviderEnum.BOG) {
      // For BOG, create payment order
      try {
        const bogService = new BogPaymentService();
        const baseUrl = process.env.BASE_URL || 'https://homevend.ge';
        
        const orderResult = await bogService.createOrder({
          orderId: orderId,
          amount: topUpAmount,
          currency: 'GEL',
          description: `ბალანსის შევსება - ${topUpAmount} ლარი`,
          callbackUrl: `${baseUrl}/api/balance/bog/callback`,
          successUrl: `${baseUrl}/dashboard/balance?payment=success`,
          failUrl: `${baseUrl}/dashboard/balance?payment=failed`,
          paymentMethods: ['card'],  // Only card payments for now
          ttl: 15,
          buyer: {
            fullName: user.fullName,
            email: user.email,
            phone: undefined // Add phone if available in user model
          },
          capture: 'automatic'
        });

        console.log('✅ BOG Order Creation Response:', JSON.stringify(orderResult, null, 2));

        // Update transaction with BOG order ID
        const bogOrderId = orderResult.id || orderResult.order_id;
        const redirectUrl = typeof orderResult._links.redirect === 'string' 
          ? orderResult._links.redirect 
          : orderResult._links.redirect.href;
        
        // Store BOTH the BOG order ID and our original order ID for flexible matching
        // Keep the original orderId as externalTransactionId for backward compatibility
        transaction.externalTransactionId = orderId; // Keep our original ID
        transaction.metadata = {
          ...transaction.metadata,
          originalOrderId: orderId,  // Keep original order ID for reference
          bogOrderId: bogOrderId,    // Store BOG's order ID
          bogRedirectUrl: redirectUrl
        };
        await transactionRepository.save(transaction);
        
        console.log('📝 Transaction saved with IDs:');
        console.log('  - External Transaction ID (our ID):', orderId);
        console.log('  - BOG Order ID:', bogOrderId);
        console.log('  - Transaction UUID:', transaction.uuid);

        console.log('💰 Sending BOG Response to Frontend:', {
          success: true,
          provider: 'bog',
          checkoutUrl: redirectUrl,
          orderId: bogOrderId,
          amount: topUpAmount
        });

        res.status(200).json({
          success: true,
          provider: 'bog',
          message: 'BOG payment order created successfully',
          data: {
            transactionId: transaction.uuid,
            checkoutUrl: redirectUrl,
            orderId: bogOrderId,
            amount: topUpAmount
          }
        });

      } catch (error: any) {
        console.error('BOG service error:', error);
        
        // Mark transaction as failed
        transaction.status = TransactionStatusEnum.FAILED;
        transaction.metadata = {
          ...transaction.metadata,
          error: error.message,
          bogError: true
        };
        await transactionRepository.save(transaction);

        res.status(500).json({
          success: false,
          message: `Failed to create BOG payment order: ${error.message}`
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported payment provider'
      });
    }
  } catch (error) {
    console.error('Initiate top-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate top-up'
    });
  }
};

// Legacy endpoint for backward compatibility
export const processTopUp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Redirect to new initiate endpoint with test provider
  req.body.provider = PaymentProviderEnum.TEST;
  return initiateTopUp(req, res);
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

// Get detailed transaction history with service information
export const getDetailedTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { 
      propertyId, 
      purchaseType, 
      serviceType, 
      transactionType, 
      dateFrom, 
      dateTo,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    // Build filter from query parameters
    const filter: TransactionFilter = {
      userId,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    };
    
    if (propertyId) filter.propertyId = Number(propertyId);
    if (purchaseType) filter.purchaseType = purchaseType as any;
    if (serviceType) filter.serviceType = serviceType as string;
    if (transactionType) filter.transactionType = transactionType as TransactionTypeEnum;
    if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
    if (dateTo) filter.dateTo = new Date(dateTo as string);
    
    // Get detailed transactions
    const transactions = await getDetailedTransactionHistory(transactionRepository, filter);
    
    // Get total count for pagination (without limit/offset)
    const countFilter = { ...filter };
    delete countFilter.limit;
    delete countFilter.offset;
    const totalTransactions = await getDetailedTransactionHistory(transactionRepository, countFilter);
    
    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalTransactions.length,
          pages: Math.ceil(totalTransactions.length / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get detailed transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed transactions'
    });
  }
};

// Get transaction summary statistics
export const getTransactionSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { propertyId, dateFrom, dateTo } = req.query;
    
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    // Build filter
    const filter: TransactionFilter = { userId };
    if (propertyId) filter.propertyId = Number(propertyId);
    if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
    if (dateTo) filter.dateTo = new Date(dateTo as string);
    
    const summary = await getTransactionSummaryUtil(transactionRepository, filter);
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction summary'
    });
  }
};