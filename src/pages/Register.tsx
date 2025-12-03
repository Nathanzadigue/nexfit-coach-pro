import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, Mail, Lock, Eye, EyeOff, ArrowRight, User, Check } from "lucide-react";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [userType, setUserType] = useState<"client" | "coach">("client");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register attempt", { ...formData, userType });
  };

  const passwordRequirements = [
    { label: "Au moins 8 caractères", met: formData.password.length >= 8 },
    { label: "Une majuscule", met: /[A-Z]/.test(formData.password) },
    { label: "Un chiffre", met: /[0-9]/.test(formData.password) },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-accent/30 rounded-full blur-3xl animate-float delay-300" />
        
        <div className="relative z-10 flex items-center justify-center w-full p-12">
          <div className="glass-card p-8 max-w-md text-center">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="text-2xl font-bold font-display mb-4">
              Commencez votre transformation
            </h2>
            <p className="text-muted-foreground">
              Première séance offerte. Sans engagement. Annulation gratuite à tout moment.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display gradient-text">NexFit</span>
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-display">Créer un compte</h1>
            <p className="text-muted-foreground">
              Rejoignez NexFit et commencez votre transformation
            </p>
          </div>

          {/* User Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUserType("client")}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                userType === "client"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-2">🏋️</div>
              <p className="font-semibold text-sm">Je suis client</p>
              <p className="text-xs text-muted-foreground">Je cherche un coach</p>
            </button>
            <button
              type="button"
              onClick={() => setUserType("coach")}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                userType === "coach"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-2">👨‍🏫</div>
              <p className="font-semibold text-sm">Je suis coach</p>
              <p className="text-xs text-muted-foreground">Je propose mes services</p>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password Requirements */}
              <div className="space-y-1 pt-2">
                {passwordRequirements.map((req) => (
                  <div key={req.label} className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      req.met ? "bg-success" : "bg-muted"
                    }`}>
                      {req.met && <Check className="w-3 h-3 text-success-foreground" />}
                    </div>
                    <span className={req.met ? "text-success" : "text-muted-foreground"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full" size="lg">
              Créer mon compte
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            En créant un compte, vous acceptez nos{" "}
            <Link to="/terms" className="text-primary hover:underline">CGU</Link>
            {" "}et notre{" "}
            <Link to="/privacy" className="text-primary hover:underline">Politique de confidentialité</Link>
          </p>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
