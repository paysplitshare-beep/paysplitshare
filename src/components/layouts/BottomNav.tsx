import { NavLink } from 'react-router-dom';
import { Home, Users, Activity, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const BottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/groups', icon: Users, label: 'Groups' },
    { to: '/activity', icon: Activity, label: 'Activity' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="absolute bottom-0 w-full bg-card border-t border-border px-6 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <ul className="flex justify-between items-center">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center space-y-1 w-16 h-12 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon size={24} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNav;
