import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, TrendingUp, Calculator, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface BetItem {
  id: string;
  matchId: string;
  match: string;
  selection: string;
  betType: 'home' | 'draw' | 'away';
  odds: number;
  league: string;
}

const BetSlip = () => {
  const { user, isAuthenticated } = useAuth();
  const [stake, setStake] = useState("");
  const [bets, setBets] = useState<BetItem[]>([]);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [error, setError] = useState("");

  const totalOdds = bets.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialWin = stake && parseFloat(stake) > 0 ? (parseFloat(stake) * totalOdds).toFixed(2) : "0.00";

  const removeBet = (id: string) => {
    setBets(bets.filter(bet => bet.id !== id));
  };

  const addBet = (matchId: string, match: string, selection: string, betType: 'home' | 'draw' | 'away', odds: number, league: string) => {
    const betId = `${matchId}-${betType}`;
    const existingBet = bets.find(bet => bet.id === betId);

    if (existingBet) {
      // Update existing bet
      setBets(bets.map(bet =>
        bet.id === betId ? { ...bet, odds } : bet
      ));
    } else {
      // Add new bet
      const newBet: BetItem = {
        id: betId,
        matchId,
        match,
        selection,
        betType,
        odds,
        league
      };
      setBets([...bets, newBet]);
    }
  };

  const handlePlaceBet = async () => {
    if (!isAuthenticated) {
      setError("Please login to place bets");
      return;
    }

    if (!stake || parseFloat(stake) <= 0) {
      setError("Please enter a valid stake amount");
      return;
    }

    if (bets.length === 0) {
      setError("Please add at least one bet");
      return;
    }

    if (!user || user.balance < parseFloat(stake)) {
      setError("Insufficient balance");
      return;
    }

    setIsPlacingBet(true);
    setError("");

    try {
      // For simplicity, place bets one by one (in a real app, you might want to place multiple bets in one transaction)
      for (const bet of bets) {
        await api.placeBet({
          matchId: bet.matchId,
          betType: bet.betType,
          stake: parseFloat(stake) / bets.length, // Split stake among multiple bets
          odds: bet.odds
        });
      }

      // Clear bet slip after successful placement
      setBets([]);
      setStake("");
      setError("");

      // Refresh user balance
      if (user) {
        // This would typically be handled by the auth context refresh
        window.location.reload(); // Simple refresh for now
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Expose addBet function globally for other components to use
  (window as any).addBetToSlip = addBet;

  if (!isAuthenticated) {
    return null; // Don't show bet slip for unauthenticated users
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-hidden z-50 shadow-lg">
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Bet Slip</h3>
            <Badge variant="secondary">{bets.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBets([])}
            disabled={bets.length === 0}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
              min="1"
              step="0.01"
              disabled={isPlacingBet}
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

          <Button
            className="w-full bg-gradient-primary"
            disabled={!stake || parseFloat(stake) <= 0 || isPlacingBet}
            onClick={handlePlaceBet}
          >
            {isPlacingBet ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Bet...
              </>
            ) : (
              "Place Bet"
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default BetSlip;