import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

const LiveMatches = () => {
  const matches = [
    {
      id: 1,
      league: "Premier League",
      homeTeam: "Arsenal",
      awayTeam: "Chelsea",
      homeOdds: 2.45,
      drawOdds: 3.20,
      awayOdds: 2.80,
      time: "45' + 2",
      score: "1-0",
      isLive: true
    },
    {
      id: 2,
      league: "La Liga",
      homeTeam: "Barcelona",
      awayTeam: "Real Madrid",
      homeOdds: 2.10,
      drawOdds: 3.50,
      awayOdds: 3.40,
      time: "65'",
      score: "2-1",
      isLive: true
    },
    {
      id: 3,
      league: "Champions League",
      homeTeam: "Man City",
      awayTeam: "PSG",
      homeOdds: 1.85,
      drawOdds: 3.80,
      awayOdds: 4.20,
      time: "20:00",
      score: "vs",
      isLive: false
    }
  ];

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Live & Upcoming <span className="text-primary">Matches</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bet on live football matches with real-time odds and instant updates
          </p>
        </div>

        <div className="grid gap-4 max-w-4xl mx-auto">
          {matches.map((match) => (
            <Card key={match.id} className="p-6 hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Badge variant={match.isLive ? "default" : "secondary"} className="bg-primary/20 text-primary">
                    {match.isLive ? "LIVE" : "UPCOMING"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{match.league}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {match.isLive ? (
                    <>
                      <Clock className="h-4 w-4" />
                      <span>{match.time}</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      <span>{match.time}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                {/* Teams */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{match.homeTeam}</span>
                    {match.isLive && <span className="text-lg font-bold">{match.score.split('-')[0]}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{match.awayTeam}</span>
                    {match.isLive && <span className="text-lg font-bold">{match.score.split('-')[1]}</span>}
                  </div>
                </div>

                {/* Odds */}
                <div className="md:col-span-3 grid grid-cols-3 gap-2">
                  <Button variant="outline" className="flex flex-col p-3 h-auto hover:bg-success/10 hover:border-success">
                    <span className="text-xs text-muted-foreground mb-1">1</span>
                    <span className="font-bold text-odds-positive">{match.homeOdds}</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col p-3 h-auto hover:bg-warning/10 hover:border-warning">
                    <span className="text-xs text-muted-foreground mb-1">X</span>
                    <span className="font-bold">{match.drawOdds}</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col p-3 h-auto hover:bg-success/10 hover:border-success">
                    <span className="text-xs text-muted-foreground mb-1">2</span>
                    <span className="font-bold text-odds-positive">{match.awayOdds}</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            View All Matches
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LiveMatches;