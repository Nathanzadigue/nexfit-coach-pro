import { Link } from "react-router-dom";
import { Dumbbell, Instagram, Twitter, Facebook, Youtube } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold font-display">NexFit</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              La plateforme de coaching sportif en ligne n°1 en France.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold font-display mb-4">Produit</h4>
            <ul className="space-y-2">
              <li><Link to="/coaches" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Coachs</Link></li>
              <li><Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tarifs</Link></li>
              <li><Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</Link></li>
              <li><Link to="/mobile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">App Mobile</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold font-display mb-4">Entreprise</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">À propos</Link></li>
              <li><Link to="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Carrières</Link></li>
              <li><Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link to="/press" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Presse</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold font-display mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Centre d'aide</Link></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Communauté</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold font-display mb-4">Légal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Confidentialité</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">CGU</Link></li>
              <li><Link to="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cookies</Link></li>
              <li><Link to="/legal" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mentions légales</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 NexFit. Tous droits réservés.
          </p>
          <p className="text-sm text-muted-foreground">
            Fait avec 💜 en France
          </p>
        </div>
      </div>
    </footer>
  );
};
