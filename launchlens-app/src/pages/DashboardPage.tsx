import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Rocket, ChevronRight, PlusCircle, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserIdeas } from '../services/storage';
import type { IdeaEntry } from '../services/storage';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<IdeaEntry[]>([]);

  useEffect(() => {
    if (user) {
      setIdeas(getUserIdeas(user.email));
    }
  }, [user]);

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const getFormattedDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 7) return 'mint-bar';
    if (score >= 5) return 'peach-bar';
    return 'rose-bar';
  };

  return (
    <div className="dashboard-layout">
      <Navbar />

      {/* Header */}
      <header className="dashboard-header">
        <div className="container-wide dashboard-header-container">
          <div className="dashboard-header-left">
            <h1>Hey, {user ? getFirstName(user.name) : 'Founder'}!</h1>
            <p className="ideas-count-text">
              {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'} validated so far
            </p>
          </div>
          <div className="dashboard-header-right">
            <Link to="/submit" className="btn btn-primary">
              <PlusCircle size={16} />
              <span>New Idea</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="dashboard-main section">
        <div className="container-wide">
          {ideas.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-rocket-circle">
                <Rocket size={48} className="empty-rocket" />
              </div>
              <h2>No ideas validated yet</h2>
              <p>Your first idea analysis takes 2 minutes. What are you waiting for?</p>
              <Link to="/submit" className="btn btn-primary btn-large">
                Validate my first idea
              </Link>
            </div>
          ) : (
            <div className="ideas-grid">
              {ideas.map((entry) => (
                <div
                  key={entry.id}
                  className="idea-card card"
                  onClick={() => navigate(`/results/${entry.id}`)}
                >
                  <div className="idea-card-header">
                    <div className="idea-card-title-col">
                      <h3>{entry.name}</h3>
                      <span className="idea-card-date">
                        <Calendar size={12} />
                        {getFormattedDate(entry.createdAt)}
                      </span>
                    </div>
                    <div className="idea-card-score-badge">
                      <span className="idea-badge-num">{entry.report.overall.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* 5 mini progress bars */}
                  <div className="idea-card-bars">
                    {entry.report.scores.map((s) => (
                      <div key={s.dimension} className="mini-bar-row" title={`${s.dimension}: ${s.score}/10`}>
                        <div className="mini-bar-track">
                          <div
                            className={`mini-bar-fill ${getScoreColorClass(s.score)}`}
                            style={{ width: `${s.score * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="idea-card-footer">
                    <span className="view-report-link">
                      View full report <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
