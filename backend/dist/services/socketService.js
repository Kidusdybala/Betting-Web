"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyBalanceChange = exports.notifyBetSettlement = exports.broadcastOddsUpdate = exports.broadcastMatchUpdate = exports.emitToAllLiveMatches = exports.emitToMatch = exports.emitToUser = exports.initializeSocketHandlers = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const db_1 = require("../utils/db");
const initializeSocketHandlers = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token)
                return next(new Error('Authentication error: No token provided'));
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = (0, db_1.get)('SELECT id, email FROM users WHERE id = ? LIMIT 1', [decoded.userId]);
            if (!user)
                return next(new Error('Authentication error: Invalid token'));
            socket.userId = user.id;
            socket.email = user.email;
            next();
        }
        catch (error) {
            logger_1.logger.error('Socket authentication error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        logger_1.logger.info(`User connected: ${socket.email} (${socket.userId})`);
        socket.join(`user_${socket.userId}`);
        socket.join('live_matches');
        socket.on('join_match', (matchId) => {
            socket.join(`match_${matchId}`);
            logger_1.logger.debug(`User ${socket.email} joined match room: ${matchId}`);
        });
        socket.on('leave_match', (matchId) => {
            socket.leave(`match_${matchId}`);
            logger_1.logger.debug(`User ${socket.email} left match room: ${matchId}`);
        });
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
            }
            catch (error) {
                logger_1.logger.error('Error handling bet_placed event:', error);
            }
        });
        socket.on('request_live_updates', async () => {
            try {
                const liveMatches = (0, db_1.all)(`SELECT * FROM matches WHERE status = 'live' ORDER BY start_time ASC`);
                const withOdds = liveMatches.map((m) => {
                    const odds = (0, db_1.get)('SELECT home_odds, draw_odds, away_odds, updated_at FROM odds WHERE match_id = ? ORDER BY updated_at DESC LIMIT 1', [m.id]);
                    return { ...m, odds };
                });
                socket.emit('live_matches_update', withOdds);
            }
            catch (error) {
                logger_1.logger.error('Error sending live updates:', error);
            }
        });
        socket.on('request_balance', async () => {
            try {
                const user = (0, db_1.get)('SELECT balance FROM users WHERE id = ? LIMIT 1', [socket.userId]);
                if (user)
                    socket.emit('balance_update', { balance: user.balance });
            }
            catch (error) {
                logger_1.logger.error('Error sending balance update:', error);
            }
        });
        socket.on('disconnect', (reason) => {
            logger_1.logger.info(`User disconnected: ${socket.email} (${socket.userId}) - Reason: ${reason}`);
        });
        socket.on('error', (error) => {
            logger_1.logger.error(`Socket error for user ${socket.email}:`, error);
        });
    });
    return io;
};
exports.initializeSocketHandlers = initializeSocketHandlers;
const emitToUser = (io, userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
};
exports.emitToUser = emitToUser;
const emitToMatch = (io, matchId, event, data) => {
    io.to(`match_${matchId}`).emit(event, data);
};
exports.emitToMatch = emitToMatch;
const emitToAllLiveMatches = (io, event, data) => {
    io.to('live_matches').emit(event, data);
};
exports.emitToAllLiveMatches = emitToAllLiveMatches;
const broadcastMatchUpdate = (io, matchData) => {
    (0, exports.emitToAllLiveMatches)(io, 'match_update', matchData);
    (0, exports.emitToMatch)(io, matchData.id, 'match_score_update', {
        matchId: matchData.id,
        homeScore: matchData.home_score,
        awayScore: matchData.away_score,
        currentTime: matchData.current_time,
        status: matchData.status
    });
};
exports.broadcastMatchUpdate = broadcastMatchUpdate;
const broadcastOddsUpdate = (io, oddsData) => {
    (0, exports.emitToAllLiveMatches)(io, 'odds_update', oddsData);
    (0, exports.emitToMatch)(io, oddsData.match_id, 'match_odds_update', {
        matchId: oddsData.match_id,
        homeOdds: oddsData.home_odds,
        drawOdds: oddsData.draw_odds,
        awayOdds: oddsData.away_odds,
        timestamp: oddsData.updated_at
    });
};
exports.broadcastOddsUpdate = broadcastOddsUpdate;
const notifyBetSettlement = (io, userId, betData) => {
    (0, exports.emitToUser)(io, userId, 'bet_settled', {
        betId: betData.id,
        status: betData.status,
        amount: betData.status === 'won' ? betData.potential_win : 0,
        message: betData.status === 'won'
            ? `Congratulations! You won ETB ${betData.potential_win}`
            : 'Better luck next time!',
        timestamp: new Date().toISOString()
    });
};
exports.notifyBetSettlement = notifyBetSettlement;
const notifyBalanceChange = (io, userId, newBalance, change, reason) => {
    (0, exports.emitToUser)(io, userId, 'balance_changed', {
        newBalance,
        change,
        reason,
        timestamp: new Date().toISOString()
    });
};
exports.notifyBalanceChange = notifyBalanceChange;
//# sourceMappingURL=socketService.js.map