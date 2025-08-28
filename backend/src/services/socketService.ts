import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { all, get } from '../utils/db';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

export const initializeSocketHandlers = (io: Server) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = (socket.handshake as any).auth?.token;
      if (!token) return next(new Error('Authentication error: No token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const user = get<{ id: string; email: string }>('SELECT id, email FROM users WHERE id = ? LIMIT 1', [decoded.userId]);
      if (!user) return next(new Error('Authentication error: Invalid token'));

      socket.userId = user.id;
      socket.email = user.email;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.email} (${socket.userId})`);

    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Join live matches room for real-time updates
    socket.join('live_matches');

    // Handle joining specific match rooms
    socket.on('join_match', (matchId: string) => {
      socket.join(`match_${matchId}`);
      logger.debug(`User ${socket.email} joined match room: ${matchId}`);
    });

    // Handle leaving specific match rooms
    socket.on('leave_match', (matchId: string) => {
      socket.leave(`match_${matchId}`);
      logger.debug(`User ${socket.email} left match room: ${matchId}`);
    });

    // Handle bet placement notifications
    socket.on('bet_placed', async (betData) => {
      try {
        socket.to(`user_${socket.userId}`).emit('bet_confirmed', {
          betId: betData.betId,
          message: 'Your bet has been placed successfully',
          timestamp: new Date().toISOString()
        });
        socket.to(`match_${betData.matchId}`).emit('betting_activity', {
          matchId: betData.matchId,
          totalBets: betData.totalBets,
          popularBet: betData.popularBet
        });
      } catch (error) {
        logger.error('Error handling bet_placed event:', error);
      }
    });

    // Handle requesting live match updates
    socket.on('request_live_updates', async () => {
      try {
        const liveMatches = all<any>(`SELECT * FROM matches WHERE status = 'live' ORDER BY start_time ASC`);
        const withOdds = liveMatches.map((m) => {
          const odds = get<any>(
            'SELECT home_odds, draw_odds, away_odds, updated_at FROM odds WHERE match_id = ? ORDER BY updated_at DESC LIMIT 1',
            [m.id]
          );
          return { ...m, odds };
        });
        socket.emit('live_matches_update', withOdds);
      } catch (error) {
        logger.error('Error sending live updates:', error);
      }
    });

    // Handle user balance requests
    socket.on('request_balance', async () => {
      try {
        const user = get<{ balance: number }>('SELECT balance FROM users WHERE id = ? LIMIT 1', [socket.userId]);
        if (user) socket.emit('balance_update', { balance: user.balance });
      } catch (error) {
        logger.error('Error sending balance update:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.email} (${socket.userId}) - Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.email}:`, error);
    });
  });

  return io;
};

export const emitToUser = (io: Server, userId: string, event: string, data: any) => {
  io.to(`user_${userId}`).emit(event, data);
};

export const emitToMatch = (io: Server, matchId: string, event: string, data: any) => {
  io.to(`match_${matchId}`).emit(event, data);
};

export const emitToAllLiveMatches = (io: Server, event: string, data: any) => {
  io.to('live_matches').emit(event, data);
};

export const broadcastMatchUpdate = (io: Server, matchData: any) => {
  emitToAllLiveMatches(io, 'match_update', matchData);
  emitToMatch(io, matchData.id, 'match_score_update', {
    matchId: matchData.id,
    homeScore: matchData.home_score,
    awayScore: matchData.away_score,
    currentTime: matchData.current_time,
    status: matchData.status
  });
};

export const broadcastOddsUpdate = (io: Server, oddsData: any) => {
  emitToAllLiveMatches(io, 'odds_update', oddsData);
  emitToMatch(io, oddsData.match_id, 'match_odds_update', {
    matchId: oddsData.match_id,
    homeOdds: oddsData.home_odds,
    drawOdds: oddsData.draw_odds,
    awayOdds: oddsData.away_odds,
    timestamp: oddsData.updated_at
  });
};

export const notifyBetSettlement = (io: Server, userId: string, betData: any) => {
  emitToUser(io, userId, 'bet_settled', {
    betId: betData.id,
    status: betData.status,
    amount: betData.status === 'won' ? betData.potential_win : 0,
    message: betData.status === 'won' 
      ? `Congratulations! You won ETB ${betData.potential_win}` 
      : 'Better luck next time!',
    timestamp: new Date().toISOString()
  });
};

export const notifyBalanceChange = (io: Server, userId: string, newBalance: number, change: number, reason: string) => {
  emitToUser(io, userId, 'balance_changed', {
    newBalance,
    change,
    reason,
    timestamp: new Date().toISOString()
  });
};