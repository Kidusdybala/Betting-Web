import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star } from "lucide-react";
import MatchCard from "@/components/ui/MatchCard";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { useFeaturedMatches } from "@/hooks/useMatches";
import { useBetting } from "@/hooks/useBetting";

const FeaturedMatches = () => {
  const { matches, isLoading, error, refetch } = useFeaturedMatches();
  const { handleBetClick } = useBetting();

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Star className="h-6 w-6 text-yellow-500 mr-2" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Featured <span className="text-primary">Matches</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Don't miss these upcoming big games from top European leagues with live betting odds
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 max-w-6xl mx-auto">
          {isLoading ? (
            <LoadingState message="Loading featured matches..." />
          ) : matches.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No Featured Matches"
              message="No featured matches available at the moment"
            />
          ) : (
            matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onBetClick={handleBetClick}
                className="bg-background/50 backdrop-blur-sm"
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

export default FeaturedMatches;