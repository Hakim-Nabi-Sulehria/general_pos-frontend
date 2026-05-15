import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  highlight?: boolean;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  highlight,
}: KpiCardProps) {
  return (
    <Card
      className={
        highlight ? "bg-primary text-primary-foreground border-primary" : ""
      }
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle
          className={`text-sm font-medium ${
            highlight ? "text-primary-foreground" : ""
          }`}
        >
          {title}
        </CardTitle>
        <Icon
          className={`h-4 w-4 ${
            highlight ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p
            className={`text-xs mt-1 ${
              highlight ? "text-primary-foreground/80" : "text-muted-foreground"
            }`}
          >
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
