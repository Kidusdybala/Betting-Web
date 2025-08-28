import { Server } from 'socket.io';
export declare const initializeSocketHandlers: (io: Server) => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const emitToUser: (io: Server, userId: string, event: string, data: any) => void;
export declare const emitToMatch: (io: Server, matchId: string, event: string, data: any) => void;
export declare const emitToAllLiveMatches: (io: Server, event: string, data: any) => void;
export declare const broadcastMatchUpdate: (io: Server, matchData: any) => void;
export declare const broadcastOddsUpdate: (io: Server, oddsData: any) => void;
export declare const notifyBetSettlement: (io: Server, userId: string, betData: any) => void;
export declare const notifyBalanceChange: (io: Server, userId: string, newBalance: number, change: number, reason: string) => void;
//# sourceMappingURL=socketService.d.ts.map