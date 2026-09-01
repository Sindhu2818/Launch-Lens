import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Rocket, Shield, Map, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-blobs">
            <div className="auth-blob auth-blob-1" />
            <div className="auth-blob auth-blob-2" />
          </div>
          <Link to="/" className="auth-logo">
            <Rocket size={24} />
            <span>LaunchLens</span>
          </Link>
          <p className="auth-tagline">Validate before you build.</p>
          <div className="auth-pills">
            <span className="auth-pill"><Rocket size={14} /> Idea scored in 2 minutes</span>
            <span className="auth-pill"><Shield size={14} /> Devil's Advocate critique</span>
            <span className="auth-pill"><Map size={14} /> 4-week validation roadmap</span>
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Log in
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </div>

          {mode === 'login' ? (
            <LoginForm onLogin={login} navigate={navigate} switchTab={() => setMode('signup')} />
          ) : (
            <SignupForm onSignup={signup} navigate={navigate} switchTab={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginForm({
  onLogin,
  navigate,
  switchTab
}: {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  navigate: (path: string) => void;
  switchTab: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password || password.length < 8) errs.password = 'Min 8 characters';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setApiError('');
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const result = await onLogin(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setApiError(result.error || 'Authentication failed');
      }
    } catch {
      setApiError('Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {apiError && <div className="auth-api-error">{apiError}</div>}

      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        {errors.email && <span className="form-error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Password</label>
        <div className="input-wrapper">
          <input
            type={showPwd ? 'text' : 'password'}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)}>
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <span className="form-error">{errors.password}</span>}
      </div>

      <div className="forgot-link">
        <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Reset password link sent to demo email!'); }}>Forgot password?</a>
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>Log in</button>

      <p className="auth-switch">
        Don't have an account? <button type="button" onClick={switchTab}>Sign up</button>
      </p>

      <div className="auth-divider">
        <span>Google SSO coming soon</span>
      </div>
    </form>
  );
}

function SignupForm({
  onSignup,
  navigate,
  switchTab
}: {
  onSignup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  navigate: (path: string) => void;
  switchTab: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name || name.length < 2) errs.name = 'Min 2 characters';
    if (!email || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password || password.length < 8) errs.password = 'Min 8 characters';
    else if (!/\d/.test(password)) errs.password = 'Must contain at least 1 number';
    if (password !== confirmPwd) errs.confirmPwd = "Passwords don't match";
    if (!agreed) errs.agreed = 'You must agree to the Terms';
    return errs;
  };

  const isValid = name.length >= 2 && /\S+@\S+\.\S+/.test(email) && password.length >= 8 && /\d/.test(password) && password === confirmPwd && agreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setApiError('');
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const result = await onSignup(name, email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setApiError(result.error || 'Registration failed');
      }
    } catch {
      setApiError('Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {apiError && <div className="auth-api-error">{apiError}</div>}

      <div className="form-group">
        <label className="form-label">Full name</label>
        <input
          type="text"
          className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder="Your full name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        {errors.email && <span className="form-error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Password</label>
        <div className="input-wrapper">
          <input
            type={showPwd ? 'text' : 'password'}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Create a password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)}>
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <span className="form-error">{errors.password}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Confirm password</label>
        <div className="input-wrapper">
          <input
            type={showConfirm ? 'text' : 'password'}
            className={`form-input ${errors.confirmPwd ? 'error' : ''}`}
            placeholder="Repeat your password"
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
          />
          <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPwd && <span className="form-error">{errors.confirmPwd}</span>}
      </div>

      <label className="checkbox-label">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
        <span>I agree to the Terms of Service</span>
      </label>
      {errors.agreed && <span className="form-error">{errors.agreed}</span>}

      <button type="submit" className="btn btn-primary btn-full" disabled={!isValid || submitting}>
        Create account
      </button>

      <p className="auth-switch">
        Already have an account? <button type="button" onClick={switchTab}>Log in</button>
      </p>
    </form>
  );
}
