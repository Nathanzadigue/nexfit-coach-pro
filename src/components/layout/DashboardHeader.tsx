import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
}

export const DashboardHeader = ({ title, subtitle, userName = "Utilisateur" }: DashboardHeaderProps) => {
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left - Title */}
      <div>
        <h1 className="text-xl font-bold font-display">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:block relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="w-64 pl-9 h-9 bg-secondary/50"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">Premium</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
};
