import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyseIdea } from '../services/ai';
import { saveIdea } from '../services/storage';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './SubmitPage.css';

type AnalysisStage = 'optimist' | 'skeptic' | 'synthesizer';

const STAGE_CONFIG: Record<AnalysisStage, { message: string; min: number; max: number }> = {
  optimist: { message: "Building the optimist's case...", min: 0, max: 33 },
  skeptic: { message: 'Thinking like a skeptic...', min: 33, max: 66 },
  synthesizer: { message: 'Reaching a verdict...', min: 66, max: 95 },
};

export default function SubmitPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [customer, setCustomer] = useState('');
  const [monetization, setMonetization] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(STAGE_CONFIG.optimist.message);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<AnalysisStage | null>(null);

  // Form validation
  const isFormValid = name.trim() !== '' && problem.trim() !== '' && customer.trim() !== '' && monetization.trim() !== '';

  const handleStageChange = useCallback((nextStage: AnalysisStage) => {
    const config = STAGE_CONFIG[nextStage];
    setStage(nextStage);
    setLoadingMessage(config.message);
    setProgress(config.min);
  }, []);

  // Creep progress within the active stage band while waiting for the API
  useEffect(() => {
    if (!loading || !stage) return;

    const { max } = STAGE_CONFIG[stage];
    const interval = setInterval(() => {
      setProgress(prev => (prev >= max ? prev : prev + 1));
    }, 150);

    return () => clearInterval(interval);
  }, [loading, stage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setLoading(true);
    setProgress(0);
    setStage(null);

    try {
      const report = await analyseIdea(
        { name, problem, customer, monetization },
        handleStageChange
      );

      // Save idea and report to localStorage
      const ideaId = saveIdea({
        name,
        problem,
        customer,
        monetization,
        userEmail: user?.email || 'anonymous',
        report
      });

      // Jump progress bar to 100%
      setProgress(100);
      setLoadingMessage('Analysis complete!');

      // Redirect after 400ms
      setTimeout(() => {
        navigate(`/results/${ideaId}`);
      }, 400);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error occurred during validation. Please try again.';
      alert(message);
      setLoading(false);
      setStage(null);
    }
  };

  return (
    <div className="submit-layout">
      <Navbar />

      {/* Page Header */}
      <header className="submit-header">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link> &gt; <span>Validate Idea</span>
          </div>
          <h1>Validate your startup idea</h1>
          <p className="submit-subtitle">
            Answer 4 quick questions. Get your scorecard in under 30 seconds.
          </p>
          <span className="pill submit-badge">4 questions | ~2 minutes</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="submit-main section">
        <div className="container submit-container">
          <div className="submit-content-row">
            {/* Form */}
            <div className="submit-form-section">
              <form onSubmit={handleSubmit} className="submit-form card">
                <div className="form-group">
                  <label className="form-label">Idea name</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. AI tutor for rural schools"
                      value={name}
                      disabled={loading}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <span className="form-helper">Keep it short and catchy.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Problem you solve</label>
                  <div className="input-wrapper">
                    <textarea
                      className="form-input"
                      placeholder="Describe the problem clearly..."
                      value={problem}
                      disabled={loading}
                      onChange={e => setProblem(e.target.value)}
                    />
                  </div>
                  <span className="form-helper">Be specific — not just a category, but a real pain point someone has.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Who is your customer?</label>
                  <div className="input-wrapper">
                    <textarea
                      className="form-input"
                      placeholder="Describe your target audience..."
                      value={customer}
                      disabled={loading}
                      onChange={e => setCustomer(e.target.value)}
                    />
                  </div>
                  <span className="form-helper">Describe who would use or pay for it.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">How will you make money?</label>
                  <div className="input-wrapper">
                    <textarea
                      className="form-input"
                      placeholder="Your monetization plan..."
                      value={monetization}
                      disabled={loading}
                      onChange={e => setMonetization(e.target.value)}
                    />
                  </div>
                  <span className="form-helper">Explain your business model briefly.</span>
                </div>

                {loading ? (
                  <div className="loading-card">
                    <div className="loading-spinner-row">
                      <div className="spinner" />
                      <span className="loading-msg">{loadingMessage}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="progress-percentage">{progress}%</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-primary btn-large btn-full submit-btn"
                    disabled={!isFormValid}
                  >
                    Analyse My Idea <ArrowRight size={18} />
                  </button>
                )}
              </form>
            </div>

            {/* Tips Sidebar */}
            <aside className="submit-sidebar">
              <div className="tips-card">
                <div className="tips-header">
                  <Lightbulb size={20} className="bulb-icon" />
                  <h3>Tips for a better score</h3>
                </div>
                <ul className="tips-list">
                  <li>
                    <strong>Be Specific:</strong> Name a real person or group who has this problem. Vague audiences score lower.
                  </li>
                  <li>
                    <strong>Focus:</strong> Keep your solution focused on one core feature instead of trying to do everything at once.
                  </li>
                  <li>
                    <strong>Moat:</strong> Research if there's any existing competitor and state how you plan to differentiate.
                  </li>
                  <li>
                    <strong>Realism:</strong> Define how you will make money on day one, even if it's small.
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
