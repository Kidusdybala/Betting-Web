import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LiveMatches from "@/components/LiveMatches";
import PaymentMethods from "@/components/PaymentMethods";
import BetSlip from "@/components/BetSlip";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <LiveMatches />
      <PaymentMethods />
      <BetSlip />
      <Footer />
    </div>
  );
};

export default Index;
