// ────────────────────────────────────────────────────────────
//  PaySplit – TypeScript Types
// ────────────────────────────────────────────────────────────

export type GroupType        = 'general' | 'trip' | 'home' | 'event';
export type GroupMemberRole  = 'admin' | 'member';
export type SplitMethod      = 'equal' | 'exact' | 'percentage' | 'shares';
export type FriendStatus     = 'active' | 'archived';
export type ToastType        = 'success' | 'error' | 'warning' | 'info';
export type ActivityAction   =
  | 'group_created' | 'group_updated' | 'group_archived'
  | 'member_joined' | 'member_removed' | 'member_role_changed'
  | 'expense_added' | 'expense_updated' | 'expense_deleted'
  | 'settlement_recorded';

// ── Users ────────────────────────────────────────────────────
export interface User {
  id:         string;
  name:       string | null;
  email:      string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── Expense Categories ────────────────────────────────────────
export interface ExpenseCategory {
  id:         string;
  name:       string;
  icon:       string;   // emoji
  color:      string;   // hex
  is_system:  boolean;
  created_by: string | null;
  created_at: string;
}

// Static system categories (mirrors DB seed, used client-side too)
export const SYSTEM_CATEGORIES: Pick<ExpenseCategory, 'name' | 'icon' | 'color'>[] = [
  { name: 'Food & Drink',  icon: '🍕', color: '#F97316' },
  { name: 'Transport',     icon: '🚗', color: '#3B82F6' },
  { name: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
  { name: 'Housing',       icon: '🏠', color: '#06B6D4' },
  { name: 'Shopping',      icon: '🛒', color: '#EC4899' },
  { name: 'Travel',        icon: '✈️', color: '#10B981' },
  { name: 'Health',        icon: '💊', color: '#EF4444' },
  { name: 'Education',     icon: '🎓', color: '#F59E0B' },
  { name: 'Utilities',     icon: '📱', color: '#6366F1' },
  { name: 'Gifts',         icon: '🎁', color: '#14B8A6' },
  { name: 'Sports',        icon: '⚽', color: '#84CC16' },
  { name: 'Other',         icon: '💰', color: '#9CA3AF' },
];

// ── Groups ────────────────────────────────────────────────────
export interface Group {
  id:               string;
  name:             string;
  type:             GroupType;
  description:      string | null;
  cover_image_url:  string | null;
  default_currency: string;
  invite_code:      string;
  invite_enabled:   boolean;
  created_by:       string | null;
  archived_at:      string | null;
  created_at:       string;
  updated_at:       string;
  // Joined / computed
  member_count?:    number;
  user_role?:       GroupMemberRole;
  last_expense_at?: string | null;
}

// ── Group Members ─────────────────────────────────────────────
export interface GroupMember {
  id:        string;
  group_id:  string;
  user_id:   string;
  role:      GroupMemberRole;
  nickname:  string | null;
  joined_at: string;
  user?:     User;
}

// ── Guests ───────────────────────────────────────────────────
export interface Guest {
  id:           string;
  created_by:   string;
  name:         string;
  email:        string | null;
  phone:        string | null;
  avatar_color: string | null;
  created_at:   string;
}

// ── Expenses ─────────────────────────────────────────────────
export interface Expense {
  id:            string;
  group_id:      string;
  title:         string;
  amount:        number;
  currency:      string;
  exchange_rate: number;
  category_id:   string | null;
  paid_by:       string | null;
  split_method:  SplitMethod;
  date:          string;
  notes:         string | null;
  receipt_url:   string | null;
  is_deleted:    boolean;
  created_by:    string | null;
  created_at:    string;
  updated_at:    string;
  // Joined
  category?: ExpenseCategory;
  payer?:    User;
  splits?:   ExpenseSplit[];
}

// ── Expense Splits ────────────────────────────────────────────
export interface ExpenseSplit {
  id:          string;
  expense_id:  string;
  user_id:     string | null;
  guest_id:    string | null;
  amount_owed: number;
  percentage:  number | null;
  shares:      number | null;
  settled_at:  string | null;
  created_at:  string;
}

// ── Settlements ───────────────────────────────────────────────
export interface Settlement {
  id:         string;
  group_id:   string;
  payer_id:   string | null;
  payee_id:   string | null;
  amount:     number;
  currency:   string;
  note:       string | null;
  settled_at: string;
  created_at: string;
}

// ── Friends ───────────────────────────────────────────────────
export interface Friend {
  id:         string;
  user_id:    string;
  friend_id:  string | null;
  guest_id:   string | null;
  status:     FriendStatus;
  created_at: string;
  friend?:    User;
  guest?:     Guest;
}

// ── Activity Logs ─────────────────────────────────────────────
export interface ActivityLog {
  id:          string;
  group_id:    string;
  action:      ActivityAction | string;
  actor_id:    string | null;
  target_id:   string | null;
  target_type: string | null;
  metadata:    Record<string, unknown>;
  created_at:  string;
  actor?:      User;
}

// ── UI Types ──────────────────────────────────────────────────
export interface Toast {
  id:        string;
  type:      ToastType;
  message:   string;
  duration?: number;
}

// ── Computed / Derived ────────────────────────────────────────
export interface MemberBalance {
  userId:      string;
  name:        string;
  email:       string;
  avatarUrl:   string | null;
  balance:     number;  // positive = they owe you, negative = you owe them
  transactions: Array<{
    expenseId:    string;
    expenseTitle: string;
    amount:       number;
    date:         string;
    type:         'you_owe' | 'they_owe';
  }>;
}

export interface GroupSummary {
  totalSpent:  number;
  youSpent:    number;
  youAreOwed:  number;
  youOwe:      number;
  currency:    string;
}

// ── Form Input Types ──────────────────────────────────────────
export interface CreateGroupInput {
  name: string;
  type: GroupType;
  description?: string;
  default_currency?: string;
}

export interface CreateExpenseInput {
  title:        string;
  amount:       number;
  currency:     string;
  category_id:  string | null;
  paid_by:      string;
  split_method: SplitMethod;
  date:         string;
  notes?:       string;
  group_id:     string;
  member_ids:   string[];  // who to split among
}

export interface CreateGuestInput {
  name:  string;
  email?: string;
  phone?: string;
}

// ── Currencies ───────────────────────────────────────────────
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code;
}

// ── Group Type Labels ─────────────────────────────────────────
export const GROUP_TYPE_META: Record<GroupType, { label: string; icon: string; color: string }> = {
  general: { label: 'General',       icon: '🗂️',  color: '#6366F1' },
  trip:    { label: 'Trip',          icon: '✈️',  color: '#10B981' },
  home:    { label: 'Home',          icon: '🏠',  color: '#06B6D4' },
  event:   { label: 'Event',         icon: '🎉',  color: '#EC4899' },
};
