import { Calendar, Video, Target, CreditCard, MessageCircle, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Réservation facile",
    description: "Consultez les disponibilités et réservez vos séances en quelques clics.",
  },
  {
    icon: Video,
    title: "Coaching en visio",
    description: "Entraînez-vous depuis chez vous avec des séances en direct HD.",
  },
  {
    icon: Target,
    title: "Programmes personnalisés",
    description: "Plans d'entraînement adaptés à vos objectifs et votre niveau.",
  },
  {
    icon: MessageCircle,
    title: "Chat & Support",
    description: "Communiquez directement avec votre coach par chat ou appel.",
  },
  {
    icon: BarChart3,
    title: "Suivi des progrès",
    description: "Visualisez votre évolution avec des graphiques détaillés.",
  },
  {
    icon: CreditCard,
    title: "Paiement sécurisé",
    description: "PayPal et carte bancaire avec facturation automatique.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Une plateforme complète pour atteindre vos objectifs fitness
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow-sm"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold font-display mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
