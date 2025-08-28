import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { placeBetValidation, paginationValidation } from '../middleware/validation';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { all, get, run, transaction, nowIso, generateId } from '../utils/db';

const router = express.Router();

// Place a new bet
router.post('/', authenticateToken, placeBetValidation, async (req: AuthRequest, res, next) => {
  try {
    const { matchId, betType, stake, odds } = req.body as { matchId: string; betType: 'home'|'draw'|'away'; stake: number; odds: number };
    const userId = req.user!.id;

    const result = transaction(() => {
      const user = get<{ balance: number }>('SELECT balance FROM users WHERE id = ? LIMIT 1', [userId]);
      if (!user) throw createError('User not found', 404);
      if (user.balance < stake) throw createError('Insufficient balance', 400);

      const match = get<{ id: string; status: string; start_time: string }>(
        'SELECT id, status, start_time FROM matches WHERE id = ? LIMIT 1',
        [matchId]
      );
      if (!match) throw createError('Match not found', 404);
      if (match.status !== 'upcoming') throw createError('Betting is not available for this match', 400);

      const matchStartTime = new Date(match.start_time);
      const now = new Date();
      const minutesDiff = (matchStartTime.getTime() - now.getTime()) / (1000 * 60);
      if (minutesDiff < 5) throw createError('Betting closed - match starts soon', 400);

      const potentialWin = stake * odds;
      const id = generateId();

      run(
        `INSERT INTO bets (id, user_id, match_id, bet_type, odds, stake, potential_win, status, placed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [id, userId, matchId, betType, odds, stake, potentialWin, nowIso()]
      );

      run('UPDATE users SET balance = ? WHERE id = ?', [user.balance - stake, userId]);

      run(
        `INSERT INTO transactions (id, user_id, type, amount, status, reference, created_at)
         VALUES (?, ?, 'bet_stake', ?, 'completed', ?, ?)`,
        [generateId(), userId, -stake, id, nowIso()]
      );

      return id;
    });

    const bet = get<any>('SELECT * FROM bets WHERE id = ?', [result]);

    logger.info(`Bet placed: ${bet.id} by user ${req.user!.id}`);

    res.status(201).json({ success: true, message: 'Bet placed successfully', data: { bet } });
  } catch (error) {
    logger.error('Error placing bet:', error);
    const status = (error as any)?.statusCode || 500;
    next(createError(error instanceof Error ? error.message : 'Failed to place bet', status));
  }
});

// Get user's bets
router.get('/my-bets', authenticateToken, paginationValidation, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    const filters = ['user_id = ?'];
    const params: any[] = [userId];
    if (status) {
      filters.push('status = ?');
      params.push(status);
    }

    const where = `WHERE ${filters.join(' AND ')}`;

    const bets = all<any>(
      `SELECT b.*, m.home_team, m.away_team, m.league, m.start_time, m.status as match_status, m.home_score, m.away_score
       FROM bets b
       JOIN matches m ON m.id = b.match_id
       ${where}
       ORDER BY b.placed_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const countRow = get<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM bets ${where}`, params) || { cnt: 0 };
    const totalPages = Math.ceil((countRow.cnt || 0) / limit);

    res.json({
      success: true,
      data: {
        bets,
        pagination: { currentPage: page, totalPages, totalItems: countRow.cnt, itemsPerPage: limit }
      }
    });
  } catch (error) {
    logger.error('Error in my-bets route:', error);
    next(createError('Failed to fetch bets', 500));
  }
});

// Get bet by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const bet = get<any>(
      `SELECT b.*, m.home_team, m.away_team, m.league, m.start_time, m.status as match_status, m.home_score, m.away_score
       FROM bets b
       JOIN matches m ON m.id = b.match_id
       WHERE b.id = ? AND b.user_id = ?
       LIMIT 1`,
      [id, userId]
    );

    if (!bet) return next(createError('Bet not found', 404));

    res.json({ success: true, data: { bet } });
  } catch (error) {
    logger.error('Error fetching bet:', error);
    next(createError('Failed to fetch bet', 500));
  }
});

// Cancel bet (only if match hasn't started)
router.patch('/:id/cancel', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = transaction(() => {
      const bet = get<any>(
        `SELECT b.*, m.start_time, m.status as match_status
         FROM bets b JOIN matches m ON m.id = b.match_id
         WHERE b.id = ? AND b.user_id = ? LIMIT 1`,
        [id, userId]
      );
      if (!bet) throw createError('Bet not found', 404);
      if (bet.status !== 'pending') throw createError('Cannot cancel this bet', 400);

      const now = new Date();
      const matchStartTime = new Date(bet.start_time);
      if (now >= matchStartTime || bet.match_status !== 'upcoming') {
        throw createError('Cannot cancel bet - match has started', 400);
      }

      run(`UPDATE bets SET status = 'cancelled', settled_at = ? WHERE id = ?`, [nowIso(), id]);

      const user = get<{ balance: number }>('SELECT balance FROM users WHERE id = ? LIMIT 1', [userId]);
      if (!user) throw createError('User not found', 404);
      run('UPDATE users SET balance = ? WHERE id = ?', [user.balance + bet.stake, userId]);

      run(
        `INSERT INTO transactions (id, user_id, type, amount, status, reference, created_at)
         VALUES (?, ?, 'bet_stake', ?, 'completed', ?, ?)`,
        [generateId(), userId, bet.stake, `refund_${bet.id}`, nowIso()]
      );

      return true;
    });

    if (result) {
      logger.info(`Bet cancelled: ${id} by user ${userId}`);
      res.json({ success: true, message: 'Bet cancelled successfully' });
      return;
    }

    next(createError('Failed to cancel bet', 500));
  } catch (error) {
    logger.error('Error cancelling bet:', error);
    next(createError(error instanceof Error ? error.message : 'Failed to cancel bet', (error as any)?.statusCode || 500));
  }
});

// Get betting statistics for user
router.get('/stats/summary', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const stats = all<any>('SELECT status, stake, potential_win FROM bets WHERE user_id = ?', [userId]);

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
        if (finished.length === 0) return '0.00';
        const won = stats.filter(b => b.status === 'won').length;
        return ((won / finished.length) * 100).toFixed(2);
      })()
    };

    res.json({ success: true, data: { summary } });
  } catch (error) {
    logger.error('Error in bet stats route:', error);
    next(createError('Failed to fetch statistics', 500));
  }
});

export default router;