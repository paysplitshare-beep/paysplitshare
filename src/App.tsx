import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import Login from './features/auth/Login';
import AppShell from './components/layout/AppShell';
import Dashboard from './features/dashboard/Dashboard';
import Groups from './features/groups/Groups';
import GroupDetails from './features/groups/GroupDetails';
import Friends from './features/friends/Friends';
import Settings from './features/settings/Settings';
import { Toaster } from './components/ui/Toast';
import ErrorBoundary from './components/ErrorBoundary';

// ── Auth Guard ───────────────────────────────────────────────
function ProtectedLayout() {
  const user          = useStore((s) => s.user);
  const isAuthLoading = useStore((s) => s.isAuthLoading);

  if (isAuthLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// ── Router ───────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    errorElement: <ErrorBoundary><div /></ErrorBoundary>,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true,              element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard',        element: <Dashboard /> },
          { path: 'groups',           element: <Groups /> },
          { path: 'groups/:id',       element: <GroupDetails /> },
          { path: 'friends',          element: <Friends /> },
          { path: 'settings',         element: <Settings /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

// ── App Root ─────────────────────────────────────────────────
export default function App() {
  const setUser       = useStore((s) => s.setUser);
  const setAuthLoading = useStore((s) => s.setAuthLoading);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setAuthLoading]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
