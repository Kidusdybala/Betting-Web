import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Star, Crown } from "lucide-react";

const LogoIcon = () => (
  <img src="/logos/logo.jpg" alt="Logo" className="h-8 w-8 object-contain" />
);

interface LeagueNavigationProps {
  onLeagueSelect: (league: string) => void;
  selectedLeague?: string;
}

const LeagueNavigation = ({ onLeagueSelect, selectedLeague }: LeagueNavigationProps) => {
  const leagues = [
    {
      id: 'premier-league',
      name: 'Premier League',
      icon: LogoIcon,
      color: 'bg-blue-500/20 text-blue-600 border-blue-500/30 hover:bg-blue-500/30',
      description: 'English Premier League'
    },
    {
      id: 'la-liga',
      name: 'La Liga',
      icon: Star,
      color: 'bg-red-500/20 text-red-600 border-red-500/30 hover:bg-red-500/30',
      description: 'Spanish La Liga'
    },
    {
      id: 'champions-league',
      name: 'Champions League',
      icon: Crown,
      color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/30',
      description: 'UEFA Champions League'
    }
  ];

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Browse by <span className="text-primary">League</span>
          </h2>
          <p className="text-muted-foreground">
            Select a league to view matches and betting odds
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {leagues.map((league) => {
            const IconComponent = league.icon;
            const isSelected = selectedLeague === league.id;

            return (
              <Card
                key={league.id}
                className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => onLeagueSelect(league.id)}
              >
                <div className="text-center space-y-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${league.color}`}>
                    <IconComponent className="h-8 w-8" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">{league.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{league.description}</p>

                    {isSelected && (
                      <Badge variant="default" className="bg-primary">
                        Selected
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLeagueSelect(league.id);
                    }}
                  >
                    View Matches
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LeagueNavigation;