import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  HelpCircle,
  Users,
  AlertTriangle,
  Cpu,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Copy,
  Plus,
  Share2
} from 'lucide-react';
import { getIdeaById } from '../services/storage';
import { normalizeReport } from '../services/report';
import type { IdeaEntry } from '../services/storage';
import { encodeBase64Utf8, decodeBase64Utf8 } from '../utils/encoding';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './ResultsPage.css';

/** Strip prototype-polluting keys from parsed JSON data. */
function sanitizeDecodedData(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeDecodedData);
  const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    clean[key] = sanitizeDecodedData(value);
  }
  return clean;
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [idea, setIdea] = useState<IdeaEntry | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready'>('loading');
  const [copied, setCopied] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({ 1: true });
  const [stagedProgress, setStagedProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    setLoadState('loading');

    let selectedIdea = id ? getIdeaById(id) : null;

    if (!selectedIdea) {
      const dataParam = searchParams.get('data');
      if (dataParam) {          try {
            let decoded;
            try {
              decoded = JSON.parse(decodeBase64Utf8(dataParam));
            } catch {
              decoded = JSON.parse(atob(dataParam));
            }
            decoded = sanitizeDecodedData(decoded) as Record<string, unknown>;
            selectedIdea = {
              ...decoded,
              report: normalizeReport(decoded.report),
            } as IdeaEntry;
          if (decoded?.name) {
            const savedIdeas = JSON.parse(localStorage.getItem('launchlens_ideas') || '[]');
            if (!savedIdeas.find((i: IdeaEntry) => i.id === decoded.id)) {
              savedIdeas.unshift(selectedIdea);
              localStorage.setItem('launchlens_ideas', JSON.stringify(savedIdeas));
            }
          }
        } catch {
          // Silently reject malformed share URLs
        }
      }
    } else {
      selectedIdea = {
        ...selectedIdea,
        report: normalizeReport(selectedIdea.report),
      };
    }

    if (selectedIdea) {
      setIdea(selectedIdea);
      setLoadState('ready');
    } else {
      navigate('/', { replace: true });
    }
  }, [id, searchParams, navigate]);

  // Handle score bar animations on load
  useEffect(() => {
    if (!idea) return;

    // Stagger progress bar updates
    const timers: ReturnType<typeof setTimeout>[] = [];
    idea.report.scores.forEach((s, idx) => {
      const t = setTimeout(() => {
        setStagedProgress(prev => ({
          ...prev,
          [s.dimension]: s.score
        }));
      }, 100 + idx * 150);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [idea]);

  if (loadState === 'loading' || !idea) {
    return (
      <div className="results-layout">
        <Navbar />
        <main className="section results-loading">
          <div className="container-wide results-loading-inner">
            <div className="spinner" />
            <p>Loading your validation report...</p>
          </div>
        </main>
      </div>
    );
  }

  const { report } = idea;
  const overallScore = Number.isFinite(report.overall) ? report.overall : 0;

  const getScoreColorClass = (score: number) => {
    if (score >= 7) return 'mint-score';
    if (score >= 5) return 'peach-score';
    return 'rose-score';
  };

  const getDimensionIcon = (dimension: string) => {
    switch (dimension) {
      case 'Problem Clarity':
        return <HelpCircle size={20} />;
      case 'Market Need':
        return <Users size={20} />;
      case 'Competition':
        return <AlertTriangle size={20} />;
      case 'Technical Feasibility':
        return <Cpu size={20} />;
      case 'Monetization Potential':
        return <DollarSign size={20} />;
      default:
        return <HelpCircle size={20} />;
    }
  };

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekNum]: !prev[weekNum]
    }));
  };

  // Generate the shareable URL with base64 encoded idea report
  const getShareableUrl = () => {
    try {
      const base64Data = encodeBase64Utf8(JSON.stringify(idea));
      return `${window.location.origin}/results/${idea.id}?data=${encodeURIComponent(base64Data)}`;
    } catch {
      // Silently fall back to ID-only URL
      return `${window.location.origin}/results/${idea.id}`;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareableUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable
    }
  };

  const getFormattedDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Analysed just now';
    }
  };

  return (
    <div className="results-layout">
      <Navbar />

      {/* Idea Header */}
      <header className="results-header">
        <div className="container-wide header-container">
          <div className="header-left">
            <span className="pill submit-badge">Validation Result</span>
            <h1>{idea.name}</h1>
            <p className="analysis-time">Analyzed on {getFormattedDate(idea.createdAt)}</p>
          </div>
          <div className="header-right">
            <div className="overall-badge-circle">
              <span className="overall-score-num">{overallScore.toFixed(1)}</span>
              <span className="overall-score-total">/10</span>
            </div>
            <span className="overall-score-label">Overall Score</span>
          </div>
        </div>
      </header>

      {/* Section A: Scorecard */}
      <section className="section results-scorecard">
        <div className="container-wide">
          <div className="section-label-row">
            <span className="pill scorecard-badge">Scorecard</span>
            <h2>How your idea scores</h2>
          </div>
          <div className="scorecard-card card">
            <div className="score-bars-list">
              {report.scores.map((s) => {
                const currentScore = stagedProgress[s.dimension] || 0;
                const scoreColor = getScoreColorClass(s.score);
                return (
                  <div key={s.dimension} className="score-row">
                    <div className="score-label-col">
                      <span className={`score-icon ${scoreColor}`}>
                        {getDimensionIcon(s.dimension)}
                      </span>
                      <div className="score-meta">
                        <span className="score-name">{s.dimension}</span>
                        <span className="score-reason">{s.reason}</span>
                      </div>
                    </div>
                    <div className="score-bar-col">
                      <div className="bar-track">
                        <div
                          className={`bar-fill ${scoreColor}`}
                          style={{ width: `${currentScore * 10}%` }}
                        />
                      </div>
                    </div>
                    <div className="score-value-col">
                      <span className={`score-num-val ${scoreColor}`}>
                        {s.score}
                      </span>
                      <span className="score-out-of">/10</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="scorecard-insight">
              <strong>Synthesizer Insight:</strong> {report.insight}
            </div>
          </div>
        </div>
      </section>

      {/* Section B: Devil's Advocate */}
      <section className="section results-skeptic">
        <div className="container-wide">
          <div className="section-label-row">
            <span className="pill skeptic-badge">Devil's Advocate</span>
            <h2>Why your idea might fail</h2>
            <p className="skeptic-subtitle">
              These aren't meant to discourage you — they're the objections your customers WILL raise.
            </p>
          </div>
          <div className="critique-cards-list">
            {report.critiques.map((c, idx) => (
              <div key={idx} className="critique-card card animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <AlertTriangle className="critique-icon" size={18} />
                <div className="critique-content">
                  <h4>{c.title}</h4>
                  <p>{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section C: Validation Roadmap */}
      <section className="section results-roadmap">
        <div className="container-wide">
          <div className="section-label-row">
            <span className="pill roadmap-badge">4-Week Plan</span>
            <h2>How to validate in 4 weeks</h2>
          </div>
          <div className="timeline-wrapper">
            <div className="timeline-line" />
            <div className="roadmap-weeks-list">
              {report.roadmap.map((weekItem) => {
                const isExpanded = !!expandedWeeks[weekItem.week];
                return (
                  <div key={weekItem.week} className={`week-node ${isExpanded ? 'expanded' : ''}`}>
                    <button className="week-header-btn card" onClick={() => toggleWeek(weekItem.week)}>
                      <div className="week-header-left">
                        <span className="pill week-badge">Week {weekItem.week}</span>
                        <h3>{weekItem.title}</h3>
                      </div>
                      <span className="week-toggle-icon">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="week-content card">
                        <ul className="week-tasks-list">
                          {weekItem.tasks.map((task, tid) => (
                            <li key={tid}>{task}</li>
                          ))}
                        </ul>
                        {weekItem.tip && (
                          <div className="week-tip">
                            <strong>Why this week?</strong> {weekItem.tip}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Share Banner */}
      <section className="results-share-banner">
        <div className="container-wide share-container">
          <div className="share-text-col">
            <Share2 size={24} className="share-banner-icon" />
            <div>
              <h3>Share your LaunchLens report</h3>
              <p>Send this link to mentors, classmates, or investors to show your validation progress.</p>
            </div>
          </div>
          <div className="share-actions-col">
            <div className="share-url-box">
              <input type="text" readOnly value={getShareableUrl()} className="share-input" />
              <button onClick={handleCopyLink} className="btn btn-secondary copy-btn">
                <Copy size={16} />
                <span>{copied ? 'Copied!' : 'Copy link'}</span>
              </button>
            </div>
            <Link to="/submit" className="btn btn-primary new-idea-btn">
              <Plus size={16} />
              <span>Start a new idea</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
