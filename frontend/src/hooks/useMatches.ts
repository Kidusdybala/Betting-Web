import { useState, useEffect } from "react";
import { api, Match } from "@/lib/api";

export const useMatches = (league?: string, limit: number = 10) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      setError("");

      let response;

      if (league === 'premier-league') {
        response = await api.getPremierLeagueMatches({ limit });
      } else if (league === 'la-liga') {
        response = await api.getLaLigaMatches({ limit });
      } else if (league === 'champions-league') {
        response = await api.getChampionsLeagueMatches({ limit });
      } else {
        response = await api.getMatches({ limit });
      }

      if (response.success) {
        setMatches(response.data.matches);
      } else {
        setError(response.message || "Failed to load matches");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matches");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [league, limit]);

  return { matches, isLoading, error, refetch: fetchMatches };
};

export const useFeaturedMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFeaturedMatches = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Fetch upcoming matches from different leagues
      const [premierLeague, laLiga, championsLeague] = await Promise.all([
        api.getPremierLeagueMatches({ limit: 2 }),
        api.getLaLigaMatches({ limit: 2 }),
        api.getChampionsLeagueMatches({ limit: 2 })
      ]);

      const allMatches: Match[] = [];

      if (premierLeague.success) {
        allMatches.push(...premierLeague.data.matches);
      }
      if (laLiga.success) {
        allMatches.push(...laLiga.data.matches);
      }
      if (championsLeague.success) {
        allMatches.push(...championsLeague.data.matches);
      }

      // Sort by start time and take the first 6
      const sortedMatches = allMatches
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 6);

      setMatches(sortedMatches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load featured matches");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedMatches();
  }, []);

  return { matches, isLoading, error, refetch: fetchFeaturedMatches };
};