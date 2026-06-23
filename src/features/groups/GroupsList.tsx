import { Users, Plus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { Link, useNavigate } from 'react-router-dom';

const GroupsList = () => {
  const user = useStore(state => state.user);
  const navigate = useNavigate();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: () => api.getGroups(user!.id),
    enabled: !!user?.id,
  });

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <header className="mb-6 mt-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Groups</h1>
          <p className="text-muted-foreground text-sm">Your expense groups</p>
        </div>
        <button 
          onClick={() => navigate('/groups/create')}
          className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="space-y-4">
        {isLoading && (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        {groups?.map((group) => (
          <Link 
            key={group.id} 
            to={`/groups/${group.id}`}
            className="block p-4 bg-card border border-border rounded-xl flex items-center space-x-4 hover:border-primary/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              <Users size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-base truncate">{group.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Tap to view</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-muted-foreground">-</p>
            </div>
          </Link>
        ))}
        
        {(!groups || groups.length === 0) && !isLoading && (
          <div className="mt-8 text-center p-8 border-2 border-dashed border-border rounded-xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No groups yet</h3>
            <p className="text-sm text-muted-foreground">Create a group to start sharing expenses.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsList;
