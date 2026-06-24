import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserPlus, Users } from 'lucide-react';
import { useGroups } from '../../hooks/useGroups';
import FilterChips from '../../components/ui/FilterChips';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import CreateGroupModal from './CreateGroupModal';
import JoinGroupModal from './JoinGroupModal';
import type { Group, GroupType } from '../../types';
import { GROUP_TYPE_META } from '../../types';

const FILTER_CHIPS = [
  { id: 'active',   label: 'Active' },
  { id: 'archived', label: 'Archived' },
];

function GroupCard({ group, onClick }: { group: Group; onClick: () => void }) {
  const meta = GROUP_TYPE_META[group.type as GroupType] ?? GROUP_TYPE_META.general;

  return (
    <button className="group-card" onClick={onClick} id={`group-card-${group.id}`}>
      <div className="group-card-avatar" style={{ background: `${meta.color}22`, color: meta.color }}>
        <span>{meta.icon}</span>
      </div>
      <div className="group-card-info">
        <div className="group-card-header">
          <h3 className="group-card-name">{group.name}</h3>
          <span className="group-card-type">{meta.label}</span>
        </div>
        <p className="group-card-meta">
          {group.user_role === 'admin' ? '👑 Admin' : '👤 Member'}
        </p>
      </div>
      <div className="group-card-balance">
        <span className="balance-neutral">₹0</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    </button>
  );
}

export default function Groups() {
  const navigate = useNavigate();
  const { data: groups = [], isLoading } = useGroups();

  const [filter,      setFilter]      = useState('active');
  const [search,      setSearch]      = useState('');
  const [showCreate,  setShowCreate]  = useState(false);
  const [showJoin,    setShowJoin]    = useState(false);

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      const matchesFilter = filter === 'active' ? !g.archived_at : !!g.archived_at;
      const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [groups, filter, search]);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Groups</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowJoin(true)} id="join-group-btn">
            <UserPlus size={16} />
            Join
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)} id="create-group-btn">
            <Plus size={16} />
            Create
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="groups-search"
        />
      </div>

      {/* Filter chips */}
      <FilterChips chips={FILTER_CHIPS} selected={filter} onChange={setFilter} />

      {/* Group list */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title={search ? 'No groups found' : filter === 'active' ? 'No active groups' : 'No archived groups'}
          subtitle={
            search
              ? 'Try a different search term'
              : filter === 'active'
              ? 'Create or join a group to get started'
              : "You haven't archived any groups yet"
          }
          action={
            !search && filter === 'active' ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                  Create Group
                </button>
                <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>
                  Join Group
                </button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <div className="group-list">
          {filtered.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onClick={() => navigate(`/groups/${group.id}`)}
            />
          ))}
        </div>
      )}

      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} />
      <JoinGroupModal   open={showJoin}   onClose={() => setShowJoin(false)} />
    </div>
  );
}


