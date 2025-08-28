import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

const LoadingState = ({ message = "Loading...", className = "" }: LoadingStateProps) => {
  return (
    <Card className={`p-12 text-center ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </Card>
  );
};

export default LoadingState;