import { Clock } from 'lucide-react';

const ActivityTimeline = () => {
  return (
    <div className="flex flex-col h-full bg-background p-6">
      <header className="mb-6 mt-4">
        <h1 className="text-2xl font-bold text-foreground">Activity</h1>
        <p className="text-muted-foreground text-sm">Recent group expenses</p>
      </header>

      <div className="flex-1 space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {/* Placeholder Timeline Item */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <Clock size={16} />
            </div>
            
            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <div className="font-semibold text-foreground text-sm">Uber to Airport</div>
                <div className="font-medium text-primary text-sm">+$24.00</div>
              </div>
              <div className="text-xs text-muted-foreground">
                Alex paid $48.00 in Weekend Trip
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;
