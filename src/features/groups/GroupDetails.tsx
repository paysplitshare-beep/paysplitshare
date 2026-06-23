import { useState } from 'react';
import { ArrowLeft, Loader2, Plus, Trash2, UserPlus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { getCategoryById } from '../../lib/categories';

// ── Types ────────────────────────────────────────────────────────────────────
type Tab = 'all' | 'balances' | 'members' | 'logs';

// ── Balance computation ───────────────────────────────────────────────────────
// net[memberId] > 0  → they owe me
// net[memberId] < 0  → I owe them
function computeBalances(
  expenses: any[],
  settlements: any[],
  currentUserId: string,
): Record<string, number> {
  const net: Record<string, number> = {};

  for (const expense of expenses) {
    for (const p of expense.expense_participants ?? []) {
      if (expense.paid_by === currentUserId && p.user_id !== currentUserId) {
        net[p.user_id] = (net[p.user_id] ?? 0) + Number(p.amount_owed);
      } else if (expense.paid_by !== currentUserId && p.user_id === currentUserId) {
        net[expense.paid_by] = (net[expense.paid_by] ?? 0) - Number(p.amount_owed);
      }
    }
  }

  for (const s of settlements) {
    if (s.payer_id === currentUserId) {
      // I paid them → I reduced my debt
      net[s.receiver_id] = (net[s.receiver_id] ?? 0) + Number(s.amount);
    } else if (s.receiver_id === currentUserId) {
      // They paid me → they reduced their debt
      net[s.payer_id] = (net[s.payer_id] ?? 0) - Number(s.amount);
    }
  }

  return net;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${Math.abs(n).toFixed(2)}`;
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const Avatar = ({ user }: { user: any }) => (
  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
    {user?.avatar_url
      ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
      : <span className="text-primary font-bold text-sm">
          {(user?.name || user?.email || '?')[0].toUpperCase()}
        </span>
    }
  </div>
);

const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <div className="text-center py-12">
    <span className="text-5xl block mb-3">{icon}</span>
    <p className="text-muted-foreground text-sm">{text}</p>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
const GroupDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useStore(state => state.user);

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [emailSearch, setEmailSearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => api.getGroupDetails(id!),
    enabled: !!id,
  });

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ['group-expenses', id],
    queryFn: () => api.getGroupExpenses(id!),
    enabled: !!id,
  });

  const { data: settlements = [], isLoading: setLoading } = useQuery({
    queryKey: ['group-settlements', id],
    queryFn: () => api.getGroupSettlements(id!),
    enabled: !!id,
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['users-search', emailSearch],
    queryFn: () => api.searchUsersByEmail(emailSearch),
    enabled: emailSearch.length > 2,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const addMemberMut = useMutation({
    mutationFn: (userId: string) => api.addMemberToGroup(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      setEmailSearch('');
      setShowAddMember(false);
    },
  });

  const removeMemberMut = useMutation({
    mutationFn: (userId: string) => api.removeMember(id!, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group', id] }),
  });

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (groupLoading || expLoading || setLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!group) return null;

  const members: any[] = group.group_members ?? [];
  const isCreator = group.created_by === currentUser?.id;

  // ── Balance calculations ──────────────────────────────────────────────────────
  const balanceMap = computeBalances(expenses, settlements, currentUser?.id ?? '');

  const youAreOwed = Object.values(balanceMap).filter(v => v > 0).reduce((a, b) => a + b, 0);
  const youOwe = Math.abs(Object.values(balanceMap).filter(v => v < 0).reduce((a, b) => a + b, 0));
  const groupTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const youSpent = expenses
    .filter(e => e.paid_by === currentUser?.id)
    .reduce((s, e) => s + Number(e.amount), 0);

  // ── Merged logs ───────────────────────────────────────────────────────────────
  const logs = [
    ...expenses.map(e => ({ ...e, _type: 'expense' as const })),
    ...settlements.map(s => ({ ...s, _type: 'settlement' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const TABS: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'balances', label: 'Balances' },
    { id: 'members', label: 'Members' },
    { id: 'logs', label: 'Logs' },
  ];

  // ── Log item renderer ─────────────────────────────────────────────────────────
  const renderLogItem = (item: any) => {
    if (item._type === 'expense') {
      const cat = getCategoryById(item.category ?? 'other');
      const payer = item.payer;
      const iMePaid = item.paid_by === currentUser?.id;
      return (
        <div key={item.id} className="flex items-center space-x-3 p-3 bg-card border border-border rounded-xl">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl shrink-0">
            {cat.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {iMePaid ? 'You' : (payer?.name ?? 'Someone')} paid · {fmtDate(item.created_at)}
            </p>
          </div>
          <p className="font-bold text-foreground text-sm shrink-0">{fmt(Number(item.amount))}</p>
        </div>
      );
    }

    // settlement
    const iPaid = item.payer_id === currentUser?.id;
    const otherName = iPaid ? item.receiver?.name : item.payer?.name;
    return (
      <div key={item.id} className="flex items-center space-x-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-xl shrink-0">✅</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">Settlement</p>
          <p className="text-xs text-muted-foreground">
            {iPaid ? 'You paid' : `${otherName ?? 'Someone'} paid you`} · {fmtDate(item.created_at)}
          </p>
        </div>
        <p className="font-bold text-green-500 text-sm shrink-0">{fmt(Number(item.amount))}</p>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border flex items-center bg-card gap-2">
        <button onClick={() => navigate('/groups')} className="p-2 -ml-2 text-foreground shrink-0">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-foreground flex-1 truncate">{group.name}</h1>
        <button
          onClick={() => navigate('/add-expense')}
          className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 shadow-sm"
        >
          <Plus size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* ── Summary Cards ────────────────────────────────────────────── */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
            <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold mb-1 uppercase tracking-wide">You're Owed</p>
            <p className="text-2xl font-extrabold text-green-500">{fmt(youAreOwed)}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mb-1 uppercase tracking-wide">You Owe</p>
            <p className="text-2xl font-extrabold text-red-500">{fmt(youOwe)}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[11px] text-muted-foreground font-semibold mb-1 uppercase tracking-wide">Group Total</p>
            <p className="text-2xl font-extrabold text-foreground">{fmt(groupTotal)}</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
            <p className="text-[11px] text-primary/70 font-semibold mb-1 uppercase tracking-wide">You Spent</p>
            <p className="text-2xl font-extrabold text-primary">{fmt(youSpent)}</p>
          </div>
        </div>

        {/* ── Tab Chip Bar ─────────────────────────────────────────────── */}
        <div className="flex space-x-2 px-4 pb-3 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ──────────────────────────────────────────────── */}
        <div className="px-4 pb-24 space-y-3">

          {/* ALL */}
          {activeTab === 'all' && (
            logs.length === 0
              ? <EmptyState icon="📋" text="No activity yet. Tap + to add an expense!" />
              : logs.map(renderLogItem)
          )}

          {/* BALANCES */}
          {activeTab === 'balances' && (() => {
            const others = members.filter((m: any) => m.user_id !== currentUser?.id);
            if (others.length === 0) return <EmptyState icon="👥" text="No other members in this group." />;
            return others.map((member: any) => {
              const balance = balanceMap[member.user_id] ?? 0;
              const isOwed = balance > 0.005;
              const isEven = Math.abs(balance) < 0.005;
              return (
                <button
                  key={member.user_id}
                  onClick={() => navigate(`/groups/${id}/members/${member.user_id}`)}
                  className="w-full flex items-center space-x-3 p-3 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors text-left"
                >
                  <Avatar user={member.users} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {member.users.name ?? member.users.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{member.users.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {isEven ? (
                      <p className="text-sm font-semibold text-muted-foreground">Settled ✓</p>
                    ) : isOwed ? (
                      <>
                        <p className="text-sm font-bold text-green-500">+{fmt(balance)}</p>
                        <p className="text-[10px] text-green-600/70">owes you</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-red-500">−{fmt(balance)}</p>
                        <p className="text-[10px] text-red-600/70">you owe</p>
                      </>
                    )}
                  </div>
                </button>
              );
            });
          })()}

          {/* MEMBERS */}
          {activeTab === 'members' && (
            <>
              {/* Add Member toggle */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowAddMember(p => !p)}
                  className="w-full flex items-center space-x-3 p-4 text-primary"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <UserPlus size={17} />
                  </div>
                  <span className="font-semibold text-sm">Add Member</span>
                </button>

                {showAddMember && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                    <input
                      autoFocus
                      type="email"
                      placeholder="Search by email..."
                      value={emailSearch}
                      onChange={e => setEmailSearch(e.target.value)}
                      className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {isSearching && <Loader2 className="animate-spin text-primary mx-auto" size={18} />}
                    {searchResults
                      ?.filter(u => !members.some((m: any) => m.user_id === u.id))
                      .map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between p-2 bg-background rounded-lg border border-border">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{u.name ?? u.email}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                          <button
                            onClick={() => addMemberMut.mutate(u.id)}
                            disabled={addMemberMut.isPending}
                            className="ml-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    }
                    {searchResults?.length === 0 && emailSearch.length > 2 && !isSearching && (
                      <p className="text-xs text-muted-foreground text-center py-1">No users found.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Member rows */}
              {members.map((member: any) => {
                const isMe = member.user_id === currentUser?.id;
                const canRemove = isCreator && !isMe;
                return (
                  <div key={member.user_id} className="flex items-center space-x-3 p-3 bg-card border border-border rounded-xl">
                    <Avatar user={member.users} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate flex items-center gap-2">
                        {isMe ? 'You' : (member.users.name ?? 'User')}
                        {member.user_id === group.created_by && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">Admin</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.users.email}</p>
                    </div>
                    {canRemove && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove ${member.users.name ?? member.users.email}?`)) {
                            removeMemberMut.mutate(member.user_id);
                          }
                        }}
                        disabled={removeMemberMut.isPending}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* LOGS */}
          {activeTab === 'logs' && (
            logs.length === 0
              ? <EmptyState icon="📋" text="No transactions yet." />
              : logs.map(renderLogItem)
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
