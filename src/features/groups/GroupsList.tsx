import { Users, Plus } from 'lucide-react';

const GroupsList = () => {
  return (
    <div className="flex flex-col h-full bg-background p-6">
      <header className="mb-6 mt-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Groups</h1>
          <p className="text-muted-foreground text-sm">Your expense groups</p>
        </div>
        <button className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
          <Plus size={20} />
        </button>
      </header>

      <div className="space-y-4">
        {/* Placeholder Groups */}
        {[1, 2].map((i) => (
          <div key={i} className="p-4 bg-card border border-border rounded-xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Users size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-base">Weekend Trip</h3>
              <p className="text-xs text-muted-foreground mt-0.5">4 members</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">+$45.00</p>
            </div>
          </div>
        ))}
        
        {/* Empty State Example */}
        <div className="mt-8 text-center p-8 border-2 border-dashed border-border rounded-xl">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No more groups</h3>
          <p className="text-sm text-muted-foreground">Create a group to start sharing expenses.</p>
        </div>
      </div>
    </div>
  );
};

export default GroupsList;
