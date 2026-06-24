import { useState } from 'react';
import { Users } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/Skeleton';
import BalanceDetailModal from '../modals/BalanceDetailModal';
import { computeBalances } from '../../../utils/balanceCalculator';
import { useStore } from '../../../store/useStore';
import type { GroupMember, Expense, MemberBalance } from '../../../types';

interface Props {
  groupId:        string;
  members:        GroupMember[];
  expenses:       Expense[];
  isLoading:      boolean;
  currencySymbol: string;
}

export default function BalancesTab({
  members, expenses, isLoading, currencySymbol,
}: Props) {
  const user = useStore((s) => s.user);
  const [selectedBalance, setSelectedBalance] = useState<MemberBalance | null>(null);

  const balances = computeBalances(user?.id ?? '', expenses, members);

  const sorted = [...balances].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

  return (
    <div className="tab-panel">
      {isLoading ? (
        <SkeletonList count={3} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="All settled up!"
          subtitle="No outstanding balances with other members."
        />
      ) : (
        <div className="balance-list">
          {sorted.map((b) => (
            <BalanceRow
              key={b.userId}
              balance={b}
              currencySymbol={currencySymbol}
              onClick={() => setSelectedBalance(b)}
            />
          ))}
        </div>
      )}

      {selectedBalance && (
        <BalanceDetailModal
          balance={selectedBalance}
          currencySymbol={currencySymbol}
          open={!!selectedBalance}
          onClose={() => setSelectedBalance(null)}
        />
      )}
    </div>
  );
}

function BalanceRow({
  balance, currencySymbol, onClick,
}: {
  balance:        MemberBalance;
  currencySymbol: string;
  onClick:        () => void;
}) {
  const isPositive = balance.balance > 0; // they owe me
  const isNeutral  = balance.balance === 0;

  return (
    <button className="balance-row" onClick={onClick}>
      <Avatar src={balance.avatarUrl} name={balance.name} size={44} />
      <div className="balance-row-info">
        <p className="balance-row-name">{balance.name}</p>
        <p className="balance-row-sub">
          {isNeutral
            ? 'All settled up'
            : isPositive
            ? `Owes you ${currencySymbol}${balance.balance.toFixed(2)}`
            : `You owe ${currencySymbol}${Math.abs(balance.balance).toFixed(2)}`}
        </p>
      </div>
      <div className="balance-row-amount">
        <p className={`balance-row-value ${
          isNeutral  ? 'balance-neutral' :
          isPositive ? 'balance-positive' : 'balance-negative'
        }`}>
          {isNeutral ? '₹0' : `${currencySymbol}${Math.abs(balance.balance).toFixed(2)}`}
        </p>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.4 }}>
          <path d="M5 10.5l3.5-3.5L5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </button>
  );
}
