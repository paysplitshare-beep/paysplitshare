import Modal from '../../../components/ui/Modal';
import { format, parseISO } from 'date-fns';
import type { MemberBalance } from '../../../types';
import Avatar from '../../../components/ui/Avatar';

interface Props {
  open:           boolean;
  onClose:        () => void;
  balance:        MemberBalance;
  currencySymbol: string;
}

export default function BalanceDetailModal({ open, onClose, balance, currencySymbol }: Props) {
  const isPositive = balance.balance >= 0;

  return (
    <Modal open={open} onClose={onClose} title="Balance Breakdown" maxWidth="460px">
      <div className="balance-detail">
        {/* Header */}
        <div className="balance-detail-header">
          <Avatar src={balance.avatarUrl} name={balance.name} size={52} />
          <div>
            <p className="balance-detail-name">{balance.name}</p>
            <p className={`balance-detail-summary ${isPositive ? 'balance-positive' : 'balance-negative'}`}>
              {isPositive
                ? `Owes you ${currencySymbol}${balance.balance.toFixed(2)}`
                : `You owe ${currencySymbol}${Math.abs(balance.balance).toFixed(2)}`}
            </p>
          </div>
        </div>

        {/* Transactions */}
        <div className="balance-transactions">
          {balance.transactions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No transactions yet
            </p>
          ) : (
            balance.transactions.map((t, i) => {
              let dateDisplay = '';
              try { dateDisplay = format(parseISO(t.date), 'MMM d'); } catch { dateDisplay = t.date; }

              return (
                <div key={i} className="balance-tx-row">
                  <div className="balance-tx-icon">
                    {t.type === 'they_owe' ? '💸' : '🔴'}
                  </div>
                  <div className="balance-tx-info">
                    <p className="balance-tx-title">{t.expenseTitle}</p>
                    <p className="balance-tx-date">{dateDisplay}</p>
                  </div>
                  <div className="balance-tx-amount">
                    <p className={t.type === 'they_owe' ? 'balance-positive' : 'balance-negative'}>
                      {t.type === 'they_owe' ? '+' : '-'}
                      {currencySymbol}{t.amount.toFixed(2)}
                    </p>
                    <p className="balance-tx-desc">
                      {t.type === 'they_owe' ? 'they owe you' : 'you owe'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Net balance */}
        <div className="balance-net-row">
          <span>Net Balance</span>
          <strong className={isPositive ? 'balance-positive' : 'balance-negative'}>
            {isPositive ? '+' : ''}{currencySymbol}{balance.balance.toFixed(2)}
          </strong>
        </div>
      </div>
    </Modal>
  );
}
