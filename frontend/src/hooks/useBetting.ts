import { Match } from "@/lib/api";

export const useBetting = () => {
  const handleBetClick = (match: Match, betType: 'home' | 'draw' | 'away', odds: number) => {
    const selection = betType === 'home' ? `${match.homeTeam} Win` :
                      betType === 'draw' ? 'Draw' :
                      `${match.awayTeam} Win`;

    // Use the global function exposed by BetSlip component
    if ((window as any).addBetToSlip) {
      (window as any).addBetToSlip(
        match.id,
        `${match.homeTeam} vs ${match.awayTeam}`,
        selection,
        betType,
        odds,
        match.league
      );
    }
  };

  return { handleBetClick };
};