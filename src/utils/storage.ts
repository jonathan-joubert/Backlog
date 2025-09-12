// Local storage utilities for firearm applications
import { FirearmApplication, AppSettings, FirearmRecord } from '@/types/firearm';

const APPLICATIONS_KEY = 'firearm_applications';
const SETTINGS_KEY = 'app_settings';
const FIREARMS_KEY = 'firearm_records';

// Applications storage
export const saveApplications = (applications: FirearmApplication[]): void => {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
};

export const loadApplications = (): FirearmApplication[] => {
  const stored = localStorage.getItem(APPLICATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addApplication = (application: Omit<FirearmApplication, 'id' | 'createdAt'>): FirearmApplication => {
  const applications = loadApplications();
  const newApplication: FirearmApplication = {
    ...application,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  applications.push(newApplication);
  saveApplications(applications);
  return newApplication;
};

export const updateApplication = (id: string, updates: Partial<FirearmApplication>): boolean => {
  const applications = loadApplications();
  const index = applications.findIndex(app => app.id === id);
  if (index === -1) return false;
  
  applications[index] = { ...applications[index], ...updates };
  saveApplications(applications);
  return true;
};

export const deleteApplication = (id: string): boolean => {
  const applications = loadApplications();
  const filtered = applications.filter(app => app.id !== id);
  if (filtered.length === applications.length) return false;
  
  saveApplications(filtered);
  return true;
};

// Settings storage
export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): AppSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : { isDarkMode: false };
};

// Firearm records storage
export const saveFirearms = (firearms: FirearmRecord[]): void => {
  localStorage.setItem(FIREARMS_KEY, JSON.stringify(firearms));
};

export const loadFirearms = (): FirearmRecord[] => {
  const stored = localStorage.getItem(FIREARMS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addFirearm = (firearm: Omit<FirearmRecord, 'id' | 'createdAt'>): FirearmRecord => {
  const firearms = loadFirearms();
  const newFirearm: FirearmRecord = {
    ...firearm,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  firearms.push(newFirearm);
  saveFirearms(firearms);
  return newFirearm;
};

export const updateFirearm = (id: string, updates: Partial<FirearmRecord>): boolean => {
  const firearms = loadFirearms();
  const index = firearms.findIndex(firearm => firearm.id === id);
  if (index === -1) return false;
  
  firearms[index] = { ...firearms[index], ...updates };
  saveFirearms(firearms);
  return true;
};

export const deleteFirearm = (id: string): boolean => {
  const firearms = loadFirearms();
  const filtered = firearms.filter(firearm => firearm.id !== id);
  if (filtered.length === firearms.length) return false;
  
  saveFirearms(filtered);
  return true;
};