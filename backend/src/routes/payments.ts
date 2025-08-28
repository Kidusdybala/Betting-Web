import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { depositValidation, withdrawalValidation } from '../middleware/validation';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { get, run, nowIso, generateId, all } from '../utils/db';

const router = express.Router();

// Deposit money
router.post('/deposit', authenticateToken, depositValidation, async (req: AuthRequest, res, next) => {
  try {
    const { amount } = req.body as { amount: number; paymentMethod: string; paymentDetails?: any };
    const userId = req.user!.id;

    const transactionId = generateId();
    run(
      `INSERT INTO transactions (id, user_id, type, amount, status, reference, created_at)
       VALUES (?, ?, 'deposit', ?, 'pending', ?, ?)`,
      [transactionId, userId, amount, `dep_${Date.now()}_${userId.slice(-6)}`, nowIso()]
    );

    // Simulate async completion
    setTimeout(() => {
      try {
        run(`UPDATE transactions SET status = 'completed' WHERE id = ?`, [transactionId]);
        const user = get<{ balance: number }>('SELECT balance FROM users WHERE id = ? LIMIT 1', [userId]);
        if (user) {
          run('UPDATE users SET balance = ? WHERE id = ?', [user.balance + amount, userId]);
        }
        logger.info(`Deposit completed: ${transactionId} for user ${userId}`);
      } catch (e) {
        logger.error('Error completing deposit:', e);
        run(`UPDATE transactions SET status = 'failed' WHERE id = ?`, [transactionId]);
      }
    }, 2000);

    const tx = get<any>('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    res.status(201).json({
      success: true,
      message: 'Deposit initiated successfully',
      data: { transaction: { id: tx.id, amount: tx.amount, status: tx.status, reference: tx.reference, created_at: tx.created_at } }
    });
  } catch (error) {
    logger.error('Error processing deposit:', error);
    next(createError('Failed to process deposit', 500));
  }
});

// Withdraw money
router.post('/withdraw', authenticateToken, withdrawalValidation, async (req: AuthRequest, res, next) => {
  try {
    const { amount } = req.body as { amount: number; paymentMethod: string; accountDetails?: any };
    const userId = req.user!.id;

    const user = get<{ balance: number }>('SELECT balance FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!user) return next(createError('User not found', 404));
    if (user.balance < amount) return next(createError('Insufficient balance', 400));

    const pending = all<any>('SELECT id FROM bets WHERE user_id = ? AND status = "pending"', [userId]);
    if (pending.length > 0) return next(createError('Cannot withdraw with pending bets', 400));

    const transactionId = generateId();
    run(
      `INSERT INTO transactions (id, user_id, type, amount, status, reference, created_at)
       VALUES (?, ?, 'withdrawal', ?, 'pending', ?, ?)`,
      [transactionId, userId, -amount, `wth_${Date.now()}_${userId.slice(-6)}`, nowIso()]
    );

    // Hold funds immediately
    run('UPDATE users SET balance = ? WHERE id = ?', [user.balance - amount, userId]);

    logger.info(`Withdrawal initiated: ${transactionId} for user ${userId}`);

    const tx = get<any>('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    res.status(201).json({
      success: true,
      message: 'Withdrawal initiated successfully',
      data: { transaction: { id: tx.id, amount: Math.abs(tx.amount), status: tx.status, reference: tx.reference, created_at: tx.created_at } }
    });
  } catch (error) {
    logger.error('Error processing withdrawal:', error);
    next(createError('Failed to process withdrawal', 500));
  }
});

// Get payment methods
router.get('/methods', (req, res) => {
  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', type: 'card', minAmount: 10, maxAmount: 50000, processingTime: 'Instant', fees: '2.5%', available: true },
    { id: 'bank_transfer', name: 'Bank Transfer', type: 'bank', minAmount: 50, maxAmount: 100000, processingTime: '1-3 business days', fees: 'Free', available: true },
    { id: 'mobile_money', name: 'Mobile Money', type: 'mobile', minAmount: 10, maxAmount: 25000, processingTime: 'Instant', fees: '1.5%', available: true },
  ];
  res.json({ success: true, data: { paymentMethods } });
});

// Get transaction by ID
router.get('/transaction/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const transaction = get<any>(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ? LIMIT 1',
      [id, userId]
    );

    if (!transaction) return next(createError('Transaction not found', 404));

    res.json({ success: true, data: { transaction } });
  } catch (error) {
    logger.error('Error fetching transaction:', error);
    next(createError('Failed to fetch transaction', 500));
  }
});

// Get payment history
router.get('/history', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const offset = (page - 1) * limit;

    const filters = ['user_id = ?','type IN ("deposit","withdrawal")'];
    const params: any[] = [userId];
    if (type && ['deposit','withdrawal'].includes(type)) {
      filters.push('type = ?');
      params.push(type);
    }

    const where = `WHERE ${filters.join(' AND ')}`;

    const transactions = all<any>(
      `SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const countRow = get<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM transactions ${where}`, params) || { cnt: 0 };
    const totalPages = Math.ceil((countRow.cnt || 0) / limit);

    res.json({ success: true, data: { transactions, pagination: { currentPage: page, totalPages, totalItems: countRow.cnt, itemsPerPage: limit } } });
  } catch (error) {
    logger.error('Error in payment history route:', error);
    next(createError('Failed to fetch payment history', 500));
  }
});

// Webhook endpoint for payment processor callbacks (simulated)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = JSON.parse(req.body.toString());
    logger.info('Webhook received:', event);
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;