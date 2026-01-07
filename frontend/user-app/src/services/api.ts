import axios from 'axios';
import type { TransactionRequest, TransactionResponse } from '@/types/transaction';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const validateTransaction = async (
  transaction: TransactionRequest
): Promise<TransactionResponse> => {
  const response = await api.post<TransactionResponse>(
    `/api/v1/transaction/validate`,
    transaction
  );
  return response.data;
};

export default api;
