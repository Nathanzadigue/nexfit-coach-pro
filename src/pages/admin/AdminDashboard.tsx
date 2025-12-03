import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Euro, 
  UserCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Shield,
  Activity
} from "lucide-react";

const stats = [
  { label: "Utilisateurs total", value: "12,847", change: "+234", icon: Users, color: "text-primary" },
  { label: "Coachs actifs", value: "542", change: "+18", icon: UserCheck, color: "text-success" },
  { label: "Revenus du mois", value: "45,230€", change: "+22%", icon: Euro, color: "text-warning" },
  { label: "En attente", value: "8", change: "validations", icon: AlertTriangle, color: "text-destructive" },
];

const pendingCoaches = [
  {
    name: "Lucas Moreau",
    specialty: "CrossFit",
    date: "Il y a 2 jours",
    image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop&crop=faces",
  },
  {
    name: "Emma Petit",
    specialty: "Nutrition",
    date: "Il y a 3 jours",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces",
  },
  {
    name: "Hugo Bernard",
    specialty: "Boxe",
    date: "Il y a 5 jours",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces",
  },
];

const recentActivity = [
  { action: "Nouveau coach validé", user: "Sophie Martin", time: "Il y a 10 min", type: "success" },
  { action: "Paiement reçu", user: "Jean Dupont", time: "Il y a 25 min", type: "info" },
  { action: "Compte suspendu", user: "Marc Durand", time: "Il y a 1h", type: "warning" },
  { action: "Nouvelle inscription", user: "Marie Claire", time: "Il y a 2h", type: "info" },
];

const AdminDashboard = () => {
  return (
    <DashboardLayout 
      role="admin" 
      title="Administration" 
      subtitle="Vue d'ensemble"
      userName="Admin"
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
                    <p className={`text-xs mt-1 ${stat.label === "En attente" ? "text-destructive" : "text-success"}`}>
                      {stat.change}
                    </p>
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
          {/* Pending Validations */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-warning" />
                  <CardTitle>Coachs en attente de validation</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="group">
                  Voir tout
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingCoaches.map((coach, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={coach.image} 
                        alt={coach.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-semibold">{coach.name}</p>
                        <p className="text-sm text-muted-foreground">{coach.specialty}</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{coach.date}</span>
                    <div className="flex gap-2">
                      <Button variant="success" size="sm">
                        Valider
                      </Button>
                      <Button variant="outline" size="sm">
                        Voir le profil
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Activity & Stats */}
          <div className="space-y-6">
            {/* Revenue Card */}
            <Card variant="gradient" className="overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-warning/20 to-primary/20" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-warning/20 flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenus totaux</p>
                    <p className="text-2xl font-bold font-display">45,230€</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-success">
                  <TrendingUp className="w-4 h-4" />
                  <span>+22% vs mois dernier</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Activité récente</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.type === "success" ? "bg-success" :
                      item.type === "warning" ? "bg-warning" : "bg-info"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.user} • {item.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
