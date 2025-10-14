import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FinancialIncomeService } from '@/services/financialIncome';
import { ExternalInvoice, InvoiceStatus } from '@/types/income';
import { costMonitoring } from '@/utils/costMonitoring';

const queryKey = (userId: string | undefined) => ['externalInvoices', userId] as const;

export const useExternalInvoices = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<ExternalInvoice[]> => {
      if (!userId) return [];
      costMonitoring.trackFirestoreRead(1);
      return FinancialIncomeService.getExternalInvoices(userId);
    }
  });
};

export const useCreateExternalInvoice = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      clientName: string;
      amount: number;
      currency: string;
      status: InvoiceStatus;
      issueDate: Date;
      dueDate?: Date;
      reference?: string;
      notes?: string;
    }) => {
      if (!userId) throw new Error('Usuario no autenticado');
      costMonitoring.trackFirestoreWrite(1);
      await FinancialIncomeService.createExternalInvoice(userId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(userId) });
    }
  });
};

export const useUpdateExternalInvoiceStatus = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) => {
      if (!userId) throw new Error('Usuario no autenticado');
      costMonitoring.trackFirestoreWrite(1);
      await FinancialIncomeService.updateExternalInvoiceStatus(userId, invoiceId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(userId) });
    }
  });
};

export const useDeleteExternalInvoice = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      if (!userId) throw new Error('Usuario no autenticado');
      costMonitoring.trackFirestoreWrite(1);
      await FinancialIncomeService.deleteExternalInvoice(userId, invoiceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(userId) });
    }
  });
};
