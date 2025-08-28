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
router.get('/', validation_1.paginationValidation, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || '';
        const league = req.query.league || '';
        const offset = (page - 1) * limit;
        const filters = [];
        const params = [];
        if (status) {
            filters.push('status = ?');
            params.push(status);
        }
        if (league) {
            filters.push('LOWER(league) LIKE ?');
            params.push(`%${league.toLowerCase()}%`);
        }
        const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
        const matches = (0, db_1.all)(`SELECT m.*, (
         SELECT home_odds FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as home_odds,
       (
         SELECT draw_odds FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as draw_odds,
       (
         SELECT away_odds FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as away_odds,
       (
         SELECT updated_at FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as odds_updated_at
       FROM matches m ${where}
       ORDER BY start_time ASC
       LIMIT ? OFFSET ?`, [...params, limit, offset]);
        const countRow = (0, db_1.get)(`SELECT COUNT(*) as cnt FROM matches m ${where}`, params) || { cnt: 0 };
        const totalPages = Math.ceil((countRow.cnt || 0) / limit);
        res.json({
            success: true,
            data: {
                matches,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: countRow.cnt,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in matches route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch matches', 500));
    }
});
router.get('/live', async (req, res, next) => {
    try {
        const matches = (0, db_1.all)(`SELECT m.*, (
         SELECT home_odds FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as home_odds,
       (
         SELECT draw_odds FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as draw_odds,
       (
         SELECT away_odds FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as away_odds,
       (
         SELECT updated_at FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as odds_updated_at
       FROM matches m WHERE status = 'live' ORDER BY start_time ASC`);
        res.json({ success: true, data: { matches } });
    }
    catch (error) {
        logger_1.logger.error('Error in live matches route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch live matches', 500));
    }
});
router.get('/upcoming', validation_1.paginationValidation, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const now = (0, db_1.nowIso)();
        const matches = (0, db_1.all)(`SELECT m.*, (
         SELECT home_odds FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as home_odds,
       (
         SELECT draw_odds FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as draw_odds,
       (
         SELECT away_odds FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as away_odds,
       (
         SELECT updated_at FROM odds o WHERE o.match_id = m.id ORDER BY o.updated_at DESC LIMIT 1
       ) as odds_updated_at
       FROM matches m WHERE status = 'upcoming' AND start_time >= ?
       ORDER BY start_time ASC LIMIT ? OFFSET ?`, [now, limit, offset]);
        const countRow = (0, db_1.get)(`SELECT COUNT(*) as cnt FROM matches WHERE status = 'upcoming' AND start_time >= ?`, [now]) || { cnt: 0 };
        const totalPages = Math.ceil((countRow.cnt || 0) / limit);
        res.json({
            success: true,
            data: {
                matches,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: countRow.cnt,
                    itemsPerPage: limit
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in upcoming matches route:', error);
        next((0, errorHandler_1.createError)('Failed to fetch upcoming matches', 500));
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const match = (0, db_1.get)('SELECT * FROM matches WHERE id = ? LIMIT 1', [id]);
        if (!match)
            return next((0, errorHandler_1.createError)('Match not found', 404));
        const odds = (0, db_1.get)('SELECT home_odds, draw_odds, away_odds, updated_at FROM odds WHERE match_id = ? ORDER BY updated_at DESC LIMIT 1', [id]);
        res.json({ success: true, data: { match: { ...match, odds } } });
    }
    catch (error) {
        logger_1.logger.error('Error fetching match:', error);
        next((0, errorHandler_1.createError)('Failed to fetch match', 500));
    }
});
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, validation_1.createMatchValidation, async (req, res, next) => {
    try {
        const { homeTeam, awayTeam, league, startTime } = req.body;
        const id = (0, db_1.generateId)();
        const now = (0, db_1.nowIso)();
        (0, db_1.run)(`INSERT INTO matches (id, home_team, away_team, league, start_time, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'upcoming', ?, ?)`, [id, homeTeam, awayTeam, league, startTime, now, now]);
        const match = (0, db_1.get)('SELECT * FROM matches WHERE id = ?', [id]);
        logger_1.logger.info(`Match created: ${homeTeam} vs ${awayTeam} by admin ${req.user?.email}`);
        res.status(201).json({
            success: true,
            message: 'Match created successfully',
            data: { match }
        });
    }
    catch (error) {
        logger_1.logger.error('Error in create match route:', error);
        next((0, errorHandler_1.createError)('Failed to create match', 500));
    }
});
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body || {};
        const now = (0, db_1.nowIso)();
        const fields = [];
        const params = [];
        for (const key of ['home_team', 'away_team', 'league', 'start_time', 'status', 'home_score', 'away_score', 'current_time']) {
            if (updates[key] !== undefined) {
                fields.push(`${key} = ?`);
                params.push(updates[key]);
            }
        }
        fields.push('updated_at = ?');
        params.push(now, id);
        if (fields.length === 1) {
            return next((0, errorHandler_1.createError)('No valid fields to update', 400));
        }
        (0, db_1.run)(`UPDATE matches SET ${fields.join(', ')} WHERE id = ?`, params);
        const match = (0, db_1.get)('SELECT * FROM matches WHERE id = ?', [id]);
        if (!match)
            return next((0, errorHandler_1.createError)('Match not found', 404));
        logger_1.logger.info(`Match updated: ${id} by admin ${req.user?.email}`);
        res.json({ success: true, message: 'Match updated successfully', data: { match } });
    }
    catch (error) {
        logger_1.logger.error('Error in update match route:', error);
        next((0, errorHandler_1.createError)('Failed to update match', 500));
    }
});
router.patch('/:id/score', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { homeScore, awayScore, currentTime, status } = req.body;
        (0, db_1.run)(`UPDATE matches SET home_score = ?, away_score = ?, current_time = ?, status = ?, updated_at = ? WHERE id = ?`, [homeScore, awayScore, currentTime, status, (0, db_1.nowIso)(), id]);
        const match = (0, db_1.get)('SELECT * FROM matches WHERE id = ?', [id]);
        if (!match)
            return next((0, errorHandler_1.createError)('Match not found', 404));
        logger_1.logger.info(`Match score updated: ${id} by admin ${req.user?.email}`);
        res.json({ success: true, message: 'Match score updated successfully', data: { match } });
    }
    catch (error) {
        logger_1.logger.error('Error in update match score route:', error);
        next((0, errorHandler_1.createError)('Failed to update match score', 500));
    }
});
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        (0, db_1.run)('DELETE FROM matches WHERE id = ?', [id]);
        logger_1.logger.info(`Match deleted: ${id} by admin ${req.user?.email}`);
        res.json({ success: true, message: 'Match deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error in delete match route:', error);
        next((0, errorHandler_1.createError)('Failed to delete match', 500));
    }
});
exports.default = router;
//# sourceMappingURL=matches.js.map