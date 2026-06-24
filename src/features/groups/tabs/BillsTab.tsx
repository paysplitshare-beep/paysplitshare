import { useState } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Receipt } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/Skeleton';
import NewBillSheet from '../NewBillSheet';
import type { Expense, Group, GroupMember } from '../../../types';

interface Props {
  groupId:        string;
  group:          Group | null;
  members:        GroupMember[];
  expenses:       Expense[];
  isLoading:      boolean;
  currencySymbol: string;
}

export default function BillsTab({
  groupId, group, members, expenses, isLoading, currencySymbol,
}: Props) {
  const [showNewBill, setShowNewBill] = useState(false);
  const [currentDate, setCurrentDate]  = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(currentDate);

  const monthExpenses = expenses.filter((e) => {
    try {
      return isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd });
    } catch { return false; }
  });

  const monthLabel = format(currentDate, 'MMMM yyyy');

  const goToPrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const goToNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  return (
    <div className="tab-panel">
      {/* Month header row */}
      <div className="bills-month-row">
        <div className="bills-month-nav">
          <button className="icon-btn-sm" onClick={goToPrevMonth} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <span className="bills-month-label">{monthLabel}</span>
          <button className="icon-btn-sm" onClick={goToNextMonth} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowNewBill(true)}
          id="new-bill-btn"
        >
          <Plus size={15} />
          New Bill
        </button>
      </div>

      {/* Expense list */}
      {isLoading ? (
        <SkeletonList count={3} />
      ) : monthExpenses.length === 0 ? (
        <EmptyState
          icon={<Receipt size={40} />}
          title="No bills this month"
          subtitle="Tap 'New Bill' to add an expense"
          action={
            <button className="btn btn-primary" onClick={() => setShowNewBill(true)}>
              Add First Bill
            </button>
          }
        />
      ) : (
        <div className="expense-list">
          {monthExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              currencySymbol={currencySymbol}
            />
          ))}
        </div>
      )}

      {/* New Bill Sheet */}
      <NewBillSheet
        open={showNewBill}
        onClose={() => setShowNewBill(false)}
        groupId={groupId}
        groupCurrency={group?.default_currency ?? 'INR'}
        members={members}
      />
    </div>
  );
}

function ExpenseCard({
  expense,
  currencySymbol,
}: {
  expense:        Expense;
  currencySymbol: string;
}) {
  const payerName  = expense.payer?.name ?? expense.payer?.email ?? 'Unknown';
  const payerAvatar = expense.payer?.avatar_url ?? null;
  const catIcon    = expense.category?.icon ?? '💰';
  const catColor   = expense.category?.color ?? '#9CA3AF';

  let dateDisplay = '';
  try { dateDisplay = format(parseISO(expense.date), 'MMM d'); } catch { dateDisplay = expense.date; }

  return (
    <div className="expense-card">
      <div
        className="expense-cat-icon"
        style={{ background: `${catColor}22`, color: catColor }}
      >
        {catIcon}
      </div>
      <div className="expense-info">
        <p className="expense-title">{expense.title}</p>
        <div className="expense-meta">
          <Avatar src={payerAvatar} name={payerName} size={16} />
          <span>{payerName}</span>
          <span className="expense-dot">·</span>
          <span>{dateDisplay}</span>
          {expense.split_method && (
            <>
              <span className="expense-dot">·</span>
              <span className="expense-split-badge">equal split</span>
            </>
          )}
        </div>
      </div>
      <div className="expense-amount">
        <p className="expense-amount-value">
          {currencySymbol}{Number(expense.amount).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
