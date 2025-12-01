import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

const StatsCard = ({ title, value, icon, trend, trendUp = true, className }: StatsCardProps) => {
  return (
    <Card className={`bg-primary/10 border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trendUp ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                <span>{trend}</span>
              </div>
            )}
          </div>
          <div className="text-primary opacity-80">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
