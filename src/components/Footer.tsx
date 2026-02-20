import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-card/50 border-t border-border/50 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/Logo1.png" alt="EventHub logo" className="w-10 h-10 object-contain" />
              <span className="font-display text-xl font-bold gradient-text">
                EVENTEASE
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Your one-stop destination for booking tickets to concerts, sports, movies, theater, and more.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Events */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Events</h4>
            <ul className="space-y-2">
              <li><Link to="/concerts" className="text-muted-foreground hover:text-primary transition-colors text-sm">Concerts</Link></li>
              <li><Link to="/sports" className="text-muted-foreground hover:text-primary transition-colors text-sm">Sports</Link></li>
              <li><Link to="/movies" className="text-muted-foreground hover:text-primary transition-colors text-sm">Movies</Link></li>
              <li><Link to="/theater" className="text-muted-foreground hover:text-primary transition-colors text-sm">Theater</Link></li>
              <li><Link to="/comedy" className="text-muted-foreground hover:text-primary transition-colors text-sm">Comedy</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Help</h4>
            <ul className="space-y-2">
              <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors text-sm">FAQs</Link></li>
              <li><Link to="/support" className="text-muted-foreground hover:text-primary transition-colors text-sm">Customer Support</Link></li>
              <li><Link to="/refunds" className="text-muted-foreground hover:text-primary transition-colors text-sm">Refund Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors text-sm">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: support@eventease.in</li>
              <li>Phone: 1800-XXX-XXXX</li>
              <li>Mumbai, Maharashtra</li>
              <li>India</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 EVENTEASE. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <img src="/Logo1.png" alt="EventHub logo" className="h-6 opacity-60" />
            <span className="text-muted-foreground text-sm">Secure Payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
