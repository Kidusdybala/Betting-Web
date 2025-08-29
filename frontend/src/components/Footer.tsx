import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src="/logos/logo.jpg" alt="GoalHut Logo" className="h-6 w-6 object-contain" />
              <div>
                <h3 className="font-bold text-lg">GoalHut</h3>
                <p className="text-xs text-muted-foreground">Ethiopian Betting</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Ethiopia's premier football betting platform with secure payments 
              and live odds.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Live Matches</a></li>
              <li><a href="#" className="hover:text-primary">Premier League</a></li>
              <li><a href="#" className="hover:text-primary">Champions League</a></li>
              <li><a href="#" className="hover:text-primary">How to Bet</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Help Center</a></li>
              <li><a href="#" className="hover:text-primary">Payment Methods</a></li>
              <li><a href="#" className="hover:text-primary">Responsible Gaming</a></li>
              <li><a href="#" className="hover:text-primary">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@goalhut.et</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+251 11 123 4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Addis Ababa, Ethiopia</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 GoalHut. All rights reserved. | Licensed by Ethiopian Gaming Authority</p>
          <p className="mt-2">Please gamble responsibly. 18+ only.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;