
import { OrgSettings, StorageState } from '../types';

const STORAGE_KEY = 'bkgk_receipt_v1';

const DEFAULT_SETTINGS: OrgSettings = {
  schoolName: 'SEKOLAH KEBANGSAAN CONTOH',
  schoolAddress: 'Jalan Pendidikan, 43000 Kajang, Selangor Darul Ehsan',
  orgName: 'Badan Kebajikan Guru dan Kakitangan',
  logo: null,
  stamp: null,
  signature: null,
  showPaidStamp: true,
  theme: 'blue',
};

export const getStorageData = (): StorageState => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return {
      settings: DEFAULT_SETTINGS,
      lastReceiptNumber: 0,
      lastYear: new Date().getFullYear(),
      history: [],
    };
  }
  const parsed = JSON.parse(data);
  // Ensure history exists for backward compatibility
  if (!parsed.history) parsed.history = [];
  return parsed;
};

export const saveStorageData = (data: StorageState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const generateReceiptNo = (lastNo: number, lastYear: number): string => {
  const currentYear = new Date().getFullYear();
  let nextNo = lastNo + 1;
  
  if (currentYear !== lastYear) {
    nextNo = 1;
  }
  
  return `BKGK/${currentYear}/${nextNo.toString().padStart(4, '0')}`;
};
