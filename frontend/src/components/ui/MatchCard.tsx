import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { Match } from "@/lib/api";

interface MatchCardProps {
  match: Match;
  onBetClick: (match: Match, betType: 'home' | 'draw' | 'away', odds: number) => void;
  className?: string;
}

const MatchCard = ({ match, onBetClick, className = "" }: MatchCardProps) => {
  const getLeagueColor = (league: string) => {
    const leagueLower = league.toLowerCase();
    if (leagueLower.includes('premier')) return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
    if (leagueLower.includes('la liga') || leagueLower.includes('laliga')) return 'bg-red-500/20 text-red-600 border-red-500/30';
    if (leagueLower.includes('champions')) return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
    return 'bg-primary/20 text-primary border-primary/30';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'finished': return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
      default: return 'bg-green-500/20 text-green-600 border-green-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'LIVE';
      case 'finished': return 'FINISHED';
      default: return 'UPCOMING';
    }
  };

  return (
    <Card className={`p-6 hover:border-primary/50 transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Badge className={`${getLeagueColor(match.league)} border`}>
            {match.league}
          </Badge>
          <Badge variant="outline" className={`${getStatusColor(match.status)} border`}>
            {getStatusText(match.status)}
          </Badge>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {match.status === 'live' && match.currentTime
              ? match.currentTime
              : new Date(match.startTime).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
            }
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Teams */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{match.homeTeam}</span>
            {match.status === 'live' && match.homeScore !== undefined && (
              <span className="text-lg font-bold">{match.homeScore}</span>
            )}
          </div>
          <div className="text-center text-sm text-muted-foreground">vs</div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{match.awayTeam}</span>
            {match.status === 'live' && match.awayScore !== undefined && (
              <span className="text-lg font-bold">{match.awayScore}</span>
            )}
          </div>
        </div>

        {/* Odds */}
        <div className="md:col-span-3 grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="flex flex-col p-3 h-auto hover:bg-success/10 hover:border-success cursor-pointer"
            onClick={() => match.homeOdds && onBetClick(match, 'home', match.homeOdds)}
            disabled={!match.homeOdds}
          >
            <span className="text-xs text-muted-foreground mb-1">1</span>
            <span className="font-bold text-odds-positive">
              {match.homeOdds || '-'}
            </span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col p-3 h-auto hover:bg-warning/10 hover:border-warning cursor-pointer"
            onClick={() => match.drawOdds && onBetClick(match, 'draw', match.drawOdds)}
            disabled={!match.drawOdds}
          >
            <span className="text-xs text-muted-foreground mb-1">X</span>
            <span className="font-bold">
              {match.drawOdds || '-'}
            </span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col p-3 h-auto hover:bg-success/10 hover:border-success cursor-pointer"
            onClick={() => match.awayOdds && onBetClick(match, 'away', match.awayOdds)}
            disabled={!match.awayOdds}
          >
            <span className="text-xs text-muted-foreground mb-1">2</span>
            <span className="font-bold text-odds-positive">
              {match.awayOdds || '-'}
            </span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MatchCard;