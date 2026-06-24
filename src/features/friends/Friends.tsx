import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import FilterChips from '../../components/ui/FilterChips';
import { SkeletonList } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import { useFriends, useSearchUsers, useAddFriend, useAddGuest } from '../../hooks/useFriends';
import { useToast } from '../../hooks/useToast';
import type { Friend, User } from '../../types';

const FILTER_CHIPS = [
  { id: 'all',      label: 'All' },
  { id: 'guests',   label: 'Guests' },
  { id: 'archived', label: 'Archived' },
];

export default function Friends() {
  const { toast }      = useToast();
  const { data: friends = [], isLoading } = useFriends();
  const addFriend      = useAddFriend();
  const addGuest       = useAddGuest();

  const [filter,       setFilter]       = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [guestName,    setGuestName]    = useState('');
  const [guestEmail,   setGuestEmail]   = useState('');
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showSearch,   setShowSearch]   = useState(false);

  const { data: searchResults = [] } = useSearchUsers(searchQuery);

  const friendIds = new Set(friends.map(f => f.friend_id).filter(Boolean));

  const filtered = friends.filter((f) => {
    if (filter === 'guests')   return !!f.guest_id && f.status === 'active';
    if (filter === 'archived') return f.status === 'archived';
    return f.status === 'active';
  });

  const handleAddFriend = async (targetUser: User) => {
    if (friendIds.has(targetUser.id)) {
      toast.warning('Already in your friends list');
      return;
    }
    try {
      await addFriend.mutateAsync(targetUser.id);
      toast.success(`${targetUser.name ?? targetUser.email} added!`);
      setShowSearch(false);
      setSearchQuery('');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to add friend');
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    try {
      await addGuest.mutateAsync({ name: guestName.trim(), email: guestEmail.trim() || undefined });
      toast.success(`Guest "${guestName}" added!`);
      setGuestName('');
      setGuestEmail('');
      setShowAddGuest(false);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to add guest');
    }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Friends</h1>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddGuest(true)}
            id="add-guest-btn"
          >
            <UserPlus size={16} />
            Add Guest
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowSearch(true)}
            id="add-friend-btn"
          >
            <UserPlus size={16} />
            Add Friend
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <FilterChips chips={FILTER_CHIPS} selected={filter} onChange={setFilter} />

      {/* Friends list */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UserPlus size={44} />}
          title={filter === 'all' ? 'No friends yet' : filter === 'guests' ? 'No guests' : 'No archived friends'}
          subtitle={filter === 'all' ? 'Search for users or add a guest to get started' : undefined}
          action={
            filter === 'all' ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" onClick={() => setShowSearch(true)}>
                  Find Friends
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAddGuest(true)}>
                  Add Guest
                </button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <div className="friends-list">
          {filtered.map((f) => (
            <FriendCard key={f.id} friend={f} />
          ))}
        </div>
      )}

      {/* Search / Add Friend Modal */}
      <Modal open={showSearch} onClose={() => { setShowSearch(false); setSearchQuery(''); }} title="Find Friends">
        <div className="modal-form">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="user-search-results">
            {searchQuery.length < 2 ? (
              <p className="search-hint">Type at least 2 characters to search</p>
            ) : searchResults.length === 0 ? (
              <p className="search-hint">No users found</p>
            ) : (
              searchResults.map((u) => (
                <div key={u.id} className="user-search-row">
                  <Avatar src={u.avatar_url} name={u.name ?? u.email} size={40} />
                  <div className="user-search-info">
                    <p className="user-search-name">{u.name ?? 'Unnamed'}</p>
                    <p className="user-search-email">{u.email}</p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAddFriend(u)}
                    disabled={friendIds.has(u.id) || addFriend.isPending}
                  >
                    {friendIds.has(u.id) ? 'Added' : 'Add'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Add Guest Modal */}
      <Modal open={showAddGuest} onClose={() => setShowAddGuest(false)} title="Add Guest">
        <form onSubmit={handleAddGuest} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="guest-name">Guest Name *</label>
            <input
              id="guest-name"
              type="text"
              className="form-input"
              placeholder="e.g. Alex Smith"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="guest-email">Email (optional)</label>
            <input
              id="guest-email"
              type="email"
              className="form-input"
              placeholder="e.g. alex@email.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
          </div>
          <p className="form-hint" style={{ marginBottom: '16px' }}>
            Guests don't need to log in. They can be added to group expenses later.
          </p>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={!guestName.trim() || addGuest.isPending}
          >
            {addGuest.isPending ? 'Adding…' : 'Add Guest'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  const isGuest = !!friend.guest_id;
  const name    = isGuest
    ? (friend.guest?.name ?? 'Guest')
    : (friend.friend?.name ?? friend.friend?.email ?? 'Unknown');
  const email   = isGuest ? friend.guest?.email : friend.friend?.email;
  const avatar  = isGuest ? null : friend.friend?.avatar_url;

  return (
    <div className="friend-card">
      <Avatar src={avatar} name={name} size={48} />
      <div className="friend-card-info">
        <p className="friend-card-name">{name}</p>
        {email && <p className="friend-card-email">{email}</p>}
        {isGuest && <span className="guest-badge">Guest</span>}
      </div>
    </div>
  );
}
