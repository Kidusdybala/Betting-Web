export declare const supabase: any;
export declare const supabaseAdmin: any;
export interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    balance: number;
    created_at: string;
    updated_at: string;
}
export interface Match {
    id: string;
    home_team: string;
    away_team: string;
    league: string;
    start_time: string;
    status: 'upcoming' | 'live' | 'finished';
    home_score?: number;
    away_score?: number;
    current_time?: string;
    created_at: string;
    updated_at: string;
}
export interface Odds {
    id: string;
    match_id: string;
    home_odds: number;
    draw_odds: number;
    away_odds: number;
    created_at: string;
    updated_at: string;
}
export interface Bet {
    id: string;
    user_id: string;
    match_id: string;
    bet_type: 'home' | 'draw' | 'away';
    odds: number;
    stake: number;
    potential_win: number;
    status: 'pending' | 'won' | 'lost' | 'cancelled';
    placed_at: string;
    settled_at?: string;
}
export interface Transaction {
    id: string;
    user_id: string;
    type: 'deposit' | 'withdrawal' | 'bet_stake' | 'bet_win';
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    reference?: string;
    created_at: string;
}
//# sourceMappingURL=supabase.d.ts.map