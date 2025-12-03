import { Link, useLocation } from "react-router-dom";
import { 
  Dumbbell, 
  LayoutDashboard, 
  Calendar, 
  MessageCircle, 
  User, 
  Settings, 
  BarChart3, 
  FileText,
  CreditCard,
  Users,
  Shield,
  LogOut,
  ChevronLeft,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type UserRole = "client" | "coach" | "admin";

interface SidebarProps {
  role: UserRole;
}

const clientLinks = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/client" },
  { icon: Calendar, label: "Mes rendez-vous", href: "/client/appointments" },
  { icon: MessageCircle, label: "Messages", href: "/client/messages" },
  { icon: BarChart3, label: "Ma progression", href: "/client/progress" },
  { icon: FileText, label: "Mes programmes", href: "/client/programs" },
  { icon: CreditCard, label: "Paiements", href: "/client/payments" },
  { icon: User, label: "Mon profil", href: "/client/profile" },
];

const coachLinks = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/coach" },
  { icon: Calendar, label: "Planning", href: "/coach/schedule" },
  { icon: Users, label: "Mes clients", href: "/coach/clients" },
  { icon: MessageCircle, label: "Messages", href: "/coach/messages" },
  { icon: FileText, label: "Programmes", href: "/coach/programs" },
  { icon: BarChart3, label: "Statistiques", href: "/coach/stats" },
  { icon: CreditCard, label: "Revenus", href: "/coach/earnings" },
  { icon: User, label: "Mon profil", href: "/coach/profile" },
];

const adminLinks = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Utilisateurs", href: "/admin/users" },
  { icon: Shield, label: "Validation coachs", href: "/admin/coaches" },
  { icon: CreditCard, label: "Paiements", href: "/admin/payments" },
  { icon: BarChart3, label: "Statistiques", href: "/admin/stats" },
  { icon: Bell, label: "Notifications", href: "/admin/notifications" },
  { icon: Settings, label: "Paramètres", href: "/admin/settings" },
];

const roleLinks = {
  client: clientLinks,
  coach: coachLinks,
  admin: adminLinks,
};

const roleLabels = {
  client: "Espace Client",
  coach: "Espace Coach",
  admin: "Administration",
};

export const DashboardSidebar = ({ role }: SidebarProps) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const links = roleLinks[role];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm flex-shrink-0">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className="text-lg font-bold font-display gradient-text block">NexFit</span>
              <span className="text-xs text-muted-foreground">{roleLabels[role]}</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <link.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "animate-bounce-subtle")} />
              {!isCollapsed && (
                <span className="text-sm font-medium truncate">{link.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Paramètres</span>}
        </Link>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border shadow-md hover:bg-sidebar-accent"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform", isCollapsed && "rotate-180")} />
      </Button>
    </aside>
  );
};
