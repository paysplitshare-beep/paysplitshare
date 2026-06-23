import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <header className="mb-8 mt-4">
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground text-sm">Your balances across all groups</p>
      </header>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
          <p className="text-sm font-medium text-primary">You are owed</p>
          <p className="text-2xl font-bold text-foreground mt-1">$120.50</p>
        </div>
        <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
          <p className="text-sm font-medium text-red-500">You owe</p>
          <p className="text-2xl font-bold text-foreground mt-1">$45.00</p>
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        {/* Placeholder Activity */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  🍔
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Dinner at Joe's</p>
                  <p className="text-xs text-muted-foreground">Weekend Trip group</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">+$15.00</p>
                <p className="text-xs text-muted-foreground">You lent</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/add-expense')}
        className="absolute bottom-20 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};

export default Home;
