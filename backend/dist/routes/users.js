"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
const db_1 = require("../utils/db");
const router = express_1.default.Router();
router.get('/profile', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = (0, db_1.get)('SELECT id, email, full_name, balance, created_at, updated_at FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!user)
            return next((0, errorHandler_1.createError)('User not found', 404));
        res.json({ success: true, data: { user } });
    }
    catch (error) {
        logger_1.logger.error('Error fetching user profile:', error);
        next((0, errorHandler_1.createError)('Failed to fetch profile', 500));
    }
});
router.put('/profile', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { fullName } = req.body;
        (0, db_1.run)('UPDATE users SET full_name = ?, updated_at = ? WHERE id = ?', [fullName, (0, db_1.nowIso)(), userId]);
        const user = (0, db_1.get)('SELECT id, email, full_name, balance, created_at, updated_at FROM users WHERE id = ? LIMIT 1', [userId]);
        res.json({ success: true, message: 'Profile updated successfully', data: { user } });
    }
    catch (error) {
        logger_1.logger.error('Error in update profile route:', error);
        next((0, errorHandler_1.createError)('Failed to update profile', 500));
    }
});
router.get('/balance', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const row = (0, db_1.get)('SELECT balance FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!row)
            return next((0, errorHandler_1.createError)('User not found', 404));
        res.json({ success: true, data: { balance: row.balance } });
    }
    catch (error) {
        logger_1.logger.error('Error fetching user balance:', error);
        next((0, errorHandler_1.createError)('Failed to fetch balance', 500));
    }
});
router.get('/transactions', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type;
        const offset = (page - 1) * limit;
        const filters = ['user_id = ?'];
        const params = [userId];
        if (type) {
            filters.push('type = ?');
            params.push(type);
        }
        const where = `WHERE ${filters.join(' AND ')}`;
        const transactions = (0, db_1.all)(`SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
        const countRow = (0, db_1.get)(`SELECT COUNT(*) as cnt FROM transactions ${where}`, params) || { cnt: 0 };
        const totalPages = Math.ceil((countRow.cnt || 0) / limit);
        res.json({
            success: true,
            data: { transactions, pagination: { currentPage: page, totalPages, totalItems: countRow.cnt, itemsPerPage: limit } }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in transactions route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch transactions', 500));
    }
});
router.get('/stats', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const bets = (0, db_1.all)('SELECT status, stake, potential_win, placed_at FROM bets WHERE user_id = ?', [userId]);
        const transactions = (0, db_1.all)('SELECT type, amount, created_at FROM transactions WHERE user_id = ?', [userId]);
        const totalBets = bets.length;
        const wonBets = bets.filter(b => b.status === 'won').length;
        const lostBets = bets.filter(b => b.status === 'lost').length;
        const pendingBets = bets.filter(b => b.status === 'pending').length;
        const totalStaked = bets.reduce((s, b) => s + b.stake, 0);
        const totalWon = bets.filter(b => b.status === 'won').reduce((s, b) => s + b.potential_win, 0);
        const netProfit = totalWon - totalStaked;
        const winRate = (wonBets + lostBets) > 0 ? parseFloat(((wonBets / (wonBets + lostBets)) * 100).toFixed(2)) : 0;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const recentBets = bets.filter(b => b.placed_at >= thirtyDaysAgo);
        const recentTransactions = transactions.filter(t => t.created_at >= thirtyDaysAgo);
        const stats = {
            betting: {
                totalBets,
                wonBets,
                lostBets,
                pendingBets,
                totalStaked,
                totalWon,
                netProfit,
                winRate,
                averageStake: totalBets > 0 ? parseFloat((totalStaked / totalBets).toFixed(2)) : 0
            },
            financial: {
                totalDeposits: transactions.filter(t => t.type === 'deposit' && t.amount > 0).reduce((s, t) => s + t.amount, 0),
                totalWithdrawals: transactions.filter(t => t.type === 'withdrawal' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
                netDeposits: transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0) -
                    transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount), 0)
            },
            recent: {
                betsLast30Days: recentBets.length,
                transactionsLast30Days: recentTransactions.length,
                stakedLast30Days: recentBets.reduce((s, b) => s + b.stake, 0),
                wonLast30Days: recentBets.filter(b => b.status === 'won').length
            }
        };
        res.json({ success: true, data: { stats } });
    }
    catch (error) {
        logger_1.logger.error('Error in user stats route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch statistics', 500));
    }
});
router.get('/favorites', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const betHistory = (0, db_1.all)(`SELECT m.home_team, m.away_team, m.league
       FROM bets b JOIN matches m ON m.id = b.match_id
       WHERE b.user_id = ?`, [userId]);
        const teamCounts = {};
        const leagueCounts = {};
        betHistory.forEach((row) => {
            teamCounts[row.home_team] = (teamCounts[row.home_team] || 0) + 1;
            teamCounts[row.away_team] = (teamCounts[row.away_team] || 0) + 1;
            leagueCounts[row.league] = (leagueCounts[row.league] || 0) + 1;
        });
        const favoriteTeams = Object.entries(teamCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([team, count]) => ({ team, bets: count }));
        const favoriteLeagues = Object.entries(leagueCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([league, count]) => ({ league, bets: count }));
        res.json({ success: true, data: { favoriteTeams, favoriteLeagues } });
    }
    catch (error) {
        logger_1.logger.error('Error in favorites route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch favorites', 500));
    }
});
router.put('/password', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            return next((0, errorHandler_1.createError)('Current password and new password are required', 400));
        if (newPassword.length < 6)
            return next((0, errorHandler_1.createError)('New password must be at least 6 characters long', 400));
        const user = (0, db_1.get)('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!user)
            return next((0, errorHandler_1.createError)('User not found', 404));
        res.json({ success: true, message: 'Password updated successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error in change password route:', error);
        next((0, errorHandler_1.createError)('Failed to change password', 500));
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map