import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';

const MobileLayout = () => {
  const { user, setUser, isDarkMode } = useStore();

  useEffect(() => {
    // Initial theme setup
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Auth state listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, isDarkMode]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto relative bg-background overflow-hidden shadow-2xl sm:border-x sm:border-border">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 no-scrollbar relative">
        <Outlet />
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default MobileLayout;
