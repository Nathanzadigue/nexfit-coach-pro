import { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { cn } from "@/lib/utils";

type UserRole = "client" | "coach" | "admin";

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
  title: string;
  subtitle?: string;
  userName?: string;
}

export const DashboardLayout = ({ 
  children, 
  role, 
  title, 
  subtitle,
  userName 
}: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role={role} />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title={title} subtitle={subtitle} userName={userName} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
