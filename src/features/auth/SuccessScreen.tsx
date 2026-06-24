import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';

const SuccessScreen = () => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const displayName = user?.user_metadata?.full_name || user?.email || 'there';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const email = user?.email;

  return (
    <div className="success-page">
      {/* Animated background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="success-card">
        {/* Checkmark animation */}
        <div className="check-wrapper">
          <div className="check-ring" />
          <div className="check-icon">
            <svg viewBox="0 0 52 52" fill="none">
              <polyline
                className="check-draw"
                points="14,26 22,34 38,18"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        <div className="success-text">
          <h1 className="success-title">You're in! 🎉</h1>
          <p className="success-subtitle">Successfully signed in with Google</p>
        </div>

        {/* User profile card */}
        <div className="profile-card">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="avatar-img"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="avatar-fallback">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="profile-info">
            <p className="profile-name">{displayName}</p>
            {email && <p className="profile-email">{email}</p>}
          </div>
        </div>

        <button className="signout-btn" onClick={handleSignOut}>
          <svg className="signout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
};

export default SuccessScreen;
