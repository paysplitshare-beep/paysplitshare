import { useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { getCategoryById } from '../../lib/categories';

// ── Per-pair balance ──────────────────────────────────────────────────────────
// positive = other owes me  |  negative = I owe other
function computePairBalance(
  expenses: any[],
  settlements: any[],
  currentUserId: string,
  otherUserId: string,
): number {
  let net = 0;

  for (const exp of expenses) {
    const participants: any[] = exp.expense_participants ?? [];
    if (exp.paid_by === currentUserId) {
      const p = participants.find(p => p.user_id === otherUserId);
      if (p) net += Number(p.amount_owed);
    } else if (exp.paid_by === otherUserId) {
      const p = participants.find(p => p.user_id === currentUserId);
      if (p) net -= Number(p.amount_owed);
    }
  }

  for (const s of settlements) {
    if (s.payer_id === currentUserId && s.receiver_id === otherUserId) {
      net += Number(s.amount); // I paid them → reduces my debt
    } else if (s.payer_id === otherUserId && s.receiver_id === currentUserId) {
      net -= Number(s.amount); // They paid me → reduces their debt
    }
  }

  return net;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${Math.abs(n).toFixed(2)}`;
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const Avatar = ({ user, size = 'md' }: { user: any; size?: 'sm' | 'md' | 'lg' }) => {
  const dim = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={cn('rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0', dim)}>
      {user?.avatar_url
        ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
        : <span className="text-primary font-bold">{(user?.name ?? user?.email ?? '?')[0].toUpperCase()}</span>
      }
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
const MemberBalance = () => {
  const { id: groupId, memberId } = useParams<{ id: string; memberId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useStore(state => state.user);

  const [showSettle, setShowSettle] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.getGroupDetails(groupId!),
    enabled: !!groupId,
  });

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ['group-expenses', groupId],
    queryFn: () => api.getGroupExpenses(groupId!),
    enabled: !!groupId,
  });

  const { data: settlements = [], isLoading: setLoading } = useQuery({
    queryKey: ['group-settlements', groupId],
    queryFn: () => api.getGroupSettlements(groupId!),
    enabled: !!groupId,
  });

  // ── Settle up mutation ────────────────────────────────────────────────────────
  const settleUpMut = useMutation({
    mutationFn: ({ payerId, receiverId, amount }: { payerId: string; receiverId: string; amount: number }) =>
      api.settleUp(groupId!, payerId, receiverId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-settlements', groupId] });
      setShowSettle(false);
      setSettleAmount('');
    },
  });

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (expLoading || setLoading || !group) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const memberData = (group.group_members ?? []).find((m: any) => m.user_id === memberId);
  if (!memberData) return null;
  const member = memberData.users;

  // ── Balance & transactions ────────────────────────────────────────────────────
  const netBalance = computePairBalance(expenses, settlements, currentUser?.id ?? '', memberId!);
  const isOwed = netBalance > 0.005;  // they owe me
  const isEven = Math.abs(netBalance) < 0.005;

  // Filter to only transactions involving both users
  const relevantExpenses = expenses.filter(e =>
    (e.paid_by === currentUser?.id && e.expense_participants?.some((p: any) => p.user_id === memberId)) ||
    (e.paid_by === memberId && e.expense_participants?.some((p: any) => p.user_id === currentUser?.id)),
  );

  const relevantSettlements = settlements.filter(s =>
    (s.payer_id === currentUser?.id && s.receiver_id === memberId) ||
    (s.payer_id === memberId && s.receiver_id === currentUser?.id),
  );

  const allItems = [
    ...relevantExpenses.map(e => ({ ...e, _type: 'expense' as const })),
    ...relevantSettlements.map(s => ({ ...s, _type: 'settlement' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // ── Settle handler ────────────────────────────────────────────────────────────
  const handleSettle = () => {
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (netBalance < 0) {
      // I owe them → I pay them
      settleUpMut.mutate({ payerId: currentUser!.id, receiverId: memberId!, amount });
    } else {
      // They owe me → they pay me (recorded by me)
      settleUpMut.mutate({ payerId: memberId!, receiverId: currentUser!.id, amount });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border flex items-center bg-card gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground shrink-0">
          <ArrowLeft size={22} />
        </button>
        <Avatar user={member} size="sm" />
        <h1 className="text-lg font-bold text-foreground truncate flex-1">
          {member.name ?? member.email}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* ── Balance Banner ─────────────────────────────────────────── */}
        <div
          className={cn(
            'p-8 text-center border-b border-border',
            isEven ? 'bg-muted/30' : isOwed ? 'bg-green-500/10' : 'bg-red-500/10',
          )}
        >
          <Avatar user={member} size="lg" />
          <div className="mt-4">
            {isEven ? (
              <>
                <p className="text-3xl font-extrabold text-foreground">All Settled! 🎉</p>
                <p className="text-sm text-muted-foreground mt-1">You're even with {member.name ?? member.email}</p>
              </>
            ) : isOwed ? (
              <>
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-widest mb-1">They Owe You</p>
                <p className="text-4xl font-extrabold text-green-500">{fmt(netBalance)}</p>
                <p className="text-sm text-muted-foreground mt-1">{member.name ?? member.email} owes you</p>
              </>
            ) : (
              <>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-widest mb-1">You Owe</p>
                <p className="text-4xl font-extrabold text-red-500">{fmt(netBalance)}</p>
                <p className="text-sm text-muted-foreground mt-1">You owe {member.name ?? member.email}</p>
              </>
            )}
          </div>
        </div>

        {/* ── Settle Up ─────────────────────────────────────────────── */}
        {!isEven && (
          <div className="px-4 py-4 border-b border-border">
            {!showSettle ? (
              <button
                onClick={() => {
                  setShowSettle(true);
                  setSettleAmount(Math.abs(netBalance).toFixed(2));
                }}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                💸 Settle Up
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  {netBalance < 0
                    ? `You're paying ${member.name ?? member.email}`
                    : `Recording ${member.name ?? member.email}'s payment to you`}
                </p>
                <div className="flex space-x-2">
                  <div className="flex-1 flex items-center bg-card border border-border rounded-xl px-4">
                    <span className="text-muted-foreground mr-1 text-lg">₹</span>
                    <input
                      type="number"
                      value={settleAmount}
                      onChange={e => setSettleAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-foreground py-3 focus:outline-none text-xl font-bold"
                    />
                  </div>
                  <button
                    onClick={handleSettle}
                    disabled={settleUpMut.isPending}
                    className="px-4 py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center gap-1.5 hover:bg-green-600 transition-colors disabled:opacity-70"
                  >
                    {settleUpMut.isPending
                      ? <Loader2 size={18} className="animate-spin" />
                      : <CheckCircle2 size={18} />}
                    Confirm
                  </button>
                </div>
                <button
                  onClick={() => setShowSettle(false)}
                  className="text-sm text-muted-foreground w-full text-center"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Transaction History ────────────────────────────────────── */}
        <div className="p-4 space-y-3 pb-24">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Transaction History
          </h2>

          {allItems.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl block mb-2">🤝</span>
              <p className="text-muted-foreground text-sm">No transactions with this member yet.</p>
            </div>
          ) : (
            allItems.map(item => {
              if (item._type === 'expense') {
                const cat = getCategoryById(item.category ?? 'other');
                const iPaid = item.paid_by === currentUser?.id;
                const myShare = item.expense_participants?.find((p: any) => p.user_id === currentUser?.id)?.amount_owed;
                const theirShare = item.expense_participants?.find((p: any) => p.user_id === memberId)?.amount_owed;
                const delta = iPaid ? Number(theirShare) : -Number(myShare);
                return (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-card border border-border rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl shrink-0">
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {iPaid ? 'You paid' : `${member.name ?? 'They'} paid`} · {fmtDate(item.created_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {iPaid
                          ? `Their share: ₹${Number(theirShare).toFixed(2)}`
                          : `Your share: ₹${Number(myShare).toFixed(2)}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('font-bold text-sm', delta > 0 ? 'text-green-500' : 'text-red-500')}>
                        {delta > 0 ? '+' : '−'}{fmt(delta)}
                      </p>
                      <p className="text-xs text-muted-foreground">of {fmt(Number(item.amount))}</p>
                    </div>
                  </div>
                );
              }

              // settlement
              const iPaid = item.payer_id === currentUser?.id;
              return (
                <div key={item.id} className="flex items-center space-x-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-xl shrink-0">✅</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">Settlement</p>
                    <p className="text-xs text-muted-foreground">
                      {iPaid ? 'You paid' : `${member.name ?? 'They'} paid you`} · {fmtDate(item.created_at)}
                    </p>
                  </div>
                  <p className="font-bold text-green-500 text-sm shrink-0">{fmt(Number(item.amount))}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberBalance;
