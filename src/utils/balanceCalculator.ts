import type { Expense, GroupMember, MemberBalance } from '../types';

/**
 * Computes net balances between the current user and each other group member.
 *
 * For each expense:
 * - If current user paid: each split member owes the current user their split amount.
 * - If another member paid: the current user owes them their own split amount.
 *
 * Returns one MemberBalance per other member (excludes self).
 * Positive balance = they owe you. Negative = you owe them.
 */
export function computeBalances(
  currentUserId: string,
  expenses: Expense[],
  members: GroupMember[],
): MemberBalance[] {
  const balanceMap = new Map<string, MemberBalance>();

  // Init map for all other members
  for (const m of members) {
    if (m.user_id === currentUserId) continue;
    balanceMap.set(m.user_id, {
      userId:       m.user_id,
      name:         m.user?.name ?? m.user?.email ?? 'Unknown',
      email:        m.user?.email ?? '',
      avatarUrl:    m.user?.avatar_url ?? null,
      balance:      0,
      transactions: [],
    });
  }

  for (const expense of expenses) {
    if (!expense.paid_by || !expense.splits) continue;

    const paidByMe = expense.paid_by === currentUserId;

    for (const split of expense.splits) {
      if (!split.user_id || split.settled_at) continue;

      if (paidByMe && split.user_id !== currentUserId) {
        // Other member owes me
        const member = balanceMap.get(split.user_id);
        if (member) {
          member.balance += split.amount_owed;
          member.transactions.push({
            expenseId:    expense.id,
            expenseTitle: expense.title,
            amount:       split.amount_owed,
            date:         expense.date,
            type:         'they_owe',
          });
        }
      } else if (!paidByMe && split.user_id === currentUserId) {
        // I owe the payer
        const member = balanceMap.get(expense.paid_by!);
        if (member) {
          member.balance -= split.amount_owed;
          member.transactions.push({
            expenseId:    expense.id,
            expenseTitle: expense.title,
            amount:       split.amount_owed,
            date:         expense.date,
            type:         'you_owe',
          });
        }
      }
    }
  }

  return Array.from(balanceMap.values());
}

/**
 * Computes group summary totals for the current user.
 */
export function computeGroupSummary(
  currentUserId: string,
  expenses: Expense[],
): { totalSpent: number; youSpent: number; youAreOwed: number; youOwe: number } {
  let totalSpent  = 0;
  let youSpent    = 0;
  let youAreOwed  = 0;
  let youOwe      = 0;

  for (const expense of expenses) {
    if (!expense.splits) continue;
    totalSpent += expense.amount;
    if (expense.paid_by === currentUserId) {
      youSpent += expense.amount;
    }
    for (const split of expense.splits) {
      if (split.settled_at || !split.user_id) continue;
      if (split.user_id === currentUserId && expense.paid_by !== currentUserId) {
        youOwe += split.amount_owed;
      }
      if (split.user_id !== currentUserId && expense.paid_by === currentUserId) {
        youAreOwed += split.amount_owed;
      }
    }
  }

  return { totalSpent, youSpent, youAreOwed, youOwe };
}
