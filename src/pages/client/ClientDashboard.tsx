import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  Target,
  ArrowRight,
  Play,
  Star
} from "lucide-react";

const stats = [
  { label: "Séances ce mois", value: "12", change: "+3", icon: Calendar, color: "text-primary" },
  { label: "Heures d'entraînement", value: "18h", change: "+5h", icon: Clock, color: "text-info" },
  { label: "Objectif atteint", value: "78%", change: "+12%", icon: Target, color: "text-success" },
  { label: "Progression", value: "+4.2kg", change: "masse", icon: TrendingUp, color: "text-warning" },
];

const upcomingSessions = [
  {
    coach: "Sophie Martin",
    type: "Yoga",
    date: "Aujourd'hui",
    time: "14:00",
    image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=100&h=100&fit=crop&crop=faces",
  },
  {
    coach: "Thomas Dubois",
    type: "Musculation",
    date: "Demain",
    time: "10:00",
    image: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=100&h=100&fit=crop&crop=faces",
  },
];

const ClientDashboard = () => {
  return (
    <DashboardLayout 
      role="client" 
      title="Tableau de bord" 
      subtitle="Bienvenue, Jean !"
      userName="Jean Dupont"
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
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Prochaines séances</CardTitle>
                <Button variant="ghost" size="sm" className="group">
                  Voir tout
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingSessions.map((session, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={session.image} 
                        alt={session.coach}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-semibold">{session.coach}</p>
                        <p className="text-sm text-muted-foreground">{session.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.date}</p>
                      <p className="text-sm text-primary">{session.time}</p>
                    </div>
                    <Button variant="hero" size="sm">
                      <Play className="w-4 h-4" />
                      Rejoindre
                    </Button>
                  </div>
                ))}

                {/* Empty State / Book New */}
                <div className="p-6 rounded-xl border-2 border-dashed border-border text-center">
                  <p className="text-muted-foreground mb-4">Réservez votre prochaine séance</p>
                  <Button variant="outline">
                    <Calendar className="w-4 h-4" />
                    Voir les disponibilités
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Progress */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card variant="gradient" className="overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Objectif du mois</p>
                    <p className="text-xl font-bold font-display">Perte de poids</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: "78%" }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coach Rating */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Votre coach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <img 
                    src="https://images.unsplash.com/photo-1594381898411-846e7d193883?w=100&h=100&fit=crop&crop=faces" 
                    alt="Coach"
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">Sophie Martin</p>
                    <p className="text-sm text-muted-foreground">Yoga & Pilates</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1,2,3,4,5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= 4 ? "text-warning fill-warning" : "text-muted"}`} 
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">4.9</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Envoyer un message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
