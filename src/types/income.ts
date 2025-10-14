import { Timestamp } from 'firebase/firestore';

export type WithdrawalFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface PlatformWithdrawal {
  id: string;
  userId: string;
  date: Date;
  grossAmount: number;
  commission: number;
  netAmount: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformWithdrawalFirestore {
  userId: string;
  date: Timestamp;
  grossAmount: number;
  commission: number;
  netAmount: number;
  note?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface ExternalInvoice {
  id: string;
  userId: string;
  clientName: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate?: Date;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExternalInvoiceFirestore {
  userId: string;
  clientName: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issueDate: Timestamp;
  dueDate?: Timestamp;
  reference?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
