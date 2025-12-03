import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Dumbbell } from "lucide-react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display gradient-text">NexFit</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Accueil
            </Link>
            <Link to="/coaches" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Coachs
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              À propos
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link to="/register">
              <Button variant="hero" size="sm">Commencer</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border animate-slide-in-up">
          <div className="px-4 py-6 space-y-4">
            <Link to="/" className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Accueil
            </Link>
            <Link to="/coaches" className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Coachs
            </Link>
            <Link to="/pricing" className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <Link to="/about" className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              À propos
            </Link>
            <div className="pt-4 flex flex-col gap-3">
              <Link to="/login">
                <Button variant="outline" className="w-full">Connexion</Button>
              </Link>
              <Link to="/register">
                <Button variant="hero" className="w-full">Commencer</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
