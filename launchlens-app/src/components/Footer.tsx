import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-logo">
            <Rocket size={18} />
            <span>LaunchLens</span>
          </div>
          <p className="footer-tagline">The AI that argues against your startup idea.</p>
        </div>
        <div className="footer-links">
          <Link to="/submit">Validate an idea</Link>
          <Link to="/auth">Sign in</Link>
          <a href="#about">About</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 LaunchLens. Built for student founders.</p>
      </div>
    </footer>
  );
}
