import { ReactNode, isValidElement } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

// --- UI COMPONENTS ---
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge"; // Badge import zaroori hai shape maintain karne k liye
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- TYPES FIX ---
// Ab ye 'string' aur 'Element' dono accept karega
interface EntityCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  image?: string;
  fallback: string;
  dataList: {
    icon: ReactNode;
    label: ReactNode;
  }[];
  tags?: ReactNode[]; // Changed to ReactNode array to accept Strings or Badges
  onEdit: () => void;
  onDelete: () => void;
}

export function EntityCard({
  title,
  subtitle,
  image,
  fallback,
  dataList,
  tags,
  onEdit,
  onDelete,
}: EntityCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-all group overflow-hidden">
      {/* 1. HEADER */}
      <CardHeader className="flex-row items-start justify-between space-y-0 p-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border bg-muted/20">
            <AvatarImage src={image} alt="img" />
            <AvatarFallback className="text-primary font-bold text-xs">
              {fallback}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-bold leading-none">
              {title}
            </CardTitle>
            {subtitle && (
              <div className="text-[10px] text-muted-foreground font-mono">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 -mr-2 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onEdit}
              className="text-xs cursor-pointer"
            >
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-xs text-destructive cursor-pointer focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <Separator className="opacity-50" />

      {/* 2. CONTENT */}
      <CardContent className="flex-1 p-4 pt-3 space-y-2">
        {dataList.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span className="text-primary/70 [&_svg]:h-3.5 [&_svg]:w-3.5 shrink-0">
              {item.icon}
            </span>
            <span className="truncate flex-1">{item.label}</span>
          </div>
        ))}
      </CardContent>

      {/* 3. FOOTER (With Shape Logic) */}
      {tags && tags.length > 0 && (
        <CardFooter className="p-3 bg-muted/20 border-t flex flex-wrap gap-2">
          {tags.map((tag, i) => {
            // LOGIC: Agar string hai to Badge bana do, agar already Badge (Element) hai to waisa hi rehne do
            if (typeof tag === "string" || typeof tag === "number") {
              return (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] h-5 px-1.5 font-normal rounded-full" // Rounded-full for Pill Shape
                >
                  {tag}
                </Badge>
              );
            }
            // Agar Element hai (Jese Users page se aa raha hai)
            return (
              <span key={i} className="contents">
                {tag}
              </span>
            );
          })}
        </CardFooter>
      )}
    </Card>
  );
}
