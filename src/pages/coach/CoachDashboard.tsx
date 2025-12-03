import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  Euro, 
  Star,
  ArrowRight,
  Clock,
  TrendingUp,
  Video
} from "lucide-react";

const stats = [
  { label: "Clients actifs", value: "24", change: "+3", icon: Users, color: "text-primary" },
  { label: "Séances ce mois", value: "48", change: "+12", icon: Calendar, color: "text-info" },
  { label: "Revenus du mois", value: "2,450€", change: "+18%", icon: Euro, color: "text-success" },
  { label: "Note moyenne", value: "4.9", change: "+0.2", icon: Star, color: "text-warning" },
];

const todaySessions = [
  {
    client: "Marie Leroy",
    type: "Yoga débutant",
    time: "09:00 - 10:00",
    status: "completed",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
  },
  {
    client: "Pierre Martin",
    type: "Pilates",
    time: "14:00 - 15:00",
    status: "upcoming",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
  },
  {
    client: "Julie Dubois",
    type: "Yoga avancé",
    time: "16:30 - 17:30",
    status: "upcoming",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces",
  },
];

const CoachDashboard = () => {
  return (
    <DashboardLayout 
      role="coach" 
      title="Tableau de bord" 
      subtitle="Bienvenue, Sophie !"
      userName="Sophie Martin"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} variant="glass" className="group hover:border-primary/50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold font-display">{stat.value}</p>
                    <p className="text-xs text-success mt-1">{stat.change}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Sessions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Séances du jour</CardTitle>
                <Button variant="ghost" size="sm" className="group">
                  Voir le planning
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaySessions.map((session, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                      session.status === "completed" 
                        ? "bg-success/10 border border-success/20" 
                        : "bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={session.image} 
                        alt={session.client}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-semibold">{session.client}</p>
                        <p className="text-sm text-muted-foreground">{session.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{session.time}</span>
                    </div>
                    {session.status === "upcoming" ? (
                      <Button variant="hero" size="sm">
                        <Video className="w-4 h-4" />
                        Démarrer
                      </Button>
                    ) : (
                      <span className="text-sm text-success font-medium px-3 py-1 rounded-full bg-success/20">
                        Terminée
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Earnings Card */}
            <Card variant="gradient" className="overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-success/20 to-primary/20" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ce mois</p>
                    <p className="text-2xl font-bold font-display">2,450€</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-success">
                  <TrendingUp className="w-4 h-4" />
                  <span>+18% vs mois dernier</span>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Disponibilités</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">Lundi - Vendredi</span>
                  <span className="text-sm font-medium">9h - 18h</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">Samedi</span>
                  <span className="text-sm font-medium">10h - 14h</span>
                </div>
                <Button variant="outline" className="w-full">
                  Modifier mes créneaux
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cette semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Séances réalisées</span>
                    <span className="font-semibold">12/15</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: "80%" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Taux de complétion</span>
                    <span className="text-success font-medium">80%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoachDashboard;
