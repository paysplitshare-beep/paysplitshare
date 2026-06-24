import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
  Group, GroupMember, Expense, ActivityLog, CreateGroupInput, CreateExpenseInput,
} from '../types';
import { generateInviteCode } from '../utils/generateInviteCode';

// ── Query Keys ────────────────────────────────────────────────
export const groupKeys = {
  all:          () => ['groups'] as const,
  list:         () => [...groupKeys.all(), 'list'] as const,
  detail:       (id: string) => [...groupKeys.all(), 'detail', id] as const,
  members:      (id: string) => [...groupKeys.all(), 'members', id] as const,
  expenses:     (id: string) => [...groupKeys.all(), 'expenses', id] as const,
  logs:         (id: string) => [...groupKeys.all(), 'logs', id] as const,
  categories:   () => ['categories'] as const,
};

// ── GROUPS LIST ───────────────────────────────────────────────
export function useGroups() {
  return useQuery({
    queryKey: groupKeys.list(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          role,
          group:groups(
            id, name, type, default_currency, invite_code, invite_enabled,
            archived_at, created_at, updated_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { referencedTable: 'groups', ascending: false });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row.group,
        user_role: row.role,
      })) as Group[];
    },
  });
}

// ── GROUP DETAIL ──────────────────────────────────────────────
export function useGroup(id: string) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Group;
    },
    enabled: !!id,
  });
}

// ── GROUP MEMBERS ─────────────────────────────────────────────
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id, group_id, user_id, role, nickname, joined_at,
          user:users(id, name, email, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as GroupMember[];
    },
    enabled: !!groupId,
  });
}

// ── EXPENSES ──────────────────────────────────────────────────
export function useExpenses(groupId: string) {
  return useQuery({
    queryKey: groupKeys.expenses(groupId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(id, name, icon, color),
          payer:users!expenses_paid_by_fkey(id, name, email, avatar_url),
          splits:expense_splits(id, expense_id, user_id, guest_id, amount_owed, percentage, shares, settled_at)
        `)
        .eq('group_id', groupId)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
    enabled: !!groupId,
  });
}

// ── EXPENSE CATEGORIES ────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: groupKeys.categories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_system', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}

// ── ACTIVITY LOGS ─────────────────────────────────────────────
export function useActivityLogs(groupId: string) {
  return useQuery({
    queryKey: groupKeys.logs(groupId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          actor:users!activity_logs_actor_id_fkey(id, name, email, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as ActivityLog[];
    },
    enabled: !!groupId,
  });
}

// ── MUTATIONS ─────────────────────────────────────────────────

/** Create a new group and add the creator as admin */
export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const inviteCode = generateInviteCode();

      // Create group
      const { data: group, error: ge } = await supabase
        .from('groups')
        .insert({
          name:             input.name,
          type:             input.type,
          description:      input.description ?? null,
          default_currency: input.default_currency ?? 'INR',
          invite_code:      inviteCode,
          created_by:       user.id,
        })
        .select()
        .single();
      if (ge) throw ge;

      // Add creator as admin member
      const { error: me } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'admin' });
      if (me) throw me;

      // Log activity
      await supabase.from('activity_logs').insert({
        group_id: group.id,
        action:   'group_created',
        actor_id: user.id,
        metadata: { group_name: group.name },
      });

      return group as Group;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: groupKeys.list() }); },
  });
}

/** Join a group via invite code */
export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find group by invite code
      const { data: group, error: ge } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('invite_enabled', true)
        .is('archived_at', null)
        .single();
      if (ge || !group) throw new Error('Invalid or expired invite code');

      // Check not already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();
      if (existing) throw new Error('You are already in this group');

      // Add as member
      const { error: me } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'member' });
      if (me) throw me;

      // Log
      await supabase.from('activity_logs').insert({
        group_id: group.id,
        action:   'member_joined',
        actor_id: user.id,
        metadata: {},
      });

      return group as Group;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: groupKeys.list() }); },
  });
}

/** Add an expense to a group */
export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create expense
      const { data: expense, error: ee } = await supabase
        .from('expenses')
        .insert({
          group_id:     input.group_id,
          title:        input.title,
          amount:       input.amount,
          currency:     input.currency,
          category_id:  input.category_id,
          paid_by:      input.paid_by,
          split_method: input.split_method,
          date:         input.date,
          notes:        input.notes ?? null,
          created_by:   user.id,
        })
        .select()
        .single();
      if (ee) throw ee;

      // Create splits (equal split among member_ids)
      const perPerson = input.amount / input.member_ids.length;
      const splits = input.member_ids.map((uid) => ({
        expense_id:  expense.id,
        user_id:     uid,
        amount_owed: Math.round(perPerson * 100) / 100,
      }));

      const { error: se } = await supabase.from('expense_splits').insert(splits);
      if (se) throw se;

      // Log
      await supabase.from('activity_logs').insert({
        group_id:    input.group_id,
        action:      'expense_added',
        actor_id:    user.id,
        target_id:   expense.id,
        target_type: 'expense',
        metadata:    { title: input.title, amount: input.amount, currency: input.currency },
      });

      return expense;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: groupKeys.expenses(vars.group_id) });
      qc.invalidateQueries({ queryKey: groupKeys.logs(vars.group_id) });
    },
  });
}

/** Remove a member from a group (admin only) */
export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
      if (error) throw error;

      await supabase.from('activity_logs').insert({
        group_id:    groupId,
        action:      'member_removed',
        actor_id:    user.id,
        target_id:   userId,
        target_type: 'member',
        metadata:    {},
      });
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: groupKeys.members(vars.groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.logs(vars.groupId) });
    },
  });
}

/** Update group settings */
export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, ...updates
    }: Partial<Group> & { id: string }) => {
      const { error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: groupKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: groupKeys.list() });
    },
  });
}

/** Archive a group */
export function useArchiveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('groups')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', groupId);
      if (error) throw error;

      await supabase.from('activity_logs').insert({
        group_id: groupId,
        action:   'group_archived',
        actor_id: user.id,
        metadata: {},
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.list() });
    },
  });
}

/** Delete an expense (soft delete) */
export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ expenseId, groupId }: { expenseId: string; groupId: string }) => {
      const { error } = await supabase
        .from('expenses')
        .update({ is_deleted: true })
        .eq('id', expenseId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        group_id:    groupId,
        action:      'expense_deleted',
        actor_id:    user?.id ?? null,
        target_id:   expenseId,
        target_type: 'expense',
        metadata:    {},
      });
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: groupKeys.expenses(vars.groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.logs(vars.groupId) });
    },
  });
}
