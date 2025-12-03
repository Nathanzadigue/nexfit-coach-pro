import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star, Users, Calendar } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/10 to-transparent rounded-full" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">+500 coachs certifiés</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-tight animate-slide-up">
            <span className="text-foreground">Transformez votre corps</span>
            <br />
            <span className="gradient-text">avec les meilleurs coachs</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground animate-slide-up delay-100">
            Coaching sportif personnalisé en ligne. Réservez vos séances, suivez vos progrès et atteignez vos objectifs avec NexFit.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
            <Link to="/register">
              <Button variant="hero" size="xl" className="group">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="glass" size="xl" className="group">
              <Play className="w-5 h-5" />
              Voir la démo
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 pt-12 animate-fade-in delay-300">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-3xl sm:text-4xl font-bold font-display gradient-text">
                <Users className="w-8 h-8 text-primary" />
                10K+
              </div>
              <p className="text-sm text-muted-foreground mt-1">Clients actifs</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-3xl sm:text-4xl font-bold font-display gradient-text">
                <Star className="w-8 h-8 text-primary" />
                4.9
              </div>
              <p className="text-sm text-muted-foreground mt-1">Note moyenne</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-3xl sm:text-4xl font-bold font-display gradient-text">
                <Calendar className="w-8 h-8 text-primary" />
                50K+
              </div>
              <p className="text-sm text-muted-foreground mt-1">Séances réalisées</p>
            </div>
          </div>
        </div>

        {/* Floating Cards Preview */}
        <div className="relative mt-20 hidden lg:block">
          <div className="absolute -left-10 top-10 glass-card p-4 w-64 animate-float delay-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xl">💪</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Séance terminée</p>
                <p className="text-xs text-muted-foreground">HIIT - 45min</p>
              </div>
            </div>
          </div>
          
          <div className="absolute -right-10 top-20 glass-card p-4 w-64 animate-float delay-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-success/80 flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Objectif atteint</p>
                <p className="text-xs text-muted-foreground">-5kg ce mois</p>
              </div>
            </div>
          </div>

          <div className="absolute left-1/4 bottom-0 glass-card p-4 w-72 animate-float delay-500">
            <div className="flex items-center gap-3">
              <img 
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop&crop=faces" 
                alt="Coach" 
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <p className="font-semibold text-sm">Coach Sophie</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span className="text-xs text-muted-foreground">4.9 • Yoga & Pilates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
