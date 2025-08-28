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
router.post('/', auth_1.authenticateToken, validation_1.placeBetValidation, async (req, res, next) => {
    try {
        const { matchId, betType, stake, odds } = req.body;
        const userId = req.user.id;
        const result = (0, db_1.transaction)(() => {
            const user = (0, db_1.get)('SELECT balance FROM users WHERE id = ? LIMIT 1', [userId]);
            if (!user)
                throw (0, errorHandler_1.createError)('User not found', 404);
            if (user.balance < stake)
                throw (0, errorHandler_1.createError)('Insufficient balance', 400);
            const match = (0, db_1.get)('SELECT id, status, start_time FROM matches WHERE id = ? LIMIT 1', [matchId]);
            if (!match)
                throw (0, errorHandler_1.createError)('Match not found', 404);
            if (match.status !== 'upcoming')
                throw (0, errorHandler_1.createError)('Betting is not available for this match', 400);
            const matchStartTime = new Date(match.start_time);
            const now = new Date();
            const minutesDiff = (matchStartTime.getTime() - now.getTime()) / (1000 * 60);
            if (minutesDiff < 5)
                throw (0, errorHandler_1.createError)('Betting closed - match starts soon', 400);
            const potentialWin = stake * odds;
            const id = (0, db_1.generateId)();
            (0, db_1.run)(`INSERT INTO bets (id, user_id, match_id, bet_type, odds, stake, potential_win, status, placed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`, [id, userId, matchId, betType, odds, stake, potentialWin, (0, db_1.nowIso)()]);
            (0, db_1.run)('UPDATE users SET balance = ? WHERE id = ?', [user.balance - stake, userId]);
            (0, db_1.run)(`INSERT INTO transactions (id, user_id, type, amount, status, reference, created_at)
         VALUES (?, ?, 'bet_stake', ?, 'completed', ?, ?)`, [(0, db_1.generateId)(), userId, -stake, id, (0, db_1.nowIso)()]);
            return id;
        });
        const bet = (0, db_1.get)('SELECT * FROM bets WHERE id = ?', [result]);
        logger_1.logger.info(`Bet placed: ${bet.id} by user ${req.user.id}`);
        res.status(201).json({ success: true, message: 'Bet placed successfully', data: { bet } });
    }
    catch (error) {
        logger_1.logger.error('Error placing bet:', error);
        const status = error?.statusCode || 500;
        next((0, errorHandler_1.createError)(error instanceof Error ? error.message : 'Failed to place bet', status));
    }
});
router.get('/my-bets', auth_1.authenticateToken, validation_1.paginationValidation, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const offset = (page - 1) * limit;
        const filters = ['user_id = ?'];
        const params = [userId];
        if (status) {
            filters.push('status = ?');
            params.push(status);
        }
        const where = `WHERE ${filters.join(' AND ')}`;
        const bets = (0, db_1.all)(`SELECT b.*, m.home_team, m.away_team, m.league, m.start_time, m.status as match_status, m.home_score, m.away_score
       FROM bets b
       JOIN matches m ON m.id = b.match_id
       ${where}
       ORDER BY b.placed_at DESC
       LIMIT ? OFFSET ?`, [...params, limit, offset]);
        const countRow = (0, db_1.get)(`SELECT COUNT(*) as cnt FROM bets ${where}`, params) || { cnt: 0 };
        const totalPages = Math.ceil((countRow.cnt || 0) / limit);
        res.json({
            success: true,
            data: {
                bets,
                pagination: { currentPage: page, totalPages, totalItems: countRow.cnt, itemsPerPage: limit }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in my-bets route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch bets', 500));
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const bet = (0, db_1.get)(`SELECT b.*, m.home_team, m.away_team, m.league, m.start_time, m.status as match_status, m.home_score, m.away_score
       FROM bets b
       JOIN matches m ON m.id = b.match_id
       WHERE b.id = ? AND b.user_id = ?
       LIMIT 1`, [id, userId]);
        if (!bet)
            return next((0, errorHandler_1.createError)('Bet not found', 404));
        res.json({ success: true, data: { bet } });
    }
    catch (error) {
        logger_1.logger.error('Error fetching bet:', error);
        next((0, errorHandler_1.createError)('Failed to fetch bet', 500));
    }
});
router.patch('/:id/cancel', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = (0, db_1.transaction)(() => {
            const bet = (0, db_1.get)(`SELECT b.*, m.start_time, m.status as match_status
         FROM bets b JOIN matches m ON m.id = b.match_id
         WHERE b.id = ? AND b.user_id = ? LIMIT 1`, [id, userId]);
            if (!bet)
                throw (0, errorHandler_1.createError)('Bet not found', 404);
            if (bet.status !== 'pending')
                throw (0, errorHandler_1.createError)('Cannot cancel this bet', 400);
            const now = new Date();
            const matchStartTime = new Date(bet.start_time);
            if (now >= matchStartTime || bet.match_status !== 'upcoming') {
                throw (0, errorHandler_1.createError)('Cannot cancel bet - match has started', 400);
            }
            (0, db_1.run)(`UPDATE bets SET status = 'cancelled', settled_at = ? WHERE id = ?`, [(0, db_1.nowIso)(), id]);
            const user = (0, db_1.get)('SELECT balance FROM users WHERE id = ? LIMIT 1', [userId]);
            if (!user)
                throw (0, errorHandler_1.createError)('User not found', 404);
            (0, db_1.run)('UPDATE users SET balance = ? WHERE id = ?', [user.balance + bet.stake, userId]);
            (0, db_1.run)(`INSERT INTO transactions (id, user_id, type, amount, status, reference, created_at)
         VALUES (?, ?, 'bet_stake', ?, 'completed', ?, ?)`, [(0, db_1.generateId)(), userId, bet.stake, `refund_${bet.id}`, (0, db_1.nowIso)()]);
            return true;
        });
        if (result) {
            logger_1.logger.info(`Bet cancelled: ${id} by user ${userId}`);
            res.json({ success: true, message: 'Bet cancelled successfully' });
            return;
        }
        next((0, errorHandler_1.createError)('Failed to cancel bet', 500));
    }
    catch (error) {
        logger_1.logger.error('Error cancelling bet:', error);
        next((0, errorHandler_1.createError)(error instanceof Error ? error.message : 'Failed to cancel bet', error?.statusCode || 500));
    }
});
router.get('/stats/summary', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const stats = (0, db_1.all)('SELECT status, stake, potential_win FROM bets WHERE user_id = ?', [userId]);
        const summary = {
            totalBets: stats.length,
            pendingBets: stats.filter(b => b.status === 'pending').length,
            wonBets: stats.filter(b => b.status === 'won').length,
            lostBets: stats.filter(b => b.status === 'lost').length,
            cancelledBets: stats.filter(b => b.status === 'cancelled').length,
            totalStaked: stats.reduce((s, b) => s + b.stake, 0),
            totalWon: stats.filter(b => b.status === 'won').reduce((s, b) => s + b.potential_win, 0),
            winRate: (() => {
                const finished = stats.filter(b => b.status === 'won' || b.status === 'lost');
                if (finished.length === 0)
                    return '0.00';
                const won = stats.filter(b => b.status === 'won').length;
                return ((won / finished.length) * 100).toFixed(2);
            })()
        };
        res.json({ success: true, data: { summary } });
    }
    catch (error) {
        logger_1.logger.error('Error in bet stats route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch statistics', 500));
    }
});
exports.default = router;
//# sourceMappingURL=bets.js.map