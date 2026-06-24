import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Friend, Guest, User, CreateGuestInput } from '../types';

const friendKeys = {
  all:    () => ['friends'] as const,
  list:   () => [...friendKeys.all(), 'list'] as const,
  search: (q: string) => [...friendKeys.all(), 'search', q] as const,
};

export function useFriends() {
  return useQuery({
    queryKey: friendKeys.list(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('friends')
        .select(`
          id, user_id, friend_id, guest_id, status, created_at,
          friend:users!friends_friend_id_fkey(id, name, email, avatar_url),
          guest:guests(id, name, email, avatar_color)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Friend[];
    },
  });
}

/** Search platform users by name or email */
export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: friendKeys.search(query),
    queryFn: async () => {
      if (!query.trim() || query.trim().length < 2) return [];

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return (data ?? []) as User[];
    },
    enabled: query.trim().length >= 2,
  });
}

export function useAddFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (friendId === user.id) throw new Error('Cannot add yourself');

      const { error } = await supabase
        .from('friends')
        .insert({ user_id: user.id, friend_id: friendId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: friendKeys.list() }),
  });
}

export function useAddGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGuestInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: guest, error: ge } = await supabase
        .from('guests')
        .insert({ ...input, created_by: user.id })
        .select()
        .single();
      if (ge) throw ge;

      const { error: fe } = await supabase
        .from('friends')
        .insert({ user_id: user.id, guest_id: guest.id });
      if (fe) throw fe;

      return guest as Guest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: friendKeys.list() }),
  });
}

export function useArchiveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friends')
        .update({ status: 'archived' })
        .eq('id', friendId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: friendKeys.list() }),
  });
}
