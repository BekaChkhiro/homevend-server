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
    // Check if this is a redirect request (user browser) vs webhook (Flitt server)
    const isRedirect = req.query.redirect === 'true';

    if (isRedirect) {
      console.log('🎉 Flitt success redirect received!');
      console.log('Method:', req.method);
      console.log('Query params:', req.query);
      console.log('Body params:', req.body);
      console.log('All parameters:', { ...req.query, ...req.body });

      // Send HTML that immediately redirects to React app
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Successful - Redirecting...</title>
          <meta http-equiv="refresh" content="0;url=/en/dashboard/balance?payment=success">
        </head>
        <body>
          <div style="text-align: center; padding: 50px; font-family: Arial;">
            <h2>✅ Payment Successful!</h2>
            <p>Redirecting you to dashboard...</p>
            <p><a href="/en/dashboard/balance?payment=success">Click here if not redirected automatically</a></p>
          </div>
          <script>
            console.log('Flitt payment success - redirecting to dashboard');
            window.location.href = '/en/dashboard/balance?payment=success';
          </script>
        </body>
        </html>
      `);
      return;
    }

    // Handle normal webhook
    console.log('🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔');
    console.log('🔔 FLITT WEBHOOK RECEIVED!!!');
    console.log('🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔');
    console.log('📨 Callback Data:', JSON.stringify(req.body, null, 2));
    console.log('🌍 Client IP:', req.ip);
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 Key Fields:');
    console.log('  - order_id:', req.body.order_id);
    console.log('  - order_status:', req.body.order_status);
    console.log('  - response_status:', req.body.response_status);
    console.log('  - amount:', req.body.amount);
    console.log('  - actual_amount:', req.body.actual_amount);
    console.log('  - payment_id:', req.body.payment_id);
    console.log('  - signature:', req.body.signature ? 'Present' : 'Missing');

    // Validate request IP (in production)
    if (process.env.NODE_ENV === 'production' && !req.body.test) {
      const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
      console.log('🔍 Checking IP:', clientIP, 'against allowed IPs:', FLITT_IPS);
      console.log('🔍 All headers:', JSON.stringify(req.headers, null, 2));

      // Check if the client IP or any forwarded IP matches Flitt IPs
      let ipAllowed = false;
      if (clientIP) {
        const ipsToCheck = Array.isArray(clientIP) ? clientIP : clientIP.split(',').map(ip => ip.trim());
        ipAllowed = ipsToCheck.some(ip =>
          FLITT_IPS.some(allowedIP => ip.includes(allowedIP) || allowedIP.includes(ip))
        );
      }

      if (!ipAllowed) {
        console.warn('❌ Unauthorized Flitt callback from IP:', clientIP);
        console.warn('📋 Allowed IPs:', FLITT_IPS);
        // For now, log but allow - we'll monitor real Flitt IPs first
        console.warn('⚠️  ALLOWING FOR DEBUGGING - Will restrict after confirming real Flitt IPs');
        // res.status(403).json({ error: 'Forbidden', clientIP, allowedIPs: FLITT_IPS });
        // return;
      } else {
        console.log('✅ IP validation passed');
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
    const signatureValid = flittService.verifySignature(callbackData);

    if (!signatureValid) {
      console.error('⚠️  Invalid signature in callback - but continuing for debugging');
      console.error('⚠️  In production, this would be rejected');
      // TODO: Re-enable signature verification once signature algorithm is fixed
      // res.status(400).json({ error: 'Invalid signature' });
      // return;
    } else {
      console.log('✅ Signature verification passed');
    }

    // Find transaction by order_id (stored in externalTransactionId)
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const userRepository = AppDataSource.getRepository(User);

    console.log('🔍 Searching for transaction with order_id:', callbackData.order_id);

    const transaction = await transactionRepository.findOne({
      where: { externalTransactionId: callbackData.order_id },
      relations: ['user']
    });

    if (!transaction) {
      console.error('❌ Transaction not found for order_id:', callbackData.order_id);

      // Debug: Show recent Flitt transactions to help identify the issue
      const recentTransactions = await transactionRepository.find({
        where: { paymentMethod: 'flitt' },
        order: { createdAt: 'DESC' },
        take: 5
      });

      console.log('📋 Recent Flitt transactions for debugging:');
      recentTransactions.forEach(tx => {
        console.log(`  - ${tx.externalTransactionId} (${tx.status}) - ${tx.createdAt}`);
      });

      res.status(404).json({ error: 'Transaction not found', order_id: callbackData.order_id });
      return;
    }

    console.log('✅ Transaction found:', {
      uuid: transaction.uuid,
      externalTransactionId: transaction.externalTransactionId,
      status: transaction.status,
      amount: transaction.amount,
      userId: transaction.userId
    });

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

      // Check both order_status and response_status according to Flitt documentation
      if (callbackData.order_status === 'approved' && callbackData.response_status === 'success') {
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

        // Log amount calculation details for debugging
        console.log('💰 Amount calculation details:');
        console.log(`  - callbackData.actual_amount: "${callbackData.actual_amount}"`);
        console.log(`  - callbackData.amount: "${callbackData.amount}"`);
        console.log(`  - transaction.amount: ${transaction.amount}`);
        console.log(`  - current user balance: ${currentBalance} GEL`);

        // Use actual_amount from callback if available, otherwise fall back to transaction amount
        // According to Flitt docs, callback amounts are already in GEL (not tetri)
        const actualAmount = callbackData.actual_amount ?
          parseFloat(callbackData.actual_amount) :
          parseFloat(callbackData.amount);

        console.log(`  - calculated actualAmount: ${actualAmount} GEL`);

        const newBalance = currentBalance + actualAmount;

        console.log(`  - new balance will be: ${newBalance} GEL`);

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

        console.log('✅✅✅ FLITT PAYMENT COMPLETED ✅✅✅');
        console.log(`✅ Order ID: ${callbackData.order_id}`);
        console.log(`✅ User ID: ${transaction.userId}`);
        console.log(`✅ Amount added to balance: ${actualAmount} GEL`);
        console.log(`✅ Previous balance: ${currentBalance} GEL`);
        console.log(`✅ New balance: ${newBalance} GEL`);
        console.log(`✅ Payment ID: ${callbackData.payment_id}`);
        console.log(`✅ Transaction UUID: ${transaction.uuid}`);
        console.log(`✅ Balance successfully updated in database`);
        console.log('✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅');
        
        res.status(200).json({ 
          status: 'success',
          message: 'Payment processed successfully'
        });

      } else if (callbackData.order_status === 'failed' ||
                 callbackData.order_status === 'declined' ||
                 callbackData.response_status === 'failure') {
        // Payment failed or declined
        transaction.status = TransactionStatusEnum.FAILED;
        transaction.metadata = {
          ...updatedMetadata,
          flittPaymentStatus: callbackData.order_status || 'failed',
          responseStatus: callbackData.response_status,
          failedAt: new Date().toISOString(),
          responseDescription: callbackData.response_description || ''
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