import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MobileLayout from './components/layouts/MobileLayout';
import Login from './features/auth/Login';
import Home from './features/home/Home';
import GroupsList from './features/groups/GroupsList';
import CreateGroup from './features/groups/CreateGroup';
import GroupDetails from './features/groups/GroupDetails';
import MemberBalance from './features/groups/MemberBalance';
import ActivityTimeline from './features/activity/ActivityTimeline';
import Profile from './features/profile/Profile';
import AddExpense from './features/expenses/AddExpense';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Main app with bottom navigation */}
          <Route element={<MobileLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/groups" element={<GroupsList />} />
            <Route path="/groups/:id" element={<GroupDetails />} />
            <Route path="/groups/:id/members/:memberId" element={<MemberBalance />} />
            <Route path="/activity" element={<ActivityTimeline />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Full-screen flows (no bottom nav) */}
          <Route path="/groups/create" element={
            <div className="h-screen w-full max-w-md mx-auto sm:border-x sm:border-border">
              <CreateGroup />
            </div>
          } />
          <Route path="/add-expense" element={
            <div className="h-screen w-full max-w-md mx-auto sm:border-x sm:border-border">
              <AddExpense />
            </div>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
