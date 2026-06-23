import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const expenseSchema = z.object({
  title: z.string().min(2, "Title is too short").max(50, "Title is too long"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
  groupId: z.string().min(1, "Please select a group"),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

const AddExpense = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema)
  });

  const onSubmit = (data: ExpenseForm) => {
    console.log("Expense submitted", data);
    navigate(-1);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b border-border flex items-center bg-card">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold ml-2 text-foreground">Add Expense</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">$</span>
            <input 
              type="text" 
              {...register('amount')}
              placeholder="0.00"
              className="w-full bg-transparent text-4xl font-bold text-foreground pl-10 pr-4 py-4 border-b-2 border-border focus:border-primary outline-none transition-colors"
            />
          </div>
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Description</label>
          <input 
            type="text" 
            {...register('title')}
            placeholder="What was this for?"
            className="w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Group</label>
          <select 
            {...register('groupId')}
            className="w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
          >
            <option value="">Select a group</option>
            <option value="group1">Weekend Trip</option>
            <option value="group2">Roommates</option>
          </select>
          {errors.groupId && <p className="text-sm text-red-500">{errors.groupId.message}</p>}
        </div>
      </form>

      <div className="p-4 border-t border-border bg-card pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button 
          onClick={handleSubmit(onSubmit)}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
        >
          Save Expense
        </button>
      </div>
    </div>
  );
};

export default AddExpense;
