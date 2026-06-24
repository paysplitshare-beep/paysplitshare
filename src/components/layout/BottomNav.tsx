import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/groups',    icon: Users,           label: 'Groups' },
  { to: '/friends',   icon: UserCheck,       label: 'Friends' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `bottom-nav-item${isActive ? ' bottom-nav-item--active' : ''}`
          }
        >
          <div className="bottom-nav-icon-wrap">
            <Icon size={22} />
          </div>
          <span className="bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
