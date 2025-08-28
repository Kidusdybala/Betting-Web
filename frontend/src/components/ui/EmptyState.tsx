import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  className?: string;
}

const EmptyState = ({ icon: Icon, title, message, className = "" }: EmptyStateProps) => {
  return (
    <Card className={`p-12 text-center ${className}`}>
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{message}</p>
    </Card>
  );
};

export default EmptyState;