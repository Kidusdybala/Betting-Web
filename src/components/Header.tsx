import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, User, Wallet } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">GoalHut</h1>
              <p className="text-xs text-muted-foreground">Ethiopian Betting</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Live Matches
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Premier League
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              La Liga
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Champions League
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="hidden sm:flex">
              <Wallet className="h-3 w-3 mr-1" />
              ETB 0.00
            </Badge>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
            <Button size="sm" className="bg-gradient-primary">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;