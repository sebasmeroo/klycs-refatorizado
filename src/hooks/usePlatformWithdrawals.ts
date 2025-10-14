import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FinancialIncomeService } from '@/services/financialIncome';
import { PlatformWithdrawal } from '@/types/income';
import { costMonitoring } from '@/utils/costMonitoring';

const queryKey = (userId: string | undefined) => ['platformWithdrawals', userId] as const;

export const usePlatformWithdrawals = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<PlatformWithdrawal[]> => {
      if (!userId) return [];
      costMonitoring.trackFirestoreRead(1);
      return FinancialIncomeService.getPlatformWithdrawals(userId);
    }
  });
};

export const useCreatePlatformWithdrawal = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      date: Date;
      grossAmount: number;
      commission: number;
      note?: string;
    }) => {
      if (!userId) throw new Error('Usuario no autenticado');
      costMonitoring.trackFirestoreWrite(1);
      await FinancialIncomeService.createPlatformWithdrawal(userId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(userId) });
    }
  });
};

export const useDeletePlatformWithdrawal = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (withdrawalId: string) => {
      if (!userId) throw new Error('Usuario no autenticado');
      costMonitoring.trackFirestoreWrite(1);
      await FinancialIncomeService.deletePlatformWithdrawal(userId, withdrawalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(userId) });
    }
  });
};
