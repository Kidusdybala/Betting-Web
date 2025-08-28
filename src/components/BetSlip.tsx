import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, TrendingUp, Calculator } from "lucide-react";
import { useState } from "react";

const BetSlip = () => {
  const [stake, setStake] = useState("");
  const [bets, setBets] = useState([
    {
      id: 1,
      match: "Arsenal vs Chelsea",
      selection: "Arsenal Win",
      odds: 2.45,
      league: "Premier League"
    }
  ]);

  const totalOdds = bets.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialWin = stake ? (parseFloat(stake) * totalOdds).toFixed(2) : "0.00";

  const removeBet = (id: number) => {
    setBets(bets.filter(bet => bet.id !== id));
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-hidden z-50 shadow-lg">
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Bet Slip</h3>
            <Badge variant="secondary">{bets.length}</Badge>
          </div>
          <Button variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
        {bets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No bets selected</p>
            <p className="text-sm">Click on odds to add bets</p>
          </div>
        ) : (
          bets.map((bet) => (
            <div key={bet.id} className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{bet.match}</p>
                  <p className="text-xs text-muted-foreground">{bet.league}</p>
                  <p className="text-sm text-primary font-medium">{bet.selection}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-success/20 text-success">
                    {bet.odds}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBet(bet.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {bets.length > 0 && (
        <div className="p-4 border-t bg-muted/30 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Stake (ETB)</label>
            <Input
              type="number"
              placeholder="Enter stake amount"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="mb-2"
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Odds:</span>
              <span className="font-bold text-primary">{totalOdds.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Potential Win:</span>
              <span className="font-bold text-success">ETB {potentialWin}</span>
            </div>
          </div>

          <Button className="w-full bg-gradient-primary" disabled={!stake || parseFloat(stake) <= 0}>
            Place Bet
          </Button>
        </div>
      )}
    </Card>
  );
};

export default BetSlip;