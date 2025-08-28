import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users } from "lucide-react";
import MatchCard from "@/components/ui/MatchCard";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { useMatches } from "@/hooks/useMatches";
import { useBetting } from "@/hooks/useBetting";

interface LiveMatchesProps {
  selectedLeague?: string;
}

const LiveMatches = ({ selectedLeague }: LiveMatchesProps) => {
  const limit = selectedLeague ? 10 : 6;
  const { matches, isLoading, error, refetch } = useMatches(selectedLeague, limit);
  const { handleBetClick } = useBetting();

  const getSectionTitle = () => {
    switch (selectedLeague) {
      case 'premier-league':
        return 'Premier League Matches';
      case 'la-liga':
        return 'La Liga Matches';
      case 'champions-league':
        return 'Champions League Matches';
      default:
        return 'Live & Upcoming Matches';
    }
  };

  const getSectionDescription = () => {
    if (selectedLeague) {
      return `Bet on ${selectedLeague.replace('-', ' ')} matches with real-time odds and instant updates`;
    }
    return 'Bet on live football matches with real-time odds and instant updates';
  };

  return (
    <section id="live-matches" className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {getSectionTitle().split(' ').slice(0, -1).join(' ')} <span className="text-primary">{getSectionTitle().split(' ').slice(-1)}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {getSectionDescription()}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 max-w-4xl mx-auto">
          {isLoading ? (
            <LoadingState message="Loading matches..." />
          ) : matches.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Matches Available"
              message="No matches available at the moment"
            />
          ) : (
            matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onBetClick={handleBetClick}
              />
            ))
          )}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg" onClick={refetch}>
            Refresh Matches
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LiveMatches;