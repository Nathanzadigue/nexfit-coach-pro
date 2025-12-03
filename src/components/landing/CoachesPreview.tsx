import { Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const coaches = [
  {
    name: "Sophie Martin",
    specialty: "Yoga & Pilates",
    rating: 4.9,
    sessions: 320,
    image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=300&h=300&fit=crop&crop=faces",
    price: "45€",
  },
  {
    name: "Thomas Dubois",
    specialty: "Musculation",
    rating: 4.8,
    sessions: 450,
    image: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&h=300&fit=crop&crop=faces",
    price: "50€",
  },
  {
    name: "Emma Laurent",
    specialty: "HIIT & Cardio",
    rating: 5.0,
    sessions: 280,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=300&fit=crop&crop=faces",
    price: "40€",
  },
  {
    name: "Lucas Bernard",
    specialty: "CrossFit",
    rating: 4.9,
    sessions: 390,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=300&fit=crop&crop=faces",
    price: "55€",
  },
];

export const CoachesPreview = () => {
  return (
    <section className="py-24 bg-secondary/30 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-2">
              Nos coachs certifiés
            </h2>
            <p className="text-muted-foreground">
              Des professionnels passionnés pour vous accompagner
            </p>
          </div>
          <Link to="/coaches">
            <Button variant="outline" className="group">
              Voir tous les coachs
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Coaches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coaches.map((coach, index) => (
            <div
              key={coach.name}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-glow-sm"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={coach.image}
                  alt={coach.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
                    {coach.specialty}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm text-foreground text-xs font-bold">
                    {coach.price}/séance
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold font-display text-lg mb-1">{coach.name}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="text-sm font-medium">{coach.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{coach.sessions} séances</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
