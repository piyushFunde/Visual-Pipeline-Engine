// pages/AuthPage.js
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Circle, LogIn, SquareAsterisk } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../services/authApi';
import './AuthPage.css';

/* ─── Pipeline-node logo (matches App.js VPEMark) ─── */
function VPEMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="auth-logo-mark" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4"  width="10" height="8" rx="1.5" />
      <rect x="1" y="20" width="10" height="8" rx="1.5" />
      <rect x="21" y="12" width="10" height="8" rx="1.5" />
      <path d="M11,8 C17,8 17,16 21,16" />
      <path d="M11,24 C17,24 17,16 21,16" />
      <circle cx="11" cy="8"  r="2" fill="currentColor" stroke="none" />
      <circle cx="11" cy="24" r="2" fill="currentColor" stroke="none" />
      <circle cx="21" cy="16" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ─── Toast ─── */
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="auth-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

/* ─── Left Panel ─── */
function LeftPanel() {
  const [tab, setTab] = useState('build');

  const buildSteps = ['Input node', 'Text node', 'Condition node', 'API node'];
  const runLog = [
    '✓ Input validated',
    '✓ Text formatted',
    '→ Condition branched',
    '✓ API request sent',
  ];

  return (
    <div className="auth-left" aria-hidden="true">
      {/* logo */}
      <Link to="/" className="auth-left-logo" tabIndex={-1}>
        <VPEMark />
        <span>VISUAL PIPELINE ENGINE</span>
      </Link>

      {/* halftone orb */}
      <div className="auth-orb" />

      {/* sliding dot band */}
      <div className="auth-dot-band" />

      {/* floating icon tiles */}
      <div className="auth-tile auth-tile--a">
        <LogIn size={18} strokeWidth={1.5} />
      </div>
      <div className="auth-tile auth-tile--b">
        <SquareAsterisk size={18} strokeWidth={1.5} />
      </div>

      {/* sample card */}
      <div className="auth-sample-card">
        <div className="auth-sample-tabs">
          <button
            className={`auth-sample-tab${tab === 'build' ? ' is-active' : ''}`}
            onClick={() => setTab('build')}
            type="button"
          >
            Build
          </button>
          <button
            className={`auth-sample-tab${tab === 'run' ? ' is-active' : ''}`}
            onClick={() => setTab('run')}
            type="button"
          >
            Run
          </button>
        </div>

        {tab === 'build' ? (
          <div className="auth-sample-nodes">
            {buildSteps.map((s) => (
              <span key={s} className="auth-node-chip">{s}</span>
            ))}
          </div>
        ) : (
          <div className="auth-sample-run">
            <div className="auth-run-bar">
              <div className="auth-run-fill" />
            </div>
            <ul className="auth-run-log">
              {runLog.map((line, i) => (
                <li key={i} style={{ animationDelay: `${i * 400}ms` }}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="auth-sample-label">sample content</p>
      </div>

      {/* headline */}
      <p className="auth-left-headline">
        Make it flow.<br />See the whole picture.
      </p>
    </div>
  );
}

/* ─── Spinner ─── */
function Spinner() {
  return <span className="auth-spinner" aria-hidden="true" />;
}

/* ─── Main page ─── */
export default function AuthPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { login: ctxLogin } = useAuth();

  const isSignup = location.pathname === '/signup';

  /* form state */
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [marketing, setMarketing] = useState(true);

  /* UI state */
  const [errors,   setErrors]   = useState({});   // { email, password, server }
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [toast,    setToast]    = useState(null);

  /* clear per-field error on change */
  const handleEmail = (e) => {
    setEmail(e.target.value);
    setErrors((prev) => ({ ...prev, email: null }));
  };
  const handleName = (e) => {
    setName(e.target.value);
    setErrors((prev) => ({ ...prev, name: null }));
  };
  const handlePassword = (e) => {
    setPassword(e.target.value);
    setErrors((prev) => ({ ...prev, password: null }));
  };

  /* ── validation ── */
  function validate() {
    const errs = {};
    if (isSignup && !name.trim()) {
      errs.name = 'Enter your name.';
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (isSignup && password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    } else if (!isSignup && !password) {
      errs.password = 'Password is required.';
    }
    return errs;
  }

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let userData;
      if (isSignup) {
        userData = await authApi.register({ name: name.trim(), email, password, marketingOptIn: marketing });
      } else {
        userData = await authApi.login({ email, password });
      }
      ctxLogin(userData);
      setSuccess(true);
      setTimeout(() => navigate('/editor'), 400);
    } catch (err) {
      setErrors({ server: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* ── OAuth placeholders ── */
  const handleOAuth = (provider) => {
    setToast(`${provider} sign-in is not available yet.`);
  };

  /* ── stagger items ── */
  const formRef = useRef(null);
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const items = el.querySelectorAll('.auth-stagger');
    items.forEach((item, i) => {
      item.style.transitionDelay = `${i * 60}ms`;
      item.classList.add('auth-stagger--visible');
    });
  }, [isSignup]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <LeftPanel />

        <div className="auth-right">
          <div className="auth-form-wrap" ref={formRef}>

            {/* heading */}
            <div className="auth-stagger">
              <h1 className="auth-heading">
                {isSignup ? 'Create an account' : 'Welcome back'}
              </h1>
              <p className="auth-subheading">
                {isSignup
                  ? 'Start building visual workflows for free.'
                  : 'Log in to pick up where you left off.'}
              </p>
            </div>

            {/* server error banner */}
            {errors.server && (
              <div className="auth-banner auth-banner--error auth-stagger" role="alert">
                {errors.server}
              </div>
            )}

            {/* success check */}
            {success && (
              <div className="auth-success-check" aria-label="Success">
                <Check size={28} strokeWidth={2.5} />
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="auth-form">
              {/* marketing opt-in (signup only) */}
              {isSignup && (
                <label className="auth-checkbox-label auth-stagger">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="auth-checkbox"
                  />
                  Send me tips, updates and offers
                </label>
              )}

              {isSignup && (
                <div className={`auth-field${errors.name ? ' auth-field--error' : ''}`}>
                  <label className="auth-label" htmlFor="auth-name">Full name</label>
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    maxLength={120}
                    className="auth-input"
                    placeholder="Your name"
                    value={name}
                    onChange={handleName}
                    aria-describedby={errors.name ? 'auth-name-err' : undefined}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <span id="auth-name-err" className="auth-field-error" role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>
              )}

              {/* email */}
              <div className={`auth-field${errors.email ? ' auth-field--error' : ''}`}>
                <label className="auth-label" htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleEmail}
                  aria-describedby={errors.email ? 'auth-email-err' : undefined}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <span id="auth-email-err" className="auth-field-error" role="alert">
                    {errors.email}
                  </span>
                )}
              </div>

              {/* password */}
              <div className={`auth-field${errors.password ? ' auth-field--error' : ''}`}>
                <label className="auth-label" htmlFor="auth-password">Password</label>
                <div className="auth-pw-wrap">
                  <input
                    id="auth-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    className="auth-input"
                    placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
                    value={password}
                    onChange={handlePassword}
                    aria-describedby={errors.password ? 'auth-pw-err' : undefined}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    <Circle size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
                {errors.password && (
                  <span id="auth-pw-err" className="auth-field-error" role="alert">
                    {errors.password}
                  </span>
                )}
                {!isSignup && (
                  <a href="#forgot" className="auth-forgot">Forgot password?</a>
                )}
              </div>

              {/* terms (signup only) */}
              {isSignup && (
                <p className="auth-terms auth-stagger">
                  By signing up, you accept the{' '}
                  <a href="#privacy">privacy policy</a> and{' '}
                  <a href="#terms">terms of service</a>.
                </p>
              )}

              {/* primary button */}
              <div className="auth-stagger">
                <button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={loading || success}
                >
                  {loading ? (
                    <><Spinner /> {isSignup ? 'Creating…' : 'Logging in…'}</>
                  ) : success ? (
                    <><Check size={18} aria-hidden="true" /> Done!</>
                  ) : (
                    isSignup ? 'Sign up' : 'Log in'
                  )}
                </button>
              </div>

              {/* divider */}
              <div className="auth-divider auth-stagger" aria-hidden="true">
                <span />or<span />
              </div>

              {/* OAuth */}
              <div className="auth-oauth auth-stagger">
                <button
                  type="button"
                  className="auth-btn-oauth"
                  onClick={() => handleOAuth('Google')}
                >
                  <Circle size={16} strokeWidth={1.5} aria-hidden="true" />
                  Continue with Google
                </button>
                <button
                  type="button"
                  className="auth-btn-oauth"
                  onClick={() => handleOAuth('Microsoft')}
                >
                  <SquareAsterisk size={16} strokeWidth={1.5} aria-hidden="true" />
                  Continue with Microsoft
                </button>
              </div>

              {/* footer toggle */}
              <p className="auth-footer-link auth-stagger">
                {isSignup ? (
                  <>Already have an account?{' '}
                    <Link to="/login">Log in</Link>
                  </>
                ) : (
                  <>New here?{' '}
                    <Link to="/signup">Create an account</Link>
                  </>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* toast */}
      {toast && (
        <Toast message={toast} onDone={() => setToast(null)} />
      )}
    </div>
  );
}

