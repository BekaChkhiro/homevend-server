import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import {
  getUserBalance,
  processTopUp,
  getTransactionHistory,
  getDetailedTransactions,
  getTransactionSummary as getTransactionStats,
  getPaymentProviders,
  initiateTopUp
} from '../controllers/balanceController.js';
import { handleFlittCallback } from '../controllers/flittWebhookController.js';
import { handleBogCallback, handleBogPaymentDetails } from '../controllers/bogWebhookController.js';
import { authenticate } from '../middleware/auth.js';
import { AppDataSource } from '../config/database.js';
import { Transaction, TransactionStatusEnum, TransactionTypeEnum } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { BogPaymentService } from '../services/payments/BogPaymentService.js';
import { verifySinglePayment, paymentVerificationScheduler, verifyUserPendingPayments } from '../utils/paymentVerification.js';
import { LessThan, MoreThan } from 'typeorm';

const router = Router();

// Webhook endpoints (no authentication required)
router.post('/flitt/callback', handleFlittCallback);

// Flitt test endpoints for debugging
router.post('/flitt/test-callback', async (req: Request, res: Response) => {
  const {
    orderId,
    status = 'approved',
    responseStatus = 'success',
    amount = '100',
    actualAmount,
    paymentId = `test_${Date.now()}`,
    signature
  } = req.body;

  if (!orderId) {
    return res.status(400).json({
      error: 'Please provide orderId (the order ID from your transaction)'
    });
  }

  // Simulate Flitt callback format based on documentation
  const testCallback = {
    rrn: "111111111111",
    masked_card: "444455XXXXXX1111",
    sender_cell_phone: "",
    sender_account: "",
    currency: "GEL",
    fee: "",
    reversal_amount: "0",
    settlement_amount: "0",
    actual_amount: actualAmount || amount, // Amounts in callback are in GEL
    response_description: "",
    sender_email: "test@test.com",
    order_status: status, // 'approved' for success
    response_status: responseStatus, // 'success' for successful payment
    order_time: new Date().toISOString().replace('T', ' ').split('.')[0],
    actual_currency: "GEL",
    order_id: orderId,
    tran_type: "purchase",
    eci: "5",
    settlement_date: "",
    payment_system: "card",
    approval_code: "123456",
    merchant_id: process.env.FLITT_MERCHANT_ID || 1549901,
    settlement_currency: "",
    payment_id: paymentId,
    card_bin: 444455,
    response_code: "",
    card_type: "VISA",
    amount: amount, // Amount field in callback is in GEL
    signature: signature || "test_signature", // Will be recalculated if needed
    product_id: "",
    merchant_data: "Test merchant data",
    rectoken: "",
    rectoken_lifetime: "",
    verification_status: "",
    parent_order_id: "",
    fee_oplata: "0",
    additional_info: JSON.stringify({
      capture_status: null,
      capture_amount: null,
      reservation_data: "{}",
      transaction_id: Date.now(),
      bank_response_code: null,
      bank_response_description: null,
      client_fee: 0.0,
      settlement_fee: 0.0,
      bank_name: null,
      bank_country: null,
      card_type: "VISA",
      card_product: "empty_visa",
      card_category: null,
      timeend: new Date().toISOString().replace('T', ' ').split('.')[0],
      ipaddress_v4: "127.0.0.1",
      payment_method: "card",
      version_3ds: 1,
      is_test: true
    })
  };

  console.log('🧪 Simulating Flitt callback with:', {
    orderId,
    status,
    responseStatus,
    amount,
    actualAmount: testCallback.actual_amount
  });

  // Forward to actual Flitt callback handler
  req.body = testCallback;
  return handleFlittCallback(req, res);
});

// Test successful Flitt payment
router.post('/flitt/test-success/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { amount = '50' } = req.body;

  console.log(`🧪 Simulating successful Flitt payment for order ${orderId}`);

  req.body = {
    orderId,
    status: 'approved',
    responseStatus: 'success',
    amount,
    actualAmount: amount
  };

  return res.redirect(307, '/api/balance/flitt/test-callback');
});

// Test failed Flitt payment
router.post('/flitt/test-failed/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { reason = 'declined' } = req.body;

  console.log(`🧪 Simulating failed Flitt payment for order ${orderId}`);

  req.body = {
    orderId,
    status: reason,
    responseStatus: 'failure',
    amount: '50'
  };

  return res.redirect(307, '/api/balance/flitt/test-callback');
});

// Debug endpoint to check Flitt transactions
router.get('/flitt/debug/pending', async (req: Request, res: Response) => {
  try {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const pendingTransactions = await transactionRepository.find({
      where: {
        type: TransactionTypeEnum.TOP_UP,
        status: TransactionStatusEnum.PENDING,
        paymentMethod: 'flitt'
      },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });

    res.json({
      success: true,
      count: pendingTransactions.length,
      transactions: pendingTransactions.map(tx => ({
        uuid: tx.uuid,
        externalTransactionId: tx.externalTransactionId,
        amount: tx.amount,
        userId: tx.userId,
        userName: tx.user?.fullName,
        createdAt: tx.createdAt,
        metadata: tx.metadata
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to check Flitt transaction status by order ID
router.get('/flitt/debug/transaction/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const transactionRepository = AppDataSource.getRepository(Transaction);

    const transaction = await transactionRepository.findOne({
      where: { externalTransactionId: orderId },
      relations: ['user']
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction: {
        uuid: transaction.uuid,
        externalTransactionId: transaction.externalTransactionId,
        status: transaction.status,
        amount: parseFloat(transaction.amount.toString()),
        balanceBefore: transaction.balanceBefore ? parseFloat(transaction.balanceBefore.toString()) : null,
        balanceAfter: transaction.balanceAfter ? parseFloat(transaction.balanceAfter.toString()) : null,
        userId: transaction.userId,
        userName: transaction.user?.fullName,
        userCurrentBalance: transaction.user ? parseFloat(transaction.user.balance.toString()) : null,
        createdAt: transaction.createdAt,
        metadata: transaction.metadata,
        paymentMethod: transaction.paymentMethod
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enhanced BOG callback with comprehensive debugging
router.post('/bog/callback', (req: Request, res: Response, next: any) => {
  const timestamp = new Date().toISOString();
  console.log('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀');
  console.log(`🚀 [${timestamp}] BOG WEBHOOK RECEIVED!!!`);
  console.log('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀');
  console.log('📨 RAW BODY:', JSON.stringify(req.body, null, 2));
  console.log('🌍 CLIENT IP:', req.ip);
  console.log('🌍 X-FORWARDED-FOR:', req.headers['x-forwarded-for']);
  console.log('🔗 ALL HEADERS:', JSON.stringify(req.headers, null, 2));
  console.log('🔧 METHOD:', req.method);
  console.log('🔧 URL:', req.url);
  console.log('🔧 QUERY PARAMS:', JSON.stringify(req.query, null, 2));
  
  // Detailed structure analysis
  if (req.body) {
    console.log('🔍 STRUCTURE ANALYSIS:');
    console.log('  - order_id:', req.body.order_id);
    console.log('  - external_order_id:', req.body.external_order_id);
    console.log('  - order_status:', JSON.stringify(req.body.order_status, null, 2));
    console.log('  - payment_detail:', JSON.stringify(req.body.payment_detail, null, 2));
    console.log('  - purchase_units:', JSON.stringify(req.body.purchase_units, null, 2));
    
    // Check for status codes in different locations
    console.log('🔍 STATUS CODE LOCATIONS:');
    console.log('  - order_status?.key:', req.body.order_status?.key);
    console.log('  - order_status?.code:', req.body.order_status?.code);
    console.log('  - order_status?.value:', req.body.order_status?.value);
    console.log('  - payment_detail?.code:', req.body.payment_detail?.code);
    console.log('  - payment_detail?.code_description:', req.body.payment_detail?.code_description);
    console.log('  - status_code (root):', req.body.status_code);
    console.log('  - code (root):', req.body.code);
  }
  
  console.log('===============================================');
  
  // Continue to actual handler
  handleBogCallback(req, res);
});

// Debug endpoint to check pending BOG transactions (no auth for testing - temporarily)
router.get('/bog/debug/pending', async (req: Request, res: Response) => {
  try {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const pendingTransactions = await transactionRepository.find({
      where: {
        type: TransactionTypeEnum.TOP_UP,
        status: TransactionStatusEnum.PENDING,
        paymentMethod: 'bog'
      },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });

    res.json({
      success: true,
      count: pendingTransactions.length,
      transactions: pendingTransactions.map(tx => ({
        uuid: tx.uuid,
        externalTransactionId: tx.externalTransactionId, // Now should contain BOG order ID
        amount: tx.amount,
        userId: tx.userId,
        userName: tx.user?.fullName,
        createdAt: tx.createdAt,
        originalOrderId: tx.metadata?.originalOrderId, // Our internal order ID
        bogOrderId: tx.metadata?.bogOrderId, // BOG's order ID (should match externalTransactionId)
        metadata: tx.metadata
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test immediate verification (no auth for testing)
router.post('/bog/test-verify-user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }
    
    console.log(`🧪 Testing immediate verification for user ${userId}`);
    
    const results = await verifyUserPendingPayments(userId);
    
    return res.json({
      success: true,
      message: `Tested verification for user ${userId}`,
      results: results
    });
    
  } catch (error: any) {
    console.error('Test verification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to check what's happening with a specific transaction
router.get('/bog/debug/transaction/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    
    console.log(`🔍 DEBUGGING transaction ${transactionId}`);
    
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    // Find transaction by UUID or external ID
    const transaction = await transactionRepository.findOne({
      where: [
        { uuid: transactionId },
        { externalTransactionId: transactionId }
      ],
      relations: ['user']
    });
    
    if (!transaction) {
      res.status(404).json({
        error: 'Transaction not found'
      });
      return;
    }
    
    console.log(`📋 Transaction found:`, {
      uuid: transaction.uuid,
      externalTransactionId: transaction.externalTransactionId,
      status: transaction.status,
      amount: transaction.amount,
      userId: transaction.userId,
      paymentMethod: transaction.paymentMethod,
      metadata: transaction.metadata
    });
    
    // Try to get BOG order ID
    const bogOrderId = transaction.metadata?.bogOrderId || 
      (!transaction.externalTransactionId?.startsWith('topup_') ? transaction.externalTransactionId : null);
    
    let bogStatus = null;
    let bogError = null;
    
    if (bogOrderId && !bogOrderId.startsWith('topup_')) {
      try {
        console.log(`🔄 Checking BOG status for order ID: ${bogOrderId}`);
        const bogService = new BogPaymentService();
        const paymentDetails = await bogService.getPaymentDetails(bogOrderId);
        bogStatus = paymentDetails;
        console.log(`📊 BOG response:`, paymentDetails);
      } catch (error: any) {
        bogError = error.message;
        console.error(`❌ BOG API error:`, error.message);
      }
    }
    
    res.json({
      success: true,
      transaction: {
        uuid: transaction.uuid,
        externalTransactionId: transaction.externalTransactionId,
        status: transaction.status,
        amount: parseFloat(transaction.amount.toString()),
        userId: transaction.userId,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
        metadata: transaction.metadata,
        user: transaction.user ? {
          id: transaction.user.id,
          fullName: transaction.user.fullName,
          balance: parseFloat(transaction.user.balance.toString())
        } : null
      },
      bogOrderId: bogOrderId,
      bogStatus: bogStatus,
      bogError: bogError,
      canVerify: !!bogOrderId && !bogOrderId.startsWith('topup_')
    });
    return;
    
  } catch (error: any) {
    console.error('Debug transaction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
    return;
  }
});

// Test endpoint for simulating user return from BOG payment (no auth for testing)
router.post('/bog/test-return-from-payment/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }
    
    console.log(`🧪 Testing return-from-payment verification for user ${userId}`);
    
    // Simulate what would happen when user returns from BOG payment
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const recentPendingTransactions = await transactionRepository.find({
      where: {
        userId: userId,
        type: TransactionTypeEnum.TOP_UP,
        status: TransactionStatusEnum.PENDING,
        paymentMethod: 'bog',
        createdAt: MoreThan(tenMinutesAgo)
      },
      order: { createdAt: 'DESC' }
    });
    
    console.log(`📋 Found ${recentPendingTransactions.length} recent pending transactions for user ${userId}`);
    
    if (recentPendingTransactions.length === 0) {
      return res.json({
        success: true,
        message: `No recent pending BOG transactions found for user ${userId}`,
        foundTransactions: 0
      });
    }
    
    // Trigger verification
    const results = await verifyUserPendingPayments(userId);
    
    return res.json({
      success: true,
      message: `Simulated return from payment for user ${userId}`,
      foundTransactions: recentPendingTransactions.length,
      verificationResults: {
        total: results.length,
        completed: results.filter(r => r.status === 'completed').length,
        failed: results.filter(r => r.status === 'failed').length,
        pending: results.filter(r => r.status === 'pending').length,
        errors: results.filter(r => r.status === 'error').length
      },
      results: results.map(r => ({
        transactionId: r.transactionId,
        status: r.status,
        message: r.message
      }))
    });
    
  } catch (error: any) {
    console.error('Test return from payment error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to simulate BOG callback with proper status codes (no auth for testing)
router.post('/bog/test-callback', async (req: Request, res: Response) => {
  const { 
    bogOrderId, 
    externalOrderId, 
    statusCode = 100, // Default to successful payment
    statusKey = 'completed',
    statusDescription = 'წარმატებული გადახდა', // Georgian for "Successful payment"
    amount 
  } = req.body;
  
  if (!bogOrderId && !externalOrderId) {
    return res.status(400).json({
      error: 'Please provide either bogOrderId or externalOrderId',
      hint: 'For new transactions, use bogOrderId (BOG\'s order ID) for direct matching'
    });
  }
  
  // Get transaction to find the actual amount if not provided
  let transferAmount = amount || '100.00';
  if (!amount) {
    try {
      const transactionRepository = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepository.findOne({
        where: [
          { externalTransactionId: bogOrderId },
          { externalTransactionId: externalOrderId }
        ]
      });
      if (transaction) {
        transferAmount = transaction.amount.toString();
      }
    } catch (error) {
      console.error('Error fetching transaction for test:', error);
    }
  }
  
  // Simulate proper BOG callback format based on API docs
  const testCallback = {
    body: {
      order_id: bogOrderId,
      external_order_id: externalOrderId,
      order_status: {
        key: statusKey,
        value: statusDescription
      },
      purchase_units: {
        transfer_amount: transferAmount,
        currency_code: 'GEL'
      },
      payment_detail: {
        code: statusCode.toString(), // Status code is here according to BOG API docs
        code_description: statusCode === 100 ? 'Successful payment' : 'Payment failed',
        transaction_id: `test_${Date.now()}`,
        transfer_method: {
          key: 'card',
          value: 'ბარათი'
        }
      }
    }
  };
  
  console.log('🧪 Simulating BOG callback with:', {
    bogOrderId,
    externalOrderId,
    statusCode,
    statusKey,
    statusDescription,
    transferAmount
  });
  
  // Forward to actual BOG callback handler
  req.body = testCallback.body;
  return handleBogCallback(req, res);
});

// Quick test endpoints for different BOG status codes
router.post('/bog/test-success/:transactionId', async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  
  // Simulate successful payment callback (status code 100)
  return res.redirect(307, `/api/balance/bog/test-callback?bogOrderId=${transactionId}&statusCode=100&statusKey=completed&statusDescription=წარმატებული გადახდა`);
});

router.post('/bog/test-failed/:transactionId', async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  const { code = 107 } = req.body; // Default to insufficient funds
  
  const statusMessages = {
    101: 'გადახდა უარყოფილია, რადგან ბარათის გამოყენება შეზღუდულია',
    102: 'დამახსოვრებული ბარათი ვერ მოიძებნა', 
    103: 'გადახდა უარყოფილია, რადგან ბარათი არ არის ვალიდური',
    104: 'გადახდა უარყოფილია ტრანზაქციის რაოდენობის ლიმიტის გადაჭარბების გამო',
    105: 'გადახდა უარყოფილია, რადგან ბარათი ვადაგასულია',
    106: 'გადახდა უარყოფილია თანხის ლიმიტის გადაჭარბების გამო',
    107: 'გადახდა უარყოფილია ანგარიშზე არასაკმარისი თანხის გამო',
    108: 'გადახდის ავტორიზაციის უარყოფა',
    109: 'დაფიქსირდა ტექნიკური ხარვეზი',
    110: 'ოპერაციის შესრულების დრო ამოიწურა',
    111: 'გადახდის ავტორიზაციის დრო ამოიწურა',
    112: 'საერთო შეცდომა'
  };
  
  const statusDescription = statusMessages[code] || 'უცნობი შეცდომა';
  
  return res.redirect(307, `/api/balance/bog/test-callback?bogOrderId=${transactionId}&statusCode=${code}&statusKey=rejected&statusDescription=${encodeURIComponent(statusDescription)}`);
});

// Test endpoint with proper BOG API structure demonstration
router.post('/bog/test-complete-callback/:transactionId', async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  
  // Simulate complete BOG callback structure according to API docs
  const completeCallback = {
    order_id: transactionId,
    external_order_id: `external_${transactionId}`,
    industry: "ecommerce",
    capture: "automatic",
    order_status: {
      key: "completed",
      value: "წარმატებული გადახდა"
    },
    purchase_units: {
      transfer_amount: "50.00",
      currency_code: "GEL"
    },
    payment_detail: {
      code: "100",  // THIS IS THE KEY - status code 100 for success
      code_description: "Successful payment",
      transaction_id: `bog_${Date.now()}`,
      transfer_method: {
        key: "card", 
        value: "ბარათით გადახდა"
      },
      card_type: "visa",
      payer_identifier: "424242xxxxxx4242"
    }
  };
  
  console.log('🧪 Complete BOG callback test with proper API structure:');
  console.log(JSON.stringify(completeCallback, null, 2));
  
  // Forward to actual BOG callback handler
  req.body = completeCallback;
  return handleBogCallback(req, res);
});

// Raw BOG callback test - shows exactly what callback structure produces
router.post('/bog/raw-callback-test', async (req: Request, res: Response) => {
  console.log('🧪 RAW BOG CALLBACK TEST');
  console.log('📨 Received body:', JSON.stringify(req.body, null, 2));
  
  // Try processing with the actual webhook handler
  try {
    console.log('🔄 Processing with actual webhook handler...');
    const result = await handleBogPaymentDetails(req.body, res);
    console.log('✅ Webhook processing completed');
    return result;
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      receivedBody: req.body
    });
  }
});

// FORCE SUCCESS - Test endpoint to manually complete a transaction (for debugging)
router.post('/bog/force-success/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    
    console.log(`🔧 FORCE SUCCESS for transaction: ${transactionId}`);
    
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const userRepository = AppDataSource.getRepository(User);
    
    // Find transaction
    const transaction = await transactionRepository.findOne({
      where: [
        { uuid: transactionId },
        { externalTransactionId: transactionId }
      ],
      relations: ['user']
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    if (transaction.status === TransactionStatusEnum.COMPLETED) {
      return res.json({
        success: true,
        message: 'Transaction already completed',
        transaction: {
          id: transaction.uuid,
          status: transaction.status,
          amount: parseFloat(transaction.amount.toString()),
          balanceAfter: transaction.balanceAfter ? parseFloat(transaction.balanceAfter.toString()) : null
        }
      });
    }
    
    if (transaction.status !== TransactionStatusEnum.PENDING) {
      return res.status(400).json({
        success: false,
        error: `Cannot complete transaction with status: ${transaction.status}`
      });
    }
    
    // Force complete the transaction
    const user = await userRepository.findOne({
      where: { id: transaction.userId },
      select: ['id', 'balance']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const currentBalance = parseFloat(user.balance.toString());
    const topUpAmount = parseFloat(transaction.amount.toString());
    const newBalance = currentBalance + topUpAmount;
    
    console.log(`💰 FORCE SUCCESS - Balance update for user ${user.id}:`);
    console.log(`  Current balance: ${currentBalance} GEL`);
    console.log(`  Top-up amount: ${topUpAmount} GEL`);
    console.log(`  New balance: ${newBalance} GEL`);
    
    // Update transaction
    transaction.status = TransactionStatusEnum.COMPLETED;
    transaction.balanceAfter = newBalance;
    transaction.metadata = {
      ...transaction.metadata,
      completedAt: new Date().toISOString(),
      bogPaymentStatus: 'force_completed',
      paymentStatusCode: '100',
      paymentCodeDescription: 'Manually forced to success',
      forceCompletedAt: new Date().toISOString()
    };
    
    await transactionRepository.save(transaction);
    
    // Update user balance
    user.balance = newBalance;
    await userRepository.save(user);
    
    console.log(`✅ FORCE SUCCESS completed for transaction ${transactionId}`);
    
    return res.json({
      success: true,
      message: 'Transaction force completed successfully',
      transaction: {
        id: transaction.uuid,
        status: transaction.status,
        amount: topUpAmount,
        balanceAfter: newBalance,
        oldBalance: currentBalance,
        newBalance: newBalance
      },
      user: {
        id: user.id,
        oldBalance: currentBalance,
        newBalance: newBalance
      }
    });
    
  } catch (error: any) {
    console.error('Force success error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual BOG verification using BOG API (no auth for testing)
router.post('/bog/verify-by-api/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    
    console.log(`🔍 Manual BOG API verification for transaction: ${transactionId}`);
    
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    // Find transaction
    const transaction = await transactionRepository.findOne({
      where: [
        { uuid: transactionId },
        { externalTransactionId: transactionId }
      ],
      relations: ['user']
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Get BOG order ID
    const bogOrderId = transaction.metadata?.bogOrderId || 
      (!transaction.externalTransactionId?.startsWith('topup_') ? transaction.externalTransactionId : null);
    
    if (!bogOrderId || bogOrderId.startsWith('topup_')) {
      return res.status(400).json({
        success: false,
        error: 'No valid BOG order ID found for this transaction',
        transactionData: {
          uuid: transaction.uuid,
          externalTransactionId: transaction.externalTransactionId,
          metadata: transaction.metadata
        }
      });
    }
    
    console.log(`🔄 Checking BOG API for order: ${bogOrderId}`);
    
    const { BogPaymentService } = await import('../services/payments/BogPaymentService.js');
    const bogService = new BogPaymentService();
    
    try {
      const paymentDetails = await bogService.getPaymentDetails(bogOrderId);
      
      console.log(`📊 BOG API Response:`, {
        order_id: paymentDetails.order_id,
        order_status: paymentDetails.order_status,
        payment_detail: paymentDetails.payment_detail ? {
          code: paymentDetails.payment_detail.code,
          code_description: paymentDetails.payment_detail.code_description
        } : null,
        purchase_units: {
          transfer_amount: paymentDetails.purchase_units?.transfer_amount
        }
      });
      
      // Check if payment is completed according to BOG API docs
      const isCompleted = paymentDetails.order_status.key === 'completed' && 
                         paymentDetails.payment_detail?.code === '100';
      
      if (isCompleted) {
        console.log(`✅ Payment verified as completed! Processing via webhook handler...`);
        
        // Process via webhook handler
        const callbackData = {
          order_id: bogOrderId,
          external_order_id: transaction.metadata?.originalOrderId || transaction.uuid,
          order_status: paymentDetails.order_status,
          payment_detail: paymentDetails.payment_detail,
          purchase_units: paymentDetails.purchase_units
        };
        
        const { handleBogPaymentDetails } = await import('../controllers/bogWebhookController.js');
        const mockRes = {
          status: () => ({ json: (data: any) => console.log('Webhook response:', data), send: () => {} }),
          json: (data: any) => console.log('Webhook response:', data),
          send: () => {}
        } as any;
        
        await handleBogPaymentDetails(callbackData, mockRes);
        
        // Get updated transaction
        const updatedTransaction = await transactionRepository.findOne({
          where: { uuid: transaction.uuid },
          relations: ['user']
        });
        
        return res.json({
          success: true,
          message: 'Payment verified and processed successfully',
          bogOrderId: bogOrderId,
          bogResponse: paymentDetails,
          transaction: {
            id: updatedTransaction?.uuid,
            status: updatedTransaction?.status,
            amount: updatedTransaction ? parseFloat(updatedTransaction.amount.toString()) : null,
            balanceAfter: updatedTransaction?.balanceAfter ? parseFloat(updatedTransaction.balanceAfter.toString()) : null
          },
          userBalance: updatedTransaction?.user ? parseFloat(updatedTransaction.user.balance.toString()) : null
        });
        
      } else {
        return res.json({
          success: false,
          message: 'Payment not yet completed',
          bogOrderId: bogOrderId,
          currentStatus: {
            order_status: paymentDetails.order_status,
            payment_code: paymentDetails.payment_detail?.code,
            payment_description: paymentDetails.payment_detail?.code_description
          },
          isCompleted: false
        });
      }
      
    } catch (bogError: any) {
      console.error(`❌ BOG API Error:`, bogError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify payment with BOG API',
        bogError: bogError.message,
        bogOrderId: bogOrderId
      });
    }
    
  } catch (error: any) {
    console.error('Manual verification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin endpoint to cleanup old invalid transactions (no auth for testing)
router.post('/bog/cleanup', async (req: Request, res: Response) => {
  try {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    // Find old pending BOG transactions (more than 1 hour old for testing)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const oldTransactions = await transactionRepository.find({
      where: {
        type: TransactionTypeEnum.TOP_UP,
        status: TransactionStatusEnum.PENDING,
        paymentMethod: 'bog',
        createdAt: LessThan(oneHourAgo)
      }
    });
    
    if (oldTransactions.length === 0) {
      return res.json({
        success: true,
        message: 'No old pending transactions to cleanup',
        cleaned: 0
      });
    }
    
    let cleaned = 0;
    for (const transaction of oldTransactions) {
      const bogOrderId = transaction.metadata?.bogOrderId || 
        (!transaction.externalTransactionId?.startsWith('topup_') ? transaction.externalTransactionId : null);
      
      if (!bogOrderId || bogOrderId.startsWith('topup_')) {
        transaction.status = TransactionStatusEnum.FAILED;
        transaction.metadata = {
          ...transaction.metadata,
          cleanupReason: 'No valid BOG order ID found',
          cleanedUpAt: new Date().toISOString()
        };
        await transactionRepository.save(transaction);
        cleaned++;
      }
    }
    
    return res.json({
      success: true,
      message: `Cleaned up ${cleaned} invalid transactions`,
      total: oldTransactions.length,
      cleaned
    });
    
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cleanup transactions',
      error: error.message
    });
  }
});

// Manual payment verification endpoint (requires authentication)
router.post('/bog/verify/:transactionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    
    // Use the refactored verification utility
    const result = await verifySinglePayment(transactionId);
    
    if (result.status === 'error') {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    if (result.status === 'completed') {
      // Get updated transaction for response
      const transactionRepository = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepository.findOne({
        where: [
          { uuid: transactionId },
          { externalTransactionId: transactionId }
        ]
      });
      
      return res.json({
        success: true,
        message: result.message,
        data: {
          status: result.status,
          amount: transaction?.amount,
          balanceAfter: transaction?.balanceAfter,
          balanceUpdate: result.balanceUpdate
        }
      });
    }
    
    return res.json({
      success: result.status === 'pending',
      message: result.message,
      data: {
        status: result.status
      }
    });
    
  } catch (error: any) {
    console.error('Manual verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// Admin endpoint to manually run verification for all pending payments
router.post('/bog/verify-all', authenticate, async (req: Request, res: Response) => {
  try {
    const results = await paymentVerificationScheduler.runNow();
    
    const summary = {
      total: results.length,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
      pending: results.filter(r => r.status === 'pending').length,
      errors: results.filter(r => r.status === 'error').length
    };
    
    return res.json({
      success: true,
      message: 'Verification completed',
      summary,
      results
    });
    
  } catch (error: any) {
    console.error('Bulk verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to run bulk verification',
      error: error.message
    });
  }
});

// All other balance routes require authentication
router.use(authenticate);

// Aggressive verification endpoint - keeps checking until payment is found or timeout
router.post('/verify-payment-aggressive/:transactionId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { transactionId } = req.params;
    const maxAttempts = 30; // 30 attempts
    const intervalMs = 2000; // 2 seconds between attempts
    
    console.log(`🔥 AGGRESSIVE VERIFICATION started for transaction ${transactionId}, user ${userId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 Attempt ${attempt}/${maxAttempts} - Verifying transaction ${transactionId}`);
      
      // Check current transaction status first
      const transactionRepository = AppDataSource.getRepository(Transaction);
      const currentTransaction = await transactionRepository.findOne({
        where: [
          { uuid: transactionId, userId: userId },
          { externalTransactionId: transactionId, userId: userId }
        ]
      });
      
      if (!currentTransaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
        return;
      }
      
      // If already completed, return success immediately
      if (currentTransaction.status === TransactionStatusEnum.COMPLETED) {
        const userRepository = AppDataSource.getRepository(User);
        const currentUser = await userRepository.findOne({
          where: { id: userId },
          select: ['id', 'balance']
        });
        
        console.log(`✅ Transaction ${transactionId} already completed on attempt ${attempt}`);
        res.json({
          success: true,
          message: `Payment verified successfully on attempt ${attempt}`,
          currentBalance: currentUser ? parseFloat(currentUser.balance.toString()) : 0,
          transaction: {
            id: currentTransaction.uuid,
            status: currentTransaction.status,
            amount: parseFloat(currentTransaction.amount.toString()),
            balanceAfter: currentTransaction.balanceAfter ? parseFloat(currentTransaction.balanceAfter.toString()) : null
          },
          attempts: attempt,
          verified: true
        });
        return;
      }
      
      // If still pending, run verification
      if (currentTransaction.status === TransactionStatusEnum.PENDING) {
        console.log(`⏳ Transaction still pending, running verification...`);
        const results = await verifyUserPendingPayments(userId);
        
        // Check if this specific transaction was completed
        const thisTransactionResult = results.find(r => 
          r.transactionId === transactionId || 
          r.transactionId === currentTransaction.uuid
        );
        
        if (thisTransactionResult && thisTransactionResult.status === 'completed') {
          const userRepository = AppDataSource.getRepository(User);
          const updatedUser = await userRepository.findOne({
            where: { id: userId },
            select: ['id', 'balance']
          });
          
          console.log(`✅ Transaction ${transactionId} completed via verification on attempt ${attempt}`);
          res.json({
            success: true,
            message: `Payment verified and completed on attempt ${attempt}`,
            currentBalance: updatedUser ? parseFloat(updatedUser.balance.toString()) : 0,
            transaction: {
              id: currentTransaction.uuid,
              status: 'completed',
              amount: parseFloat(currentTransaction.amount.toString())
            },
            attempts: attempt,
            verified: true,
            balanceUpdate: thisTransactionResult.balanceUpdate
          });
          return;
        }
      }
      
      // If this isn't the last attempt, wait before trying again
      if (attempt < maxAttempts) {
        console.log(`⏱️ Waiting ${intervalMs}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    // If we get here, all attempts failed
    console.log(`❌ Aggressive verification failed after ${maxAttempts} attempts for transaction ${transactionId}`);
    
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'balance']
    });
    
    res.json({
      success: false,
      message: `Payment verification timeout after ${maxAttempts} attempts. Please try again or contact support.`,
      currentBalance: currentUser ? parseFloat(currentUser.balance.toString()) : 0,
      attempts: maxAttempts,
      verified: false,
      timeout: true
    });
    return;
    
  } catch (error: any) {
    console.error('Aggressive verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// Endpoint to call when user returns from payment (immediate verification)
router.post('/check-recent-payments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    console.log(`🔍 User ${userId} returned from payment - checking recent transactions`);

    // First get any recent pending transactions for this user (last 10 minutes)
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const recentPendingTransactions = await transactionRepository.find({
      where: {
        userId: userId,
        type: TransactionTypeEnum.TOP_UP,
        status: TransactionStatusEnum.PENDING,
        createdAt: MoreThan(tenMinutesAgo)
      },
      order: { createdAt: 'DESC' }
    });
    
    console.log(`📋 Found ${recentPendingTransactions.length} recent pending transactions for user ${userId}`);
    
    if (recentPendingTransactions.length === 0) {
      // Get current balance anyway
      const userRepository = AppDataSource.getRepository(User);
      const currentUser = await userRepository.findOne({
        where: { id: userId },
        select: ['id', 'balance']
      });
      
      res.json({
        success: true,
        message: 'No recent pending transactions found',
        currentBalance: currentUser ? parseFloat(currentUser.balance.toString()) : 0,
        verification: {
          total: 0,
          completed: 0,
          failed: 0,
          pending: 0,
          errors: 0
        },
        recentTransactions: []
      });
      return;
    }
    
    // Check for different payment methods and handle appropriately
    const flittTransactions = recentPendingTransactions.filter(tx => tx.paymentMethod === 'flitt');
    const bogTransactions = recentPendingTransactions.filter(tx => tx.paymentMethod === 'bog');

    console.log(`🚀 Found ${flittTransactions.length} Flitt and ${bogTransactions.length} BOG pending transactions`);

    let results = [];

    // For BOG transactions, trigger verification (requires API calls)
    if (bogTransactions.length > 0) {
      console.log(`🔄 Triggering BOG verification for ${bogTransactions.length} transactions`);
      results = await verifyUserPendingPayments(userId);
    }

    // For Flitt transactions, check if they were already completed by callback
    for (const flittTx of flittTransactions) {
      // Refresh transaction from database to see if callback already processed it
      const transactionRepository = AppDataSource.getRepository(Transaction);
      const updatedTx = await transactionRepository.findOne({
        where: { uuid: flittTx.uuid }
      });

      if (updatedTx) {
        if (updatedTx.status === TransactionStatusEnum.COMPLETED) {
          results.push({
            transactionId: updatedTx.uuid,
            status: 'completed',
            message: 'Flitt payment completed via callback',
            balanceUpdate: {
              added: parseFloat(updatedTx.amount.toString()),
              newBalance: updatedTx.balanceAfter ? parseFloat(updatedTx.balanceAfter.toString()) : null
            }
          });
        } else if (updatedTx.status === TransactionStatusEnum.FAILED) {
          results.push({
            transactionId: updatedTx.uuid,
            status: 'failed',
            message: 'Flitt payment failed'
          });
        } else {
          results.push({
            transactionId: updatedTx.uuid,
            status: 'pending',
            message: 'Flitt payment still pending (callback not yet received)'
          });
        }
      }
    }
    
    // Check if any payments were completed
    const completed = results.filter(r => r.status === 'completed');
    const failed = results.filter(r => r.status === 'failed');
    const pending = results.filter(r => r.status === 'pending');
    const errors = results.filter(r => r.status === 'error');
    
    // Get updated user balance
    const userRepository = AppDataSource.getRepository(User);
    const updatedUser = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'balance']
    });
    
    const response = {
      success: true,
      message: `Verified ${results.length} recent transactions`,
      currentBalance: updatedUser?.balance ? parseFloat(updatedUser.balance.toString()) : 0,
      verification: {
        total: results.length,
        completed: completed.length,
        failed: failed.length,
        pending: pending.length,
        errors: errors.length
      },
      results: results.map(r => ({
        transactionId: r.transactionId,
        status: r.status,
        message: r.message,
        balanceUpdate: r.balanceUpdate
      })),
      // Indicate if user should refresh their balance
      balanceUpdated: completed.length > 0,
      // Include recent transaction info
      recentTransactions: recentPendingTransactions.map(tx => ({
        id: tx.uuid,
        amount: parseFloat(tx.amount.toString()),
        createdAt: tx.createdAt.toISOString(),
        status: tx.status
      }))
    };
    
    if (completed.length > 0) {
      console.log(`✅ User ${userId} returned from payment: ${completed.length} payments completed, balance updated`);
    } else {
      console.log(`⏳ User ${userId} returned from payment: no payments completed yet`);
    }
    
    res.json(response);
    
  } catch (error: any) {
    console.error('Recent payment check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify recent payments',
      error: error.message
    });
  }
});

// Immediate payment verification for current user
router.post('/verify-payments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    console.log(`🔄 Immediate verification requested for user ${userId}`);
    
    // Verify all pending payments for this user
    const results = await verifyUserPendingPayments(userId);
    
    // Check if any payments were completed
    const completed = results.filter(r => r.status === 'completed');
    const failed = results.filter(r => r.status === 'failed');
    const pending = results.filter(r => r.status === 'pending');
    const errors = results.filter(r => r.status === 'error');
    
    // Get updated user balance
    const userRepository = AppDataSource.getRepository(User);
    const updatedUser = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'balance']
    });
    
    const response = {
      success: true,
      message: `Verified ${results.length} pending transactions`,
      currentBalance: updatedUser?.balance ? parseFloat(updatedUser.balance.toString()) : 0,
      verification: {
        total: results.length,
        completed: completed.length,
        failed: failed.length,
        pending: pending.length,
        errors: errors.length
      },
      results: results.map(r => ({
        transactionId: r.transactionId,
        status: r.status,
        message: r.message,
        balanceUpdate: r.balanceUpdate
      })),
      // Indicate if user should refresh their balance
      balanceUpdated: completed.length > 0
    };
    
    if (completed.length > 0) {
      console.log(`✅ User ${userId}: ${completed.length} payments completed, balance updated`);
    }
    
    res.json(response);
    
  } catch (error: any) {
    console.error('Immediate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payments',
      error: error.message
    });
  }
});

// Check payment status for a specific transaction (for polling)
router.get('/payment-status/:transactionId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { transactionId } = req.params;
    
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    // Find the transaction for this user
    const transaction = await transactionRepository.findOne({
      where: [
        { uuid: transactionId, userId: userId },
        { externalTransactionId: transactionId, userId: userId }
      ],
      select: ['uuid', 'status', 'amount', 'balanceAfter', 'createdAt', 'metadata']
    });
    
    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
      return;
    }
    
    // If still pending, trigger immediate verification for this user
    let verificationTriggered = false;
    if (transaction.status === TransactionStatusEnum.PENDING) {
      verificationTriggered = true;
      console.log(`🔄 Payment status check: triggering verification for pending transaction ${transactionId}`);
      
      // Trigger async verification without waiting (but log the results)
      verifyUserPendingPayments(userId).then(results => {
        const completed = results.filter(r => r.status === 'completed').length;
        if (completed > 0) {
          console.log(`✅ Background verification completed ${completed} payments for user ${userId} during status check`);
        }
      }).catch(error => {
        console.error(`Background verification error for user ${userId}:`, error);
      });
    }
    
    // Get current user balance
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'balance']
    });
    
    res.json({
      success: true,
      transaction: {
        id: transaction.uuid,
        status: transaction.status,
        amount: parseFloat(transaction.amount.toString()),
        balanceAfter: transaction.balanceAfter ? parseFloat(transaction.balanceAfter.toString()) : null,
        createdAt: transaction.createdAt.toISOString(),
        isPending: transaction.status === TransactionStatusEnum.PENDING,
        isCompleted: transaction.status === TransactionStatusEnum.COMPLETED,
        isFailed: transaction.status === TransactionStatusEnum.FAILED
      },
      currentBalance: currentUser ? parseFloat(currentUser.balance.toString()) : 0,
      verificationTriggered: verificationTriggered
    });
    
  } catch (error: any) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
});

// Get user balance and recent transactions
router.get('/', getUserBalance);

// Get available payment providers
router.get('/providers', getPaymentProviders);

// Initiate top-up process (creates payment order)
router.post('/initiate', initiateTopUp);

// Legacy top-up endpoint (for backward compatibility)
router.post('/top-up', processTopUp);

// Get transaction history with pagination
router.get('/transactions', getTransactionHistory);

// Get detailed transaction history with service information
router.get('/transactions/detailed', getDetailedTransactions);

// Get transaction summary statistics
router.get('/transactions/summary', getTransactionStats);

export default router;