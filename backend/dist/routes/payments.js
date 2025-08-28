"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
const db_1 = require("../utils/db");
const router = express_1.default.Router();
router.post('/deposit', auth_1.authenticateToken, validation_1.depositValidation, async (req, res, next) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        const transactionId = (0, db_1.generateId)();
        (0, db_1.run)(`INSERT INTO transactions (id, user_id, type, amount, status, reference, created_at)
       VALUES (?, ?, 'deposit', ?, 'pending', ?, ?)`, [transactionId, userId, amount, `dep_${Date.now()}_${userId.slice(-6)}`, (0, db_1.nowIso)()]);
        setTimeout(() => {
            try {
                (0, db_1.run)(`UPDATE transactions SET status = 'completed' WHERE id = ?`, [transactionId]);
                const user = (0, db_1.get)('SELECT balance FROM users WHERE id = ? LIMIT 1', [userId]);
                if (user) {
                    (0, db_1.run)('UPDATE users SET balance = ? WHERE id = ?', [user.balance + amount, userId]);
                }
                logger_1.logger.info(`Deposit completed: ${transactionId} for user ${userId}`);
            }
            catch (e) {
                logger_1.logger.error('Error completing deposit:', e);
                (0, db_1.run)(`UPDATE transactions SET status = 'failed' WHERE id = ?`, [transactionId]);
            }
        }, 2000);
        const tx = (0, db_1.get)('SELECT * FROM transactions WHERE id = ?', [transactionId]);
        res.status(201).json({
            success: true,
            message: 'Deposit initiated successfully',
            data: { transaction: { id: tx.id, amount: tx.amount, status: tx.status, reference: tx.reference, created_at: tx.created_at } }
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing deposit:', error);
        next((0, errorHandler_1.createError)('Failed to process deposit', 500));
    }
});
router.post('/withdraw', auth_1.authenticateToken, validation_1.withdrawalValidation, async (req, res, next) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        const user = (0, db_1.get)('SELECT balance FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!user)
            return next((0, errorHandler_1.createError)('User not found', 404));
        if (user.balance < amount)
            return next((0, errorHandler_1.createError)('Insufficient balance', 400));
        const pending = (0, db_1.all)('SELECT id FROM bets WHERE user_id = ? AND status = "pending"', [userId]);
        if (pending.length > 0)
            return next((0, errorHandler_1.createError)('Cannot withdraw with pending bets', 400));
        const transactionId = (0, db_1.generateId)();
        (0, db_1.run)(`INSERT INTO transactions (id, user_id, type, amount, status, reference, created_at)
       VALUES (?, ?, 'withdrawal', ?, 'pending', ?, ?)`, [transactionId, userId, -amount, `wth_${Date.now()}_${userId.slice(-6)}`, (0, db_1.nowIso)()]);
        (0, db_1.run)('UPDATE users SET balance = ? WHERE id = ?', [user.balance - amount, userId]);
        logger_1.logger.info(`Withdrawal initiated: ${transactionId} for user ${userId}`);
        const tx = (0, db_1.get)('SELECT * FROM transactions WHERE id = ?', [transactionId]);
        res.status(201).json({
            success: true,
            message: 'Withdrawal initiated successfully',
            data: { transaction: { id: tx.id, amount: Math.abs(tx.amount), status: tx.status, reference: tx.reference, created_at: tx.created_at } }
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing withdrawal:', error);
        next((0, errorHandler_1.createError)('Failed to process withdrawal', 500));
    }
});
router.get('/methods', (req, res) => {
    const paymentMethods = [
        { id: 'card', name: 'Credit/Debit Card', type: 'card', minAmount: 10, maxAmount: 50000, processingTime: 'Instant', fees: '2.5%', available: true },
        { id: 'bank_transfer', name: 'Bank Transfer', type: 'bank', minAmount: 50, maxAmount: 100000, processingTime: '1-3 business days', fees: 'Free', available: true },
        { id: 'mobile_money', name: 'Mobile Money', type: 'mobile', minAmount: 10, maxAmount: 25000, processingTime: 'Instant', fees: '1.5%', available: true },
    ];
    res.json({ success: true, data: { paymentMethods } });
});
router.get('/transaction/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const transaction = (0, db_1.get)('SELECT * FROM transactions WHERE id = ? AND user_id = ? LIMIT 1', [id, userId]);
        if (!transaction)
            return next((0, errorHandler_1.createError)('Transaction not found', 404));
        res.json({ success: true, data: { transaction } });
    }
    catch (error) {
        logger_1.logger.error('Error fetching transaction:', error);
        next((0, errorHandler_1.createError)('Failed to fetch transaction', 500));
    }
});
router.get('/history', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type;
        const offset = (page - 1) * limit;
        const filters = ['user_id = ?', 'type IN ("deposit","withdrawal")'];
        const params = [userId];
        if (type && ['deposit', 'withdrawal'].includes(type)) {
            filters.push('type = ?');
            params.push(type);
        }
        const where = `WHERE ${filters.join(' AND ')}`;
        const transactions = (0, db_1.all)(`SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
        const countRow = (0, db_1.get)(`SELECT COUNT(*) as cnt FROM transactions ${where}`, params) || { cnt: 0 };
        const totalPages = Math.ceil((countRow.cnt || 0) / limit);
        res.json({ success: true, data: { transactions, pagination: { currentPage: page, totalPages, totalItems: countRow.cnt, itemsPerPage: limit } } });
    }
    catch (error) {
        logger_1.logger.error('Error in payment history route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch payment history', 500));
    }
});
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const event = JSON.parse(req.body.toString());
        logger_1.logger.info('Webhook received:', event);
        res.status(200).json({ received: true });
    }
    catch (error) {
        logger_1.logger.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
exports.default = router;
//# sourceMappingURL=payments.js.map