import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { UserProfile } from '@/types/api';

type ProfileEnvelope = { profile: UserProfile };
export const profileKey = ['profile'] as const;
export function useProfile(enabled = true) {
  return useQuery({ queryKey: profileKey, queryFn: () => api<ProfileEnvelope>('/api/v1/users/me/profile').then((value) => value.profile), enabled });
}
export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfile) => api<ProfileEnvelope>('/api/v1/users/me/profile', { method: 'PATCH', body: JSON.stringify(profile) }).then((value) => value.profile),
    onSuccess: (profile) => client.setQueryData(profileKey, profile),
  });
}
