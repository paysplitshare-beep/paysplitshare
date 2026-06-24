import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  LogOut,
  SplitSquareHorizontal,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import Avatar from '../ui/Avatar';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/groups',    icon: Users,           label: 'Groups' },
  { to: '/friends',   icon: UserCheck,       label: 'Friends' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
];

export default function Sidebar() {
  const user     = useStore((s) => s.user);
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? '';
  const avatarUrl   = user?.user_metadata?.avatar_url ?? null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <SplitSquareHorizontal size={22} />
        </div>
        <span className="sidebar-logo-text">PaySplit</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
            }
          >
            <Icon size={20} className="sidebar-link-icon" />
            <span className="sidebar-link-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <Avatar
            src={avatarUrl}
            name={displayName}
            size={34}
          />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{displayName}</span>
          </div>
        </div>
        <button
          className="sidebar-signout"
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
