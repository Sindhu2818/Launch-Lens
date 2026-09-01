import { Link } from 'react-router-dom';
import { FileText, BarChart2, Zap, ChevronRight, X, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing">
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-blobs">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
        <div className="hero-content animate-fade-in">
          <span className="pill hero-badge">AI-Powered Idea Validation</span>
          <h1>Stop building things nobody wants.</h1>
          <p className="hero-subtitle">
            LaunchLens validates your startup idea in 2 minutes — and tells you exactly why it might fail.
          </p>
          <Link to="/submit" className="btn btn-primary btn-large">
            Validate My Idea — Free
          </Link>
          <p className="hero-note">Free account — sign up in 30 seconds</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-it-works">
        <div className="container-wide">
          <h2 className="text-center">How it works</h2>
          <div className="steps-row">
            <div className="step-card card animate-fade-in animate-fade-in-delay-1">
              <span className="step-pill" style={{ background: '#C9B8F5' }}>01</span>
              <div className="step-icon" style={{ color: '#7C5CBF' }}><FileText size={28} /></div>
              <h3>Submit your idea</h3>
              <p>Fill a 2-minute form with your idea, problem, audience, and monetization.</p>
            </div>

            <ChevronRight className="step-arrow hide-mobile" size={24} />

            <div className="step-card card animate-fade-in animate-fade-in-delay-2">
              <span className="step-pill" style={{ background: '#B2E8D8' }}>02</span>
              <div className="step-icon" style={{ color: '#2A9D7F' }}><BarChart2 size={28} /></div>
              <h3>Get scored instantly</h3>
              <p>AI scores 5 key dimensions and shows exactly where your idea is strong or weak.</p>
            </div>

            <ChevronRight className="step-arrow hide-mobile" size={24} />

            <div className="step-card card animate-fade-in animate-fade-in-delay-3">
              <span className="step-pill" style={{ background: '#FFCDB8' }}>03</span>
              <div className="step-icon" style={{ color: '#D96A3A' }}><Zap size={28} /></div>
              <h3>Know what to fix</h3>
              <p>Get a brutal critique and a 4-week action plan to validate the right way.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Not ChatGPT */}
      <section className="section comparison">
        <div className="container-wide">
          <h2 className="text-center">Why not just ask ChatGPT?</h2>
          <div className="comparison-grid">
            <div className="comparison-card chatgpt-card animate-fade-in animate-fade-in-delay-1">
              <h3>Generic AI</h3>
              <ul>
                <li><span className="icon-x"><X size={16} /></span>Changes answer based on how you phrase it</li>
                <li><span className="icon-x"><X size={16} /></span>No structured framework</li>
                <li><span className="icon-x"><X size={16} /></span>Always says your idea is great</li>
              </ul>
            </div>
            <div className="comparison-card launchlens-card animate-fade-in animate-fade-in-delay-2">
              <div className="comparison-card-header">
                <h3>LaunchLens</h3>
                <span className="recommended-badge">Recommended</span>
              </div>
              <ul>
                <li><span className="icon-check"><Check size={16} /></span>Runs your idea through an Optimist and a Skeptic before scoring it</li>
                <li><span className="icon-check"><Check size={16} /></span>Devil's Advocate actively attacks your idea</li>
                <li><span className="icon-check"><Check size={16} /></span>Gives you a concrete 4-week plan</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
