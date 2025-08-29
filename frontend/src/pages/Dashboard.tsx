import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, Match, Bet } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, TrendingUp, Clock, Target } from "lucide-react";

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const [matchesResponse, betsResponse] = await Promise.all([
        api.getLiveMatches(),
        api.getUserBets({ limit: 10 })
      ]);

      if (matchesResponse.success) {
        setMatches(matchesResponse.data.matches);
      }

      if (betsResponse.success) {
        setUserBets(betsResponse.data.bets);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingBets = userBets.filter(bet => bet.status === 'pending');
  const wonBets = userBets.filter(bet => bet.status === 'won');
  const lostBets = userBets.filter(bet => bet.status === 'lost');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {user.fullName || user.email}!
              </h1>
              <p className="text-muted-foreground">Here's your betting dashboard</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ETB {user.balance.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bets</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingBets.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won Bets</CardTitle>
              <img src="/logos/logo.jpg" alt="Logo" className="h-4 w-4 object-contain opacity-60" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{wonBets.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userBets.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="live-matches" className="space-y-6">
          <TabsList>
            <TabsTrigger value="live-matches">Live Matches</TabsTrigger>
            <TabsTrigger value="my-bets">My Bets</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="live-matches" className="space-y-4">
            <h2 className="text-2xl font-bold">Live Matches</h2>
            {matches.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No live matches at the moment</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {matches.slice(0, 6).map((match) => (
                  <Card key={match.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge className="bg-success/20 text-success">LIVE</Badge>
                          <div>
                            <p className="font-semibold">{match.homeTeam} vs {match.awayTeam}</p>
                            <p className="text-sm text-muted-foreground">{match.league}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {match.homeScore || 0} - {match.awayScore || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">{match.currentTime || '45\''}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-bets" className="space-y-4">
            <h2 className="text-2xl font-bold">My Bets</h2>
            {userBets.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bets placed yet</p>
                    <Button className="mt-4" onClick={() => navigate("/")}>
                      Start Betting
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {userBets.map((bet) => (
                  <Card key={bet.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {bet.match?.homeTeam} vs {bet.match?.awayTeam}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {bet.match?.league} • {bet.betType} • ETB {bet.stake}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              bet.status === 'won' ? 'default' :
                              bet.status === 'lost' ? 'destructive' :
                              'secondary'
                            }
                            className={
                              bet.status === 'won' ? 'bg-success/20 text-success' : ''
                            }
                          >
                            {bet.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {bet.status === 'won' ? `+ETB ${bet.potentialWin}` :
                             bet.status === 'pending' ? `Potential: ETB ${bet.potentialWin}` :
                             `Lost: ETB ${bet.stake}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <h2 className="text-2xl font-bold">Upcoming Matches</h2>
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Upcoming matches feature coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;