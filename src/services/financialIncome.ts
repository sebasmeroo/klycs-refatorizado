import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ExternalInvoice,
  ExternalInvoiceFirestore,
  InvoiceStatus,
  PlatformWithdrawal,
  PlatformWithdrawalFirestore
} from '@/types/income';
import { logger } from '@/utils/logger';

const withdrawalsCollection = (userId: string) =>
  collection(db, 'financial_income', userId, 'withdrawals');

const invoicesCollection = (userId: string) =>
  collection(db, 'financial_income', userId, 'invoices');

const deserializeWithdrawal = (id: string, data: PlatformWithdrawalFirestore): PlatformWithdrawal => ({
  id,
  userId: data.userId,
  date: data.date.toDate(),
  grossAmount: data.grossAmount,
  commission: data.commission,
  netAmount: data.netAmount,
  note: data.note,
  createdAt: data.createdAt.toDate(),
  updatedAt: data.updatedAt.toDate()
});

const deserializeInvoice = (id: string, data: ExternalInvoiceFirestore): ExternalInvoice => ({
  id,
  userId: data.userId,
  clientName: data.clientName,
  amount: data.amount,
  currency: data.currency,
  status: data.status,
  issueDate: data.issueDate.toDate(),
  dueDate: data.dueDate?.toDate(),
  reference: data.reference,
  notes: data.notes,
  createdAt: data.createdAt.toDate(),
  updatedAt: data.updatedAt.toDate()
});

export class FinancialIncomeService {
  static async getPlatformWithdrawals(userId: string): Promise<PlatformWithdrawal[]> {
    try {
      const snapshot = await getDocs(
        query(withdrawalsCollection(userId), orderBy('date', 'desc'))
      );
      return snapshot.docs.map(docSnap =>
        deserializeWithdrawal(docSnap.id, docSnap.data() as PlatformWithdrawalFirestore)
      );
    } catch (error) {
      logger.error('Error obteniendo retiros de plataforma', error as Error, { userId });
      throw error;
    }
  }

  static async createPlatformWithdrawal(userId: string, data: {
    date: Date;
    grossAmount: number;
    commission: number;
    note?: string;
  }): Promise<void> {
    try {
      const netAmount = data.grossAmount - data.commission;

      // ✅ Construir objeto sin campos undefined
      const withdrawalData: PlatformWithdrawalFirestore = {
        userId,
        date: Timestamp.fromDate(data.date),
        grossAmount: data.grossAmount,
        commission: data.commission,
        netAmount,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Solo agregar note si tiene valor
      if (data.note !== undefined && data.note.trim() !== '') {
        withdrawalData.note = data.note;
      }

      await addDoc(withdrawalsCollection(userId), withdrawalData);
    } catch (error) {
      logger.error('Error creando retiro de plataforma', error as Error, { userId, data });
      throw error;
    }
  }

  static async deletePlatformWithdrawal(userId: string, withdrawalId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'financial_income', userId, 'withdrawals', withdrawalId));
    } catch (error) {
      logger.error('Error eliminando retiro de plataforma', error as Error, { userId, withdrawalId });
      throw error;
    }
  }

  static async getExternalInvoices(userId: string): Promise<ExternalInvoice[]> {
    try {
      const snapshot = await getDocs(
        query(invoicesCollection(userId), orderBy('issueDate', 'desc'))
      );
      return snapshot.docs.map(docSnap =>
        deserializeInvoice(docSnap.id, docSnap.data() as ExternalInvoiceFirestore)
      );
    } catch (error) {
      logger.error('Error obteniendo facturas externas', error as Error, { userId });
      throw error;
    }
  }

  static async createExternalInvoice(userId: string, data: {
    clientName: string;
    amount: number;
    currency: string;
    status: InvoiceStatus;
    issueDate: Date;
    dueDate?: Date;
    reference?: string;
    notes?: string;
  }): Promise<void> {
    try {
      // ✅ Construir objeto sin campos undefined
      const invoiceData: ExternalInvoiceFirestore = {
        userId,
        clientName: data.clientName,
        amount: data.amount,
        currency: data.currency.toUpperCase(),
        status: data.status,
        issueDate: Timestamp.fromDate(data.issueDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Solo agregar campos opcionales si tienen valor
      if (data.dueDate) {
        invoiceData.dueDate = Timestamp.fromDate(data.dueDate);
      }
      if (data.reference !== undefined && data.reference.trim() !== '') {
        invoiceData.reference = data.reference;
      }
      if (data.notes !== undefined && data.notes.trim() !== '') {
        invoiceData.notes = data.notes;
      }

      await addDoc(invoicesCollection(userId), invoiceData);
    } catch (error) {
      logger.error('Error creando factura externa', error as Error, { userId, data });
      throw error;
    }
  }

  static async updateExternalInvoiceStatus(userId: string, invoiceId: string, status: InvoiceStatus): Promise<void> {
    try {
      await updateDoc(doc(db, 'financial_income', userId, 'invoices', invoiceId), {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      logger.error('Error actualizando estado de factura', error as Error, { userId, invoiceId });
      throw error;
    }
  }

  static async deleteExternalInvoice(userId: string, invoiceId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'financial_income', userId, 'invoices', invoiceId));
    } catch (error) {
      logger.error('Error eliminando factura externa', error as Error, { userId, invoiceId });
      throw error;
    }
  }
}
