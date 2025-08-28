import express from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { createMatchValidation, paginationValidation } from '../middleware/validation';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { all, get, run, nowIso, generateId } from '../utils/db';

const router = express.Router();

// Get all matches with pagination and filtering
router.get('/', paginationValidation, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || '';
    const league = (req.query.league as string) || '';
    const offset = (page - 1) * limit;

    const filters: string[] = [];
    const params: any[] = [];

    if (status) {
      filters.push('status = ?');
      params.push(status);
    }
    if (league) {
      filters.push('LOWER(league) LIKE ?');
      params.push(`%${league.toLowerCase()}%`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const matches = all<any>(
      `SELECT m.*, (
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
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const countRow = get<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM matches m ${where}`, params) || { cnt: 0 };
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
  } catch (error) {
    logger.error('Error in matches route:', error);
    next(createError('Failed to fetch matches', 500));
  }
});

// Get live matches
router.get('/live', async (req, res, next) => {
  try {
    const matches = all<any>(
      `SELECT m.*, (
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
       FROM matches m WHERE status = 'live' ORDER BY start_time ASC`
    );

    res.json({ success: true, data: { matches } });
  } catch (error) {
    logger.error('Error in live matches route:', error);
    next(createError('Failed to fetch live matches', 500));
  }
});

// Get upcoming matches
router.get('/upcoming', paginationValidation, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const now = nowIso();
    const matches = all<any>(
      `SELECT m.*, (
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
      ORDER BY start_time ASC LIMIT ? OFFSET ?`,
      [now, limit, offset]
    );

    const countRow = get<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM matches WHERE status = 'upcoming' AND start_time >= ?`,
      [now]
    ) || { cnt: 0 };

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
  } catch (error) {
    logger.error('Error in upcoming matches route:', error);
    next(createError('Failed to fetch upcoming matches', 500));
  }
});

// Get Premier League matches
router.get('/premier-league', paginationValidation, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const matches = all<any>(
      `SELECT m.*, (
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
      FROM matches m WHERE LOWER(league) LIKE '%premier league%' OR LOWER(league) LIKE '%premier%'
      ORDER BY start_time ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countRow = get<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM matches WHERE LOWER(league) LIKE '%premier league%' OR LOWER(league) LIKE '%premier%'`
    ) || { cnt: 0 };

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
  } catch (error) {
    logger.error('Error in Premier League matches route:', error);
    next(createError('Failed to fetch Premier League matches', 500));
  }
});

// Get La Liga matches
router.get('/la-liga', paginationValidation, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const matches = all<any>(
      `SELECT m.*, (
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
      FROM matches m WHERE LOWER(league) LIKE '%la liga%' OR LOWER(league) LIKE '%laliga%'
      ORDER BY start_time ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countRow = get<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM matches WHERE LOWER(league) LIKE '%la liga%' OR LOWER(league) LIKE '%laliga%'`
    ) || { cnt: 0 };

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
  } catch (error) {
    logger.error('Error in La Liga matches route:', error);
    next(createError('Failed to fetch La Liga matches', 500));
  }
});

// Get Champions League matches
router.get('/champions-league', paginationValidation, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const matches = all<any>(
      `SELECT m.*, (
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
      FROM matches m WHERE LOWER(league) LIKE '%champions league%' OR LOWER(league) LIKE '%champions%' OR LOWER(league) LIKE '%ucl%'
      ORDER BY start_time ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countRow = get<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM matches WHERE LOWER(league) LIKE '%champions league%' OR LOWER(league) LIKE '%champions%' OR LOWER(league) LIKE '%ucl%'`
    ) || { cnt: 0 };

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
  } catch (error) {
    logger.error('Error in Champions League matches route:', error);
    next(createError('Failed to fetch Champions League matches', 500));
  }
});

// Get single match by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const match = get<any>('SELECT * FROM matches WHERE id = ? LIMIT 1', [id]);
    if (!match) return next(createError('Match not found', 404));

    const odds = get<any>(
      'SELECT home_odds, draw_odds, away_odds, updated_at FROM odds WHERE match_id = ? ORDER BY updated_at DESC LIMIT 1',
      [id]
    );

    res.json({ success: true, data: { match: { ...match, odds } } });
  } catch (error) {
    logger.error('Error fetching match:', error);
    next(createError('Failed to fetch match', 500));
  }
});

// Create new match (Admin only)
router.post('/', authenticateToken, requireAdmin, createMatchValidation, async (req: AuthRequest, res, next) => {
  try {
    const { homeTeam, awayTeam, league, startTime } = req.body;
    const id = generateId();
    const now = nowIso();

    run(
      `INSERT INTO matches (id, home_team, away_team, league, start_time, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'upcoming', ?, ?)`,
      [id, homeTeam, awayTeam, league, startTime, now, now]
    );

    const match = get<any>('SELECT * FROM matches WHERE id = ?', [id]);

    logger.info(`Match created: ${homeTeam} vs ${awayTeam} by admin ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: { match }
    });
  } catch (error) {
    logger.error('Error in create match route:', error);
    next(createError('Failed to create match', 500));
  }
});

// Update match (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const now = nowIso();

    // Build dynamic SET clause
    const fields: string[] = [];
    const params: any[] = [];
    for (const key of ['home_team','away_team','league','start_time','status','home_score','away_score','current_time']) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    }
    fields.push('updated_at = ?');
    params.push(now, id);

    if (fields.length === 1) {
      return next(createError('No valid fields to update', 400));
    }

    run(`UPDATE matches SET ${fields.join(', ')} WHERE id = ?`, params);

    const match = get<any>('SELECT * FROM matches WHERE id = ?', [id]);
    if (!match) return next(createError('Match not found', 404));

    logger.info(`Match updated: ${id} by admin ${req.user?.email}`);

    res.json({ success: true, message: 'Match updated successfully', data: { match } });
  } catch (error) {
    logger.error('Error in update match route:', error);
    next(createError('Failed to update match', 500));
  }
});

// Update match score (Admin only)
router.patch('/:id/score', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { homeScore, awayScore, currentTime, status } = req.body;

    run(
      `UPDATE matches SET home_score = ?, away_score = ?, current_time = ?, status = ?, updated_at = ? WHERE id = ?`,
      [homeScore, awayScore, currentTime, status, nowIso(), id]
    );

    const match = get<any>('SELECT * FROM matches WHERE id = ?', [id]);
    if (!match) return next(createError('Match not found', 404));

    logger.info(`Match score updated: ${id} by admin ${req.user?.email}`);

    res.json({ success: true, message: 'Match score updated successfully', data: { match } });
  } catch (error) {
    logger.error('Error in update match score route:', error);
    next(createError('Failed to update match score', 500));
  }
});

// Delete match (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    run('DELETE FROM matches WHERE id = ?', [id]);

    logger.info(`Match deleted: ${id} by admin ${req.user?.email}`);

    res.json({ success: true, message: 'Match deleted successfully' });
  } catch (error) {
    logger.error('Error in delete match route:', error);
    next(createError('Failed to delete match', 500));
  }
});

export default router;