import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';

const schema = z.object({
  name: z.string().min(2, "Group name is too short").max(30, "Group name is too long"),
});

type FormValues = z.infer<typeof schema>;

const CreateGroup = () => {
  const navigate = useNavigate();
  const user = useStore(state => state.user);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const mutation = useMutation({
    mutationFn: (name: string) => api.createGroup(name, user!.id),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ['groups', user?.id] });
      navigate(`/groups/${newGroup.id}`, { replace: true });
    }
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data.name);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b border-border flex items-center bg-card">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold ml-2 text-foreground">New Group</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Group Name</label>
          <input 
            type="text" 
            {...register('name')}
            placeholder="e.g. Weekend Trip"
            className="w-full bg-card border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
      </form>

      <div className="p-4 border-t border-border bg-card pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button 
          onClick={handleSubmit(onSubmit)}
          disabled={mutation.isPending}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-70"
        >
          {mutation.isPending ? <Loader2 className="animate-spin" size={24} /> : "Create Group"}
        </button>
      </div>
    </div>
  );
};

export default CreateGroup;
