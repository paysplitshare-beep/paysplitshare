import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const Login = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="login-card">
        {/* Logo */}
        <div className="logo-wrapper">
          <div className="logo-inner">
            <svg viewBox="0 0 40 40" fill="none" className="logo-svg">
              <rect x="4" y="10" width="32" height="22" rx="4" fill="white" fillOpacity="0.25" />
              <path d="M4 18h32" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
              <circle cx="12" cy="26" r="3" fill="white" fillOpacity="0.9" />
              <circle cx="20" cy="26" r="3" fill="white" fillOpacity="0.6" />
              <path d="M28 23l4 3-4 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <div className="login-headline">
          <h1 className="login-title">PaySplit</h1>
          <p className="login-tagline">Split bills effortlessly with friends &amp; groups</p>
        </div>

        {/* Features list */}
        <ul className="feature-list">
          {[
            { icon: '⚡', text: 'Instant expense splitting' },
            { icon: '👥', text: 'Group expense tracking' },
            { icon: '💳', text: 'Multiple payment methods' },
          ].map((f) => (
            <li key={f.text} className="feature-item">
              <span className="feature-icon">{f.icon}</span>
              <span className="feature-text">{f.text}</span>
            </li>
          ))}
        </ul>

        {/* Google Sign-in button */}
        <button
          id="google-signin-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="google-btn"
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            <svg className="google-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          <span>{loading ? 'Redirecting…' : 'Continue with Google'}</span>
        </button>

        <p className="login-footer">
          By continuing, you agree to our{' '}
          <span className="footer-link">Terms of Service</span> and{' '}
          <span className="footer-link">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
