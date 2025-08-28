import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedMatches from "@/components/FeaturedMatches";
import LeagueNavigation from "@/components/LeagueNavigation";
import LiveMatches from "@/components/LiveMatches";
import PaymentMethods from "@/components/PaymentMethods";
import BetSlip from "@/components/BetSlip";
import Footer from "@/components/Footer";

const Index = () => {
  const [selectedLeague, setSelectedLeague] = useState<string>("");

  const handleLeagueSelect = (league: string) => {
    setSelectedLeague(league);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <FeaturedMatches />
      <LeagueNavigation
        onLeagueSelect={handleLeagueSelect}
        selectedLeague={selectedLeague}
      />
      <LiveMatches selectedLeague={selectedLeague} />
      <PaymentMethods />
      <BetSlip />
      <Footer />
    </div>
  );
};

export default Index;
