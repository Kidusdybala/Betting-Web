import express from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { updateOddsValidation } from '../middleware/validation';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { all, get, run, nowIso, generateId } from '../utils/db';
import { oddsService } from '../services/oddsService';

const router = express.Router();

// Get odds for a specific match
router.get('/match/:matchId', async (req, res, next) => {
  try {
    const { matchId } = req.params;

    // Try to get odds from external API first
    const apiResponse = await oddsService.getMatchOdds(matchId);

    if (apiResponse.success && apiResponse.data) {
      // Check if match exists in database
      const existingMatch = get<{ id: string }>('SELECT id FROM matches WHERE id = ? LIMIT 1', [matchId]);

      if (existingMatch) {
        // Store the API data in local database for caching/fallback
        const id = generateId();
        const now = nowIso();

        run(
          `INSERT OR REPLACE INTO odds (id, match_id, home_odds, draw_odds, away_odds, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, matchId, apiResponse.data.homeOdds, apiResponse.data.drawOdds, apiResponse.data.awayOdds, now, now]
        );

        res.json({
          success: true,
          data: {
            odds: {
              id,
              match_id: matchId,
              home_odds: apiResponse.data.homeOdds,
              draw_odds: apiResponse.data.drawOdds,
              away_odds: apiResponse.data.awayOdds,
              updated_at: now,
              source: 'api'
            }
          }
        });
      } else {
        // Match doesn't exist in database, return API data without storing
        res.json({
          success: true,
          data: {
            odds: {
              match_id: matchId,
              home_odds: apiResponse.data.homeOdds,
              draw_odds: apiResponse.data.drawOdds,
              away_odds: apiResponse.data.awayOdds,
              updated_at: new Date().toISOString(),
              source: 'api'
            }
          }
        });
      }
    } else {
      // Fallback to local database
      const odds = get<any>(
        'SELECT * FROM odds WHERE match_id = ? ORDER BY updated_at DESC LIMIT 1',
        [matchId]
      );

      res.json({
        success: true,
        data: {
          odds: odds ? { ...odds, source: 'database' } : null
        }
      });
    }
  } catch (error) {
    logger.error('Error in odds route:', error);
    next(createError('Failed to fetch odds', 500));
  }
});

// Get odds history for a match
router.get('/match/:matchId/history', async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Try to get history from external API first
    const apiResponse = await oddsService.getOddsHistory(matchId, limit);

    if (apiResponse.success && apiResponse.data?.history) {
      // Store API history data in local database
      const now = nowIso();
      for (const historyItem of apiResponse.data.history) {
        const id = generateId();
        run(
          `INSERT OR IGNORE INTO odds (id, match_id, home_odds, draw_odds, away_odds, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, matchId, historyItem.homeOdds, historyItem.drawOdds, historyItem.awayOdds, historyItem.timestamp, historyItem.timestamp]
        );
      }

      res.json({
        success: true,
        data: {
          oddsHistory: apiResponse.data.history.map(item => ({
            ...item,
            source: 'api'
          }))
        }
      });
    } else {
      // Fallback to local database
      const oddsHistory = all<any>(
        'SELECT * FROM odds WHERE match_id = ? ORDER BY updated_at DESC LIMIT ?',
        [matchId, limit]
      );

      res.json({
        success: true,
        data: {
          oddsHistory: oddsHistory.map(item => ({ ...item, source: 'database' }))
        }
      });
    }
  } catch (error) {
    logger.error('Error in odds history route:', error);
    next(createError('Failed to fetch odds history', 500));
  }
});

// Update odds for a match (Admin only)
router.post('/match/:matchId', authenticateToken, requireAdmin, updateOddsValidation, async (req: AuthRequest, res, next) => {
  try {
    const { matchId } = req.params;
    const { homeOdds, drawOdds, awayOdds } = req.body;

    // Check if match exists
    const match = get<{ id: string; status: string }>('SELECT id, status FROM matches WHERE id = ? LIMIT 1', [matchId]);
    if (!match) return next(createError('Match not found', 404));
    if (match.status === 'finished') return next(createError('Cannot update odds for finished match', 400));

    const id = generateId();
    const now = nowIso();

    run(
      `INSERT INTO odds (id, match_id, home_odds, draw_odds, away_odds, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, matchId, homeOdds, drawOdds, awayOdds, now, now]
    );

    const odds = get<any>('SELECT * FROM odds WHERE id = ?', [id]);

    logger.info(`Odds updated for match ${matchId} by admin ${req.user?.email}`);

    res.json({ success: true, message: 'Odds updated successfully', data: { odds } });
  } catch (error) {
    logger.error('Error in update odds route:', error);
    next(createError('Failed to update odds', 500));
  }
});

// Get current odds for all live matches
router.get('/live', async (req, res, next) => {
  try {
    const liveMatches = all<any>(`SELECT * FROM matches WHERE status = 'live'`);

    if (liveMatches.length === 0) {
      return res.json({ success: true, data: { matches: [] } });
    }

    // Get odds from external API for all live matches
    const matchIds = liveMatches.map(m => m.id);
    const apiResponse = await oddsService.getMultipleMatchOdds(matchIds);

    let matchesWithOdds = [];

    if (apiResponse.success && apiResponse.data) {
      // Use API data and update local database
      matchesWithOdds = liveMatches.map((match) => {
        const apiOdds = apiResponse.data.find((odds: any) => odds.matchId === match.id);

        if (apiOdds) {
          // Update local database with API data
          const id = generateId();
          const now = nowIso();

          run(
            `INSERT OR REPLACE INTO odds (id, match_id, home_odds, draw_odds, away_odds, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, match.id, apiOdds.homeOdds, apiOdds.drawOdds, apiOdds.awayOdds, now, now]
          );

          return {
            ...match,
            odds: {
              id,
              match_id: match.id,
              home_odds: apiOdds.homeOdds,
              draw_odds: apiOdds.drawOdds,
              away_odds: apiOdds.awayOdds,
              updated_at: now,
              source: 'api'
            }
          };
        } else {
          // Fallback to local database
          const localOdds = get<any>(
            'SELECT home_odds, draw_odds, away_odds, updated_at FROM odds WHERE match_id = ? ORDER BY updated_at DESC LIMIT 1',
            [match.id]
          );
          return {
            ...match,
            odds: localOdds ? { ...localOdds, source: 'database' } : null
          };
        }
      });
    } else {
      // Fallback to local database for all matches
      matchesWithOdds = liveMatches.map((match) => {
        const localOdds = get<any>(
          'SELECT home_odds, draw_odds, away_odds, updated_at FROM odds WHERE match_id = ? ORDER BY updated_at DESC LIMIT 1',
          [match.id]
        );
        return {
          ...match,
          odds: localOdds ? { ...localOdds, source: 'database' } : null
        };
      });
    }

    res.json({ success: true, data: { matches: matchesWithOdds } });
  } catch (error) {
    logger.error('Error in live odds route:', error);
    next(createError('Failed to fetch live odds', 500));
  }
});

// Get odds movements (significant changes)
router.get('/movements', async (req, res, next) => {
  try {
    const hoursBack = parseInt(req.query.hours as string) || 24;
    const threshold = parseFloat(req.query.threshold as string) || 0.1; // 10% change

    // Try to get movements from external API first
    const apiResponse = await oddsService.getOddsMovements(hoursBack, threshold);

    if (apiResponse.success && apiResponse.data?.movements) {
      res.json({
        success: true,
        data: {
          movements: apiResponse.data.movements.map(movement => ({
            ...movement,
            source: 'api'
          }))
        }
      });
    } else {
      // Fallback to local database analysis
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      const recentOdds = all<any>(
        `SELECT o.*, m.home_team, m.away_team, m.league, m.status
         FROM odds o
         JOIN matches m ON m.id = o.match_id
         WHERE o.updated_at >= ?
         ORDER BY o.updated_at DESC`,
        [since]
      );

      const groups: Record<string, any[]> = {};
      for (const row of recentOdds) {
        groups[row.match_id] = groups[row.match_id] || [];
        groups[row.match_id].push(row);
      }

      const movements: any[] = [];
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
              },
              source: 'database'
            });
          }
        }
      }

      res.json({ success: true, data: { movements } });
    }
  } catch (error) {
    logger.error('Error in odds movements route:', error);
    next(createError('Failed to fetch odds movements', 500));
  }
});

// Delete old odds records (Admin only - for cleanup)
router.delete('/cleanup', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const daysBack = parseInt(req.query.days as string) || 30;
    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    run('DELETE FROM odds WHERE updated_at < ?', [cutoffDate]);

    logger.info(`Odds cleanup completed by admin ${req.user?.email}`);

    res.json({ success: true, message: `Odds records older than ${daysBack} days have been deleted` });
  } catch (error) {
    logger.error('Error in odds cleanup route:', error);
    next(createError('Failed to cleanup odds', 500));
  }
});

export default router;