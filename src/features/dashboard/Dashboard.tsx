import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useGroups } from '../../hooks/useGroups';
import CreateGroupModal from '../groups/CreateGroupModal';
import JoinGroupModal from '../groups/JoinGroupModal';

export default function Dashboard() {
  const user     = useStore((s) => s.user);
  const navigate = useNavigate();
  const { data: groups = [] } = useGroups();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin,   setShowJoin]   = useState(false);

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';
  const activeGroups = groups.filter(g => !g.archived_at);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hey, {displayName} 👋</h1>
          <p className="page-subtitle">Here's your financial overview</p>
        </div>
      </div>

      {/* Balance Summary Card */}
      <div className="balance-summary-card">
        <div className="balance-summary-inner">
          <div className="balance-summary-main">
            <p className="balance-label">Total Balance</p>
            <p className="balance-amount balance-amount--neutral">₹0.00</p>
            <p className="balance-hint">Settle up to clear your balance</p>
          </div>
          <div className="balance-summary-stats">
            <div className="balance-stat">
              <div className="balance-stat-icon balance-stat-icon--green">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="balance-stat-label">You're owed</p>
                <p className="balance-stat-value balance-stat-value--green">₹0.00</p>
              </div>
            </div>
            <div className="balance-stat-divider" />
            <div className="balance-stat">
              <div className="balance-stat-icon balance-stat-icon--red">
                <TrendingDown size={16} />
              </div>
              <div>
                <p className="balance-stat-label">You owe</p>
                <p className="balance-stat-value balance-stat-value--red">₹0.00</p>
              </div>
            </div>
          </div>
        </div>
        <div className="balance-summary-glow" />
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat-card">
          <div className="quick-stat-icon">
            <Users size={20} />
          </div>
          <p className="quick-stat-value">{activeGroups.length}</p>
          <p className="quick-stat-label">Active Groups</p>
        </div>
        <div className="quick-stat-card">
          <div className="quick-stat-icon">
            <Minus size={20} />
          </div>
          <p className="quick-stat-value">0</p>
          <p className="quick-stat-label">Pending Bills</p>
        </div>
        <div className="quick-stat-card">
          <div className="quick-stat-icon">
            <TrendingUp size={20} />
          </div>
          <p className="quick-stat-value">₹0</p>
          <p className="quick-stat-label">This Month</p>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="dashboard-section-title">
        <span>Quick Actions</span>
      </div>
      <div className="action-cards">
        <button
          className="action-card action-card--create"
          onClick={() => setShowCreate(true)}
          id="create-group-btn"
        >
          <div className="action-card-icon">
            <Users size={32} />
          </div>
          <div className="action-card-content">
            <p className="action-card-title">Create Group</p>
            <p className="action-card-subtitle">Start splitting with your crew</p>
          </div>
          <div className="action-card-arrow">→</div>
        </button>

        <button
          className="action-card action-card--join"
          onClick={() => setShowJoin(true)}
          id="join-group-btn"
        >
          <div className="action-card-icon">
            <UserPlus size={32} />
          </div>
          <div className="action-card-content">
            <p className="action-card-title">Join Group</p>
            <p className="action-card-subtitle">Enter an invite code to join</p>
          </div>
          <div className="action-card-arrow">→</div>
        </button>
      </div>

      {/* Recent Groups */}
      {activeGroups.length > 0 && (
        <>
          <div className="dashboard-section-title">
            <span>Recent Groups</span>
            <button className="link-btn" onClick={() => navigate('/groups')}>View all</button>
          </div>
          <div className="recent-groups">
            {activeGroups.slice(0, 3).map((group) => (
              <button
                key={group.id}
                className="recent-group-card"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                <div
                  className="recent-group-avatar"
                  style={{ background: group.type === 'trip' ? 'linear-gradient(135deg, #10B981, #06B6D4)' :
                    group.type === 'home' ? 'linear-gradient(135deg, #06B6D4, #6366F1)' :
                    group.type === 'event' ? 'linear-gradient(135deg, #EC4899, #8B5CF6)' :
                    'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                  {group.type === 'trip' ? '✈️' : group.type === 'home' ? '🏠' : group.type === 'event' ? '🎉' : '🗂️'}
                </div>
                <div className="recent-group-info">
                  <p className="recent-group-name">{group.name}</p>
                  <p className="recent-group-type">{group.type}</p>
                </div>
                <div className="recent-group-balance">
                  <p className="balance-neutral">₹0</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} />
      <JoinGroupModal   open={showJoin}   onClose={() => setShowJoin(false)} />
    </div>
  );
}
