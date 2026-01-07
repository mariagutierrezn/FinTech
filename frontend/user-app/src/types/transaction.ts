export interface TransactionRequest {
  amount: number;
  userId: string;
  location: string;
  deviceId: string;
}

export interface TransactionResponse {
  status: 'APPROVED' | 'SUSPICIOUS' | 'REJECTED';
  riskScore: number;
  violations: string[];
}

export type TransactionStatus = 'idle' | 'loading' | 'success' | 'error';
