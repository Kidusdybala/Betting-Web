import axios, { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';

interface OddsApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface MatchOdds {
  matchId: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  bookmaker: string;
  lastUpdated: string;
}

interface OddsApiConfig {
  baseUrl: string;
  apiKey: string;
  sport: string;
  region: string;
  market: string;
}

class OddsService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private configLoaded = false;
  private config: OddsApiConfig | null = null;

  constructor() {
    // Don't load config in constructor - do it lazily
    logger.info('Odds service initialized (lazy loading)');
  }

  private loadConfig(): OddsApiConfig {
    if (!this.configLoaded) {
      this.config = {
        baseUrl: process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4',
        apiKey: process.env.ODDS_API_KEY || '',
        sport: process.env.ODDS_API_SPORT || 'soccer',
        region: process.env.ODDS_API_REGION || 'eu',
        market: process.env.ODDS_API_MARKET || 'h2h'
      };
      this.configLoaded = true;

      if (!this.config.apiKey || this.config.apiKey === 'your_odds_api_key_here') {
        logger.warn('ODDS_API_KEY not configured. Odds service will use fallback data.');
      } else {
        logger.info('ODDS_API_KEY is configured. Will attempt to fetch real data from API.');
      }
    }
    return this.config!;
  }

  /**
   * Fetch odds for a specific match
   */
  async getMatchOdds(matchId: string): Promise<OddsApiResponse> {
    try {
      // Check cache first
      const cached = this.getCachedData(`match_${matchId}`);
      if (cached) {
        return { success: true, data: cached };
      }

      // Try to fetch from real odds API
      const config = this.loadConfig();
      if (config.apiKey && config.apiKey !== 'your_odds_api_key_here' && config.apiKey.trim() !== '') {
        try {
          const response = await axios.get(`${config.baseUrl}/sports/${config.sport}/odds`, {
            params: {
              apiKey: config.apiKey,
              regions: config.region,
              markets: config.market,
              oddsFormat: 'decimal'
            },
            timeout: 10000
          });

          if (response.data && response.data.length > 0) {
            // Find the match in the API response
            const apiMatch = response.data.find((match: any) =>
              match.id === matchId || match.home_team === matchId || match.away_team === matchId
            );

            if (apiMatch && apiMatch.bookmakers && apiMatch.bookmakers.length > 0) {
              const bookmaker = apiMatch.bookmakers[0];
              const market = bookmaker.markets.find((m: any) => m.key === this.config.market);

              if (market && market.outcomes && market.outcomes.length >= 3) {
                const homeOutcome = market.outcomes.find((o: any) => o.name === apiMatch.home_team);
                const awayOutcome = market.outcomes.find((o: any) => o.name === apiMatch.away_team);
                const drawOutcome = market.outcomes.find((o: any) => o.name === 'Draw');

                const realOdds: MatchOdds = {
                  matchId,
                  homeOdds: homeOutcome ? homeOutcome.price : 2.1,
                  drawOdds: drawOutcome ? drawOutcome.price : 3.2,
                  awayOdds: awayOutcome ? awayOutcome.price : 3.5,
                  bookmaker: bookmaker.title,
                  lastUpdated: new Date().toISOString()
                };

                this.setCachedData(`match_${matchId}`, realOdds);
                return { success: true, data: realOdds };
              }
            }
          }
        } catch (apiError) {
          logger.warn('Failed to fetch from odds API, falling back to mock data:', apiError.message);
        }
      }

      // Fallback to mock data if API fails or is not configured
      const mockOdds: MatchOdds = {
        matchId,
        homeOdds: 2.1 + Math.random() * 0.5,
        drawOdds: 3.2 + Math.random() * 0.3,
        awayOdds: 3.5 + Math.random() * 0.5,
        bookmaker: 'Multiple Bookmakers',
        lastUpdated: new Date().toISOString()
      };

      this.setCachedData(`match_${matchId}`, mockOdds);
      return { success: true, data: mockOdds };

    } catch (error) {
      logger.error('Error fetching match odds:', error);
      return {
        success: false,
        message: 'Failed to fetch match odds',
        data: this.getFallbackOdds(matchId)
      };
    }
  }

  /**
   * Fetch odds for multiple matches
   */
  async getMultipleMatchOdds(matchIds: string[]): Promise<OddsApiResponse> {
    try {
      const results = await Promise.allSettled(
        matchIds.map(id => this.getMatchOdds(id))
      );

      const odds = results
        .filter((result): result is PromiseFulfilledResult<OddsApiResponse> =>
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value.data);

      return { success: true, data: odds };

    } catch (error) {
      logger.error('Error fetching multiple match odds:', error);
      return {
        success: false,
        message: 'Failed to fetch odds for multiple matches'
      };
    }
  }

  /**
   * Fetch live odds for all matches
   */
  async getLiveOdds(): Promise<OddsApiResponse> {
    try {
      // Check cache
      const cached = this.getCachedData('live_odds');
      if (cached) {
        return { success: true, data: cached };
      }

      // In a real implementation, this would call the odds API
      // For now, return mock data
      const mockLiveOdds = {
        matches: [
          {
            id: 'mock_match_1',
            homeOdds: 1.85,
            drawOdds: 3.40,
            awayOdds: 4.20,
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'mock_match_2',
            homeOdds: 2.10,
            drawOdds: 3.25,
            awayOdds: 3.60,
            lastUpdated: new Date().toISOString()
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      this.setCachedData('live_odds', mockLiveOdds);
      return { success: true, data: mockLiveOdds };

    } catch (error) {
      logger.error('Error fetching live odds:', error);
      return {
        success: false,
        message: 'Failed to fetch live odds'
      };
    }
  }

  /**
   * Fetch odds history for a match
   */
  async getOddsHistory(matchId: string, limit: number = 50): Promise<OddsApiResponse> {
    try {
      // In a real implementation, this would fetch historical odds data
      // For now, return mock historical data
      const history = [];
      const baseTime = Date.now();

      for (let i = 0; i < Math.min(limit, 20); i++) {
        const timestamp = new Date(baseTime - (i * 30 * 60 * 1000)); // 30 minutes apart
        history.push({
          matchId,
          homeOdds: 2.0 + Math.random() * 0.4,
          drawOdds: 3.2 + Math.random() * 0.3,
          awayOdds: 3.5 + Math.random() * 0.4,
          timestamp: timestamp.toISOString()
        });
      }

      return { success: true, data: { history } };

    } catch (error) {
      logger.error('Error fetching odds history:', error);
      return {
        success: false,
        message: 'Failed to fetch odds history'
      };
    }
  }

  /**
   * Get odds movements (significant changes)
   */
  async getOddsMovements(hoursBack: number = 24, threshold: number = 0.1): Promise<OddsApiResponse> {
    try {
      // In a real implementation, this would analyze odds changes
      // For now, return mock movement data
      const movements = [
        {
          matchId: 'mock_match_1',
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea',
          league: 'Premier League',
          previous: {
            homeOdds: 2.10,
            drawOdds: 3.20,
            awayOdds: 3.50,
            timestamp: new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
          },
          current: {
            homeOdds: 1.95,
            drawOdds: 3.40,
            awayOdds: 3.80,
            timestamp: new Date().toISOString()
          },
          changes: {
            home: '-7.14',
            draw: '+6.25',
            away: '+8.57'
          }
        }
      ];

      return { success: true, data: { movements } };

    } catch (error) {
      logger.error('Error fetching odds movements:', error);
      return {
        success: false,
        message: 'Failed to fetch odds movements'
      };
    }
  }

  /**
   * Private method to get cached data
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Private method to set cached data
   */
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Private method to get fallback odds when API fails
   */
  private getFallbackOdds(matchId: string): MatchOdds {
    return {
      matchId,
      homeOdds: 2.0,
      drawOdds: 3.25,
      awayOdds: 3.75,
      bookmaker: 'Fallback',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Odds cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const oddsService = new OddsService();
export default oddsService;