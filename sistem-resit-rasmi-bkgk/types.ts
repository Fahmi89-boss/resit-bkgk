
export type ColorTheme = 'blue' | 'red' | 'yellow';

export interface OrgSettings {
  schoolName: string;
  schoolAddress: string;
  orgName: string;
  logo: string | null;
  stamp: string | null;
  signature: string | null;
  showPaidStamp: boolean;
  theme: ColorTheme;
}

export interface ReceiptData {
  receivedFrom: string;
  amount: number;
  forPayment: string;
  date: string;
  receiptNo: string;
  treasurerName: string;
}

export interface SavedReceipt extends ReceiptData {
  id: string;
  timestamp: number;
}

export interface StorageState {
  settings: OrgSettings;
  lastReceiptNumber: number;
  lastYear: number;
  history: SavedReceipt[];
}
