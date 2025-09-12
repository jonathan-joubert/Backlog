// TypeScript types for firearm application tracking

export type SearchMethod = 'REF_ID' | 'SERIAL_REF' | 'ID_SERIAL';

export interface FirearmApplication {
  id: string;
  applicationRefNumber: string;
  idNumber: string;
  dateApplied: string;
  createdAt: string;
  searchMethod?: SearchMethod;
  serialNumber?: string;
  gunReference?: string;
  title?: string;
}

export interface FirearmRecord {
  id: string;
  title: string;
  issueDate: string;
  section: string;
  expiryDate: string;
  make?: string;
  serialNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface FirearmStatus {
  type: string;
  number: string;
  calibre: string;
  make: string;
  status: string;
  description: string;
  nextStep: string;
  workingDaysPending: number;
  isOverdue: boolean;
}

export interface AppSettings {
  isDarkMode: boolean;
}

export type StatusFetchResult = {
  success: boolean;
  status?: FirearmStatus;
  error?: string;
};