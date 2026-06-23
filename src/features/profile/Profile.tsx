import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { LogOut, Moon, Sun, User as UserIcon } from 'lucide-react';

const Profile = () => {
  const { user, isDarkMode, toggleDarkMode } = useStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <header className="mb-8 mt-4">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      </header>

      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 overflow-hidden border-4 border-background shadow-lg">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <UserIcon size={40} className="text-primary" />
          )}
        </div>
        <h2 className="text-xl font-bold text-foreground">{user?.user_metadata?.full_name || 'User'}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="space-y-4 flex-1">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <span className="font-medium text-foreground">Dark Mode</span>
            </div>
            <div className="w-12 h-6 bg-muted rounded-full relative">
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-all duration-300 ${isDarkMode ? 'left-7' : 'left-1'}`} />
            </div>
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mt-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-4 text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <LogOut size={16} />
            </div>
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
