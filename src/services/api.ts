import { supabase } from '../lib/supabase';

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
}

export const api = {
  // ── Groups ──────────────────────────────────────────────────────────────────
  async getGroups(userId: string) {
    const { data, error } = await supabase
      .from('groups')
      .select('*, group_members!inner(user_id)')
      .eq('group_members.user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createGroup(name: string, userId: string) {
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name, created_by: userId })
      .select()
      .single();
    if (groupError) throw groupError;

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId });
    if (memberError) throw memberError;
    return group;
  },

  async getGroupDetails(groupId: string) {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members(
          user_id,
          users (id, name, email, avatar_url)
        )
      `)
      .eq('id', groupId)
      .single();
    if (error) throw error;
    return data;
  },

  // ── Group Expenses ───────────────────────────────────────────────────────────
  async getGroupExpenses(groupId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        id, title, amount, category, paid_by, created_at,
        payer:paid_by(id, name, avatar_url),
        expense_participants(user_id, amount_owed)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as any[];
  },

  // ── Group Settlements ────────────────────────────────────────────────────────
  async getGroupSettlements(groupId: string) {
    const { data, error } = await supabase
      .from('settlements')
      .select(`
        id, amount, payer_id, receiver_id, created_at,
        payer:payer_id(id, name, avatar_url),
        receiver:receiver_id(id, name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as any[];
  },

  // ── Members ──────────────────────────────────────────────────────────────────
  async searchUsersByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', `%${email}%`)
      .limit(5);
    if (error) throw error;
    return data as User[];
  },

  async addMemberToGroup(groupId: string, userId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId })
      .select();
    if (error) throw error;
    return data;
  },

  async removeMember(groupId: string, userId: string) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // ── Expenses ─────────────────────────────────────────────────────────────────
  async addExpense(
    groupId: string,
    title: string,
    amount: number,
    paidBy: string,
    participants: string[],
    category: string = 'other',
  ) {
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({ group_id: groupId, title, amount, paid_by: paidBy, category })
      .select()
      .single();
    if (expenseError) throw expenseError;

    const splitAmount = amount / participants.length;
    const participantData = participants.map(userId => ({
      expense_id: expense.id,
      user_id: userId,
      amount_owed: splitAmount,
    }));

    const { error: participantsError } = await supabase
      .from('expense_participants')
      .insert(participantData);
    if (participantsError) throw participantsError;
    return expense;
  },

  // ── Settlements ──────────────────────────────────────────────────────────────
  async settleUp(groupId: string, payerId: string, receiverId: string, amount: number) {
    const { data, error } = await supabase
      .from('settlements')
      .insert({ group_id: groupId, payer_id: payerId, receiver_id: receiverId, amount })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── Activity (global feed) ───────────────────────────────────────────────────
  async getActivity(userId: string) {
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const groupIds = memberships?.map(g => g.group_id) || [];
    if (groupIds.length === 0) return [];

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        id, title, amount, category, created_at, paid_by,
        payer:paid_by(name, avatar_url),
        groups(name)
      `)
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data as any[];
  },
};
