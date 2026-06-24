import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { useToast } from '../../hooks/useToast';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import { Moon, Sun, LogOut, Trash2 } from 'lucide-react';

export default function Settings() {
  const user         = useStore((s) => s.user);
  const isDarkMode   = useStore((s) => s.isDarkMode);
  const toggleDark   = useStore((s) => s.toggleDarkMode);
  const setUser      = useStore((s) => s.setUser);
  const { toast }    = useToast();
  const navigate     = useNavigate();

  const [showDelete,    setShowDelete]    = useState(false);
  const [editName,      setEditName]      = useState(false);
  const [nameValue,     setNameValue]     = useState(
    user?.user_metadata?.full_name ?? user?.email ?? ''
  );
  const [savingName,    setSavingName]    = useState(false);

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'User';
  const avatarUrl   = user?.user_metadata?.avatar_url ?? null;
  const email       = user?.email ?? '';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login');
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: nameValue.trim() },
      });
      if (error) throw error;

      // Also update in users table
      await supabase
        .from('users')
        .update({ name: nameValue.trim() })
        .eq('id', user!.id);

      toast.success('Name updated!');
      setEditName(false);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    toast.error('Please contact support to delete your account.', 6000);
    setShowDelete(false);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="settings-profile-card">
        <Avatar src={avatarUrl} name={displayName} size={72} />
        <div className="settings-profile-info">
          {editName ? (
            <div className="settings-name-edit">
              <input
                type="text"
                className="form-input"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveName}
                  disabled={savingName || !nameValue.trim()}
                >
                  {savingName ? 'Saving…' : 'Save'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditName(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="settings-profile-name">{displayName}</p>
              <p className="settings-profile-email">{email}</p>
              <button
                className="link-btn"
                onClick={() => setEditName(true)}
                style={{ marginTop: '8px' }}
              >
                Edit Name
              </button>
            </>
          )}
        </div>
      </div>

      {/* Settings Options */}
      <div className="settings-section">
        <p className="settings-section-label">Preferences</p>

        {/* Dark Mode */}
        <div className="settings-row">
          <div className="settings-row-left">
            <div className="settings-row-icon">
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div>
              <p className="settings-row-title">Dark Mode</p>
              <p className="settings-row-sub">{isDarkMode ? 'Currently dark' : 'Currently light'}</p>
            </div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={isDarkMode} onChange={toggleDark} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <div className="settings-section">
        <p className="settings-section-label">Account</p>

        {/* Sign Out */}
        <button className="settings-row settings-row--btn" onClick={handleSignOut}>
          <div className="settings-row-left">
            <div className="settings-row-icon settings-row-icon--muted">
              <LogOut size={18} />
            </div>
            <div>
              <p className="settings-row-title">Sign Out</p>
              <p className="settings-row-sub">Clear session and return to login</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" opacity={0.4}>
            <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Delete Account */}
        <button
          className="settings-row settings-row--btn settings-row--danger"
          onClick={() => setShowDelete(true)}
        >
          <div className="settings-row-left">
            <div className="settings-row-icon settings-row-icon--danger">
              <Trash2 size={18} />
            </div>
            <div>
              <p className="settings-row-title settings-row-title--danger">Delete Account</p>
              <p className="settings-row-sub">Permanently remove your data</p>
            </div>
          </div>
        </button>
      </div>

      {/* Delete Confirmation */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Account"
        maxWidth="400px"
      >
        <div className="modal-form">
          <div className="danger-confirmation">
            <div className="danger-icon">⚠️</div>
            <p className="danger-text">
              This will permanently delete your account and all associated data.
              This action <strong>cannot be undone</strong>.
            </p>
          </div>
          <button
            className="btn btn-danger btn-full"
            onClick={handleDeleteAccount}
          >
            Delete My Account
          </button>
          <button
            className="btn btn-secondary btn-full"
            onClick={() => setShowDelete(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
