import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, TrendingUp } from "lucide-react";
import heroStadium from "@/assets/hero-stadium.jpg";

const Hero = () => {
  return (
    <section className="relative h-[70vh] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroStadium})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
      
      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl space-y-6 animate-slide-up">
          <Badge className="bg-success/20 text-success border-success/30">
            <Play className="h-3 w-3 mr-1" />
            LIVE BETTING
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            Bet on <span className="bg-gradient-primary bg-clip-text text-transparent">Football</span>
            <br />
            Win Big
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            Experience the thrill of live football betting with real-time odds, 
            secure Ethiopian payment methods, and instant withdrawals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-gradient-primary text-lg px-8 animate-pulse-glow">
              <TrendingUp className="h-5 w-5 mr-2" />
              Start Betting Now
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              View Live Matches
            </Button>
          </div>
          
          <div className="flex items-center space-x-6 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">50+</div>
              <div className="text-sm text-muted-foreground">Live Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">95%</div>
              <div className="text-sm text-muted-foreground">Payout Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;