import axios from 'axios';
import type { Rule, Transaction, Metrics } from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Analyst-ID': import.meta.env.VITE_ANALYST_ID || 'analyst_demo',
  },
});

// Rules
export const getRules = async (): Promise<Rule[]> => {
  const response = await api.get('/api/v1/admin/rules');
  return response.data;
};

export const updateRule = async (ruleId: string, parameters: any): Promise<any> => {
  const response = await api.put(`/api/v1/admin/rules/${ruleId}`, { parameters });
  return response.data;
};

export const reorderRules = async (ruleIds: string[]): Promise<any> => {
  const response = await api.post('/api/v1/admin/rules/reorder', { ruleIds });
  return response.data;
};

// Transactions
export const getTransactionsLog = async (
  status?: string,
  limit: number = 100
): Promise<Transaction[]> => {
  const params: any = { limit };
  if (status) params.status = status;
  const response = await api.get('/api/v1/admin/transactions/log', { params });
  return response.data;
};

export const reviewTransaction = async (
  transactionId: string,
  decision: 'APPROVED' | 'REJECTED',
  comment?: string
): Promise<any> => {
  const response = await api.put(`/api/v1/transaction/review/${transactionId}`, {
    decision,
    analyst_comment: comment,
  });
  return response.data;
};

// Metrics
export const getMetrics = async (): Promise<Metrics> => {
  const response = await api.get('/api/v1/admin/metrics');
  return response.data;
};

export default api;
