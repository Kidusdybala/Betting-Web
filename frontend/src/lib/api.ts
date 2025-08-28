import { supabase } from '@/integrations/supabase/client';

// API Base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

// Types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  balance: number;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
  currentTime?: string;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  oddsUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bet {
  id: string;
  userId: string;
  matchId: string;
  betType: 'home' | 'draw' | 'away';
  odds: number;
  stake: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  placedAt: string;
  settledAt?: string;
  match?: Match;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet_stake' | 'bet_win';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// API Client Class
class ApiClient {
  private token: string | null = null;

  constructor() {
    // Get token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse['data']>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data.token) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
    }

    return response as AuthResponse;
  }

  async register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse['data']>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });

    if (response.success && response.data.token) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
    }

    return response as AuthResponse;
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('auth_token');
    await this.request('/auth/logout', { method: 'POST' });
  }

  // Match methods
  async getMatches(params?: {
    page?: number;
    limit?: number;
    status?: string;
    league?: string;
  }): Promise<ApiResponse<{ matches: Match[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.league) queryParams.append('league', params.league);

    const query = queryParams.toString();
    return this.request(`/matches${query ? `?${query}` : ''}`);
  }

  async getLiveMatches(): Promise<ApiResponse<{ matches: Match[] }>> {
    return this.request('/matches/live');
  }

  async getUpcomingMatches(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ matches: Match[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/matches/upcoming${query ? `?${query}` : ''}`);
  }

  async getPremierLeagueMatches(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ matches: Match[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/matches/premier-league${query ? `?${query}` : ''}`);
  }

  async getLaLigaMatches(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ matches: Match[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/matches/la-liga${query ? `?${query}` : ''}`);
  }

  async getChampionsLeagueMatches(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ matches: Match[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/matches/champions-league${query ? `?${query}` : ''}`);
  }

  async getMatch(id: string): Promise<ApiResponse<{ match: Match }>> {
    return this.request(`/matches/${id}`);
  }

  // Bet methods
  async placeBet(betData: {
    matchId: string;
    betType: 'home' | 'draw' | 'away';
    stake: number;
    odds: number;
  }): Promise<ApiResponse<{ bet: Bet }>> {
    return this.request('/bets', {
      method: 'POST',
      body: JSON.stringify(betData),
    });
  }

  async getUserBets(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{ bets: Bet[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request(`/bets/my-bets${query ? `?${query}` : ''}`);
  }

  async getBet(id: string): Promise<ApiResponse<{ bet: Bet }>> {
    return this.request(`/bets/${id}`);
  }

  async cancelBet(id: string): Promise<ApiResponse<void>> {
    return this.request(`/bets/${id}/cancel`, { method: 'PATCH' });
  }

  async getBetStats(): Promise<ApiResponse<{ summary: any }>> {
    return this.request('/bets/stats/summary');
  }

  // User methods
  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/users/profile');
  }

  async updateProfile(fullName: string): Promise<ApiResponse<{ user: User }>> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName }),
    });
  }

  async getUserBalance(): Promise<ApiResponse<{ balance: number }>> {
    return this.request('/users/balance');
  }

  async getUserTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<ApiResponse<{ transactions: Transaction[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);

    const query = queryParams.toString();
    return this.request(`/users/transactions${query ? `?${query}` : ''}`);
  }

  async getUserStats(): Promise<ApiResponse<{ stats: any }>> {
    return this.request('/users/stats');
  }

  // Payment methods
  async deposit(amount: number, paymentMethod: string): Promise<ApiResponse<{ transaction: Transaction }>> {
    return this.request('/payments/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod }),
    });
  }

  async withdraw(amount: number, paymentMethod: string, accountDetails: any): Promise<ApiResponse<{ transaction: Transaction }>> {
    return this.request('/payments/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod, accountDetails }),
    });
  }

  async getPaymentMethods(): Promise<ApiResponse<{ paymentMethods: any[] }>> {
    return this.request('/payments/methods');
  }

  async getPaymentHistory(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<ApiResponse<{ transactions: Transaction[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);

    const query = queryParams.toString();
    return this.request(`/payments/history${query ? `?${query}` : ''}`);
  }

  // Odds methods
  async getMatchOdds(matchId: string): Promise<ApiResponse<{ odds: any }>> {
    return this.request(`/odds/match/${matchId}`);
  }

  async getLiveOdds(): Promise<ApiResponse<{ matches: Match[] }>> {
    return this.request('/odds/live');
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage: (data: any) => void): WebSocket | null {
    try {
      const wsUrl = ((import.meta as any).env?.VITE_WS_URL || 'ws://localhost:5000').replace(/^http/, 'ws');
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return ws;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      return null;
    }
  }

  // Set auth token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Clear auth token
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Export singleton instance
export const api = new ApiClient();

// React Query hooks (optional - can be used with the API client)
export const useApi = () => api;