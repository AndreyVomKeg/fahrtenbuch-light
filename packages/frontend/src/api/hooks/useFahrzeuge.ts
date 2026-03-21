import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fahrzeuge } from '../../lib/api';
import type { CreateFahrzeugInput, UpdateFahrzeugInput } from '../../types';

export function useFahrzeuge() {
  return useQuery({
    queryKey: ['fahrzeuge'],
    queryFn: fahrzeuge.list,
  });
}

export function useFahrzeug(id: string) {
  return useQuery({
    queryKey: ['fahrzeuge', id],
    queryFn: () => fahrzeuge.get(id),
    enabled: !!id,
  });
}

export function useCreateFahrzeug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFahrzeugInput) => fahrzeuge.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fahrzeuge'] });
    },
  });
}

export function useUpdateFahrzeug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFahrzeugInput }) =>
      fahrzeuge.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fahrzeuge'] });
    },
  });
}
