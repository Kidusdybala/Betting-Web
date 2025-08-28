import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Building, Zap } from "lucide-react";

const PaymentMethods = () => {
  const methods = [
    {
      name: "Chapa",
      description: "Fast and secure mobile payments",
      icon: <CreditCard className="h-8 w-8" />,
      features: ["Instant deposits", "Low fees", "24/7 available"],
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      name: "Telebirr",
      description: "Ethiopia's leading mobile payment",
      icon: <Smartphone className="h-8 w-8" />,
      features: ["Mobile money", "Quick transfer", "Widely accepted"],
      color: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      name: "CBE",
      description: "Commercial Bank of Ethiopia",
      icon: <Building className="h-8 w-8" />,
      features: ["Bank transfer", "Secure", "Trusted"],
      color: "bg-gradient-to-br from-green-500 to-green-600"
    }
  ];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ethiopian <span className="text-primary">Payment Methods</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Deposit and withdraw using your favorite Ethiopian payment methods. 
            Fast, secure, and reliable transactions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {methods.map((method, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <div className="text-center space-y-4">
                <div className={`${method.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto text-white`}>
                  {method.icon}
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">{method.name}</h3>
                  <p className="text-muted-foreground text-sm">{method.description}</p>
                </div>

                <div className="space-y-2">
                  {method.features.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      {feature}
                    </Badge>
                  ))}
                </div>

                <Button className="w-full bg-gradient-primary">
                  Deposit with {method.name}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">Min</div>
              <div className="text-sm text-muted-foreground">ETB 10</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">Max</div>
              <div className="text-sm text-muted-foreground">ETB 50,000</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Fee</div>
              <div className="text-sm text-muted-foreground">0-2%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">Time</div>
              <div className="text-sm text-muted-foreground">Instant</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentMethods;