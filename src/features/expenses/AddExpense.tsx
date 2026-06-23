import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { EXPENSE_CATEGORIES, type CategoryId } from '../../lib/categories';

// ─── Zod schema ──────────────────────────────────────────────────────────────
const expenseSchema = z.object({
  title:   z.string().min(2, 'Title is too short').max(50, 'Title is too long'),
  amount:  z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  groupId: z.string().min(1, 'Please select a group'),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

// ─── Component ───────────────────────────────────────────────────────────────
const AddExpense = () => {
  const navigate = useNavigate();
  const user = useStore(state => state.user);
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('other');

  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
  });

  const { data: groups, isLoading: loadingGroups } = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: () => api.getGroups(user!.id),
    enabled: !!user?.id,
  });

  const mutation = useMutation({
    mutationFn: async (data: ExpenseForm) => {
      const group = await api.getGroupDetails(data.groupId);
      const participantIds = group.group_members.map((m: any) => m.user_id);
      return api.addExpense(
        data.groupId,
        data.title,
        parseFloat(data.amount),
        user!.id,
        participantIds,
        selectedCategory,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigate(-1);
    },
  });

  const onSubmit = (data: ExpenseForm) => mutation.mutate(data);

  const activeCat = EXPENSE_CATEGORIES.find(c => c.id === selectedCategory)!;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="p-4 border-b border-border flex items-center bg-card">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold ml-2 text-foreground">Add Expense</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Amount hero */}
        <div className={cn('p-6 flex flex-col items-center border-b border-border', activeCat.color.split(' ')[0])}>
          <span className="text-5xl mb-2">{activeCat.emoji}</span>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-widest">{activeCat.label}</p>
          <div className="flex items-start">
            <span className="text-3xl font-bold text-muted-foreground mt-1 mr-1">₹</span>
            <input
              type="number"
              inputMode="decimal"
              {...register('amount')}
              placeholder="0.00"
              className="bg-transparent text-5xl font-extrabold text-foreground w-40 text-center focus:outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Category Picker */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Category</label>
            <div className="grid grid-cols-5 gap-2">
              {EXPENSE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1',
                    selectedCategory === cat.id
                      ? `${cat.color} border-current scale-105 shadow-sm`
                      : 'border-border text-muted-foreground hover:border-primary/40 bg-card',
                  )}
                >
                  <span className="text-xl leading-none">{cat.emoji}</span>
                  <span className="text-[9px] font-medium leading-tight text-center line-clamp-1">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <input
              type="text"
              {...register('title')}
              placeholder="What was this for?"
              className="w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          {/* Group */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Group</label>
            {loadingGroups ? (
              <div className="h-12 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            ) : (
              <select
                {...register('groupId')}
                className="w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                <option value="">Select a group</option>
                {groups?.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
            {errors.groupId && <p className="text-sm text-red-500">{errors.groupId.message}</p>}
          </div>
        </form>
      </div>

      {/* Save Button */}
      <div className="p-4 border-t border-border bg-card pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={mutation.isPending || loadingGroups}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {mutation.isPending
            ? <Loader2 className="animate-spin" size={22} />
            : <><span className="text-lg">{activeCat.emoji}</span> Save Expense</>}
        </button>
      </div>
    </div>
  );
};

export default AddExpense;
