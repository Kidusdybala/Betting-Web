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
router.get('/match/:matchId', async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const odds = (0, db_1.get)('SELECT * FROM odds WHERE match_id = ? ORDER BY updated_at DESC LIMIT 1', [matchId]);
        res.json({ success: true, data: { odds: odds || null } });
    }
    catch (error) {
        logger_1.logger.error('Error in odds route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch odds', 500));
    }
});
router.get('/match/:matchId/history', async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const oddsHistory = (0, db_1.all)('SELECT * FROM odds WHERE match_id = ? ORDER BY updated_at DESC LIMIT ?', [matchId, limit]);
        res.json({ success: true, data: { oddsHistory } });
    }
    catch (error) {
        logger_1.logger.error('Error in odds history route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch odds history', 500));
    }
});
router.post('/match/:matchId', auth_1.authenticateToken, auth_1.requireAdmin, validation_1.updateOddsValidation, async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const { homeOdds, drawOdds, awayOdds } = req.body;
        const match = (0, db_1.get)('SELECT id, status FROM matches WHERE id = ? LIMIT 1', [matchId]);
        if (!match)
            return next((0, errorHandler_1.createError)('Match not found', 404));
        if (match.status === 'finished')
            return next((0, errorHandler_1.createError)('Cannot update odds for finished match', 400));
        const id = (0, db_1.generateId)();
        const now = (0, db_1.nowIso)();
        (0, db_1.run)(`INSERT INTO odds (id, match_id, home_odds, draw_odds, away_odds, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, matchId, homeOdds, drawOdds, awayOdds, now, now]);
        const odds = (0, db_1.get)('SELECT * FROM odds WHERE id = ?', [id]);
        logger_1.logger.info(`Odds updated for match ${matchId} by admin ${req.user?.email}`);
        res.json({ success: true, message: 'Odds updated successfully', data: { odds } });
    }
    catch (error) {
        logger_1.logger.error('Error in update odds route:', error);
        next((0, errorHandler_1.createError)('Failed to update odds', 500));
    }
});
router.get('/live', async (req, res, next) => {
    try {
        const liveMatches = (0, db_1.all)(`SELECT * FROM matches WHERE status = 'live'`);
        const latestOdds = liveMatches.map((m) => {
            const o = (0, db_1.get)('SELECT home_odds, draw_odds, away_odds, updated_at FROM odds WHERE match_id = ? ORDER BY updated_at DESC LIMIT 1', [m.id]);
            return { ...m, odds: o || null };
        });
        res.json({ success: true, data: { matches: latestOdds } });
    }
    catch (error) {
        logger_1.logger.error('Error in live odds route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch live odds', 500));
    }
});
router.get('/movements', async (req, res, next) => {
    try {
        const hoursBack = parseInt(req.query.hours) || 24;
        const threshold = parseFloat(req.query.threshold) || 0.1;
        const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
        const recentOdds = (0, db_1.all)(`SELECT o.*, m.home_team, m.away_team, m.league, m.status
       FROM odds o
       JOIN matches m ON m.id = o.match_id
       WHERE o.updated_at >= ?
       ORDER BY o.updated_at DESC`, [since]);
        const groups = {};
        for (const row of recentOdds) {
            groups[row.match_id] = groups[row.match_id] || [];
            groups[row.match_id].push(row);
        }
        const movements = [];
        for (const matchId of Object.keys(groups)) {
            const list = groups[matchId].sort((a, b) => a.updated_at.localeCompare(b.updated_at));
            if (list.length >= 2) {
                const latest = list[list.length - 1];
                const previous = list[list.length - 2];
                const homeChange = Math.abs(latest.home_odds - previous.home_odds) / previous.home_odds;
                const drawChange = Math.abs(latest.draw_odds - previous.draw_odds) / previous.draw_odds;
                const awayChange = Math.abs(latest.away_odds - previous.away_odds) / previous.away_odds;
                if (homeChange >= threshold || drawChange >= threshold || awayChange >= threshold) {
                    movements.push({
                        match: {
                            home_team: latest.home_team,
                            away_team: latest.away_team,
                            league: latest.league,
                            status: latest.status
                        },
                        previous: {
                            home_odds: previous.home_odds,
                            draw_odds: previous.draw_odds,
                            away_odds: previous.away_odds,
                            updated_at: previous.updated_at
                        },
                        current: {
                            home_odds: latest.home_odds,
                            draw_odds: latest.draw_odds,
                            away_odds: latest.away_odds,
                            updated_at: latest.updated_at
                        },
                        changes: {
                            home: ((latest.home_odds - previous.home_odds) / previous.home_odds * 100).toFixed(2),
                            draw: ((latest.draw_odds - previous.draw_odds) / previous.draw_odds * 100).toFixed(2),
                            away: ((latest.away_odds - previous.away_odds) / previous.away_odds * 100).toFixed(2)
                        }
                    });
                }
            }
        }
        res.json({ success: true, data: { movements } });
    }
    catch (error) {
        logger_1.logger.error('Error in odds movements route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch odds movements', 500));
    }
});
router.delete('/cleanup', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const daysBack = parseInt(req.query.days) || 30;
        const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
        (0, db_1.run)('DELETE FROM odds WHERE updated_at < ?', [cutoffDate]);
        logger_1.logger.info(`Odds cleanup completed by admin ${req.user?.email}`);
        res.json({ success: true, message: `Odds records older than ${daysBack} days have been deleted` });
    }
    catch (error) {
        logger_1.logger.error('Error in odds cleanup route:', error);
        next((0, errorHandler_1.createError)('Failed to cleanup odds', 500));
    }
});
exports.default = router;
//# sourceMappingURL=odds.js.map