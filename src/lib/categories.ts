export const EXPENSE_CATEGORIES = [
  { id: 'food',          label: 'Food & Drinks',  emoji: '🍔', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
  { id: 'groceries',     label: 'Groceries',       emoji: '🛒', color: 'bg-green-500/10  text-green-500  border-green-500/30'  },
  { id: 'rent',          label: 'Rent',             emoji: '🏠', color: 'bg-blue-500/10   text-blue-500   border-blue-500/30'   },
  { id: 'transport',     label: 'Transport',        emoji: '🚗', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  { id: 'entertainment', label: 'Entertainment',   emoji: '🎬', color: 'bg-purple-500/10  text-purple-500 border-purple-500/30' },
  { id: 'travel',        label: 'Travel',           emoji: '✈️', color: 'bg-sky-500/10    text-sky-500    border-sky-500/30'    },
  { id: 'health',        label: 'Health',           emoji: '💊', color: 'bg-red-500/10    text-red-500    border-red-500/30'    },
  { id: 'utilities',     label: 'Utilities',        emoji: '💡', color: 'bg-amber-500/10  text-amber-600  border-amber-500/30'  },
  { id: 'shopping',      label: 'Shopping',         emoji: '🛍️', color: 'bg-pink-500/10   text-pink-500   border-pink-500/30'   },
  { id: 'other',         label: 'Other',            emoji: '📦', color: 'bg-muted text-muted-foreground border-border'          },
] as const;

export type CategoryId = typeof EXPENSE_CATEGORIES[number]['id'];

export const getCategoryById = (id: string) =>
  EXPENSE_CATEGORIES.find(c => c.id === id) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
