import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './components/ui/Card';
import { TransactionForm } from './components/TransactionForm';
import { ResultDisplay } from './components/ResultDisplay';
import { validateTransaction } from './services/api';
import type { TransactionRequest, TransactionResponse, TransactionStatus } from './types/transaction';

function App() {
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [result, setResult] = useState<TransactionResponse | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (transaction: TransactionRequest) => {
    setStatus('loading');
    setError(null);
    setCurrentTransaction(transaction);

    try {
      const response = await validateTransaction(transaction);
      setResult(response);
      setStatus('success');
    } catch (err) {
      setError('Ocurrió un error al procesar tu transacción. Por favor, intenta de nuevo.');
      setStatus('error');
      console.error('Error:', err);
    }
  };

  const handleNewTransaction = () => {
    setStatus('idle');
    setResult(null);
    setCurrentTransaction(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏦 SecureBank Transfer
          </h1>
          <p className="text-gray-600">
            Sistema de detección de fraude en tiempo real
          </p>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {status === 'idle' || status === 'loading' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Realizar una Transferencia
                </h2>
                <TransactionForm onSubmit={handleSubmit} isLoading={status === 'loading'} />
              </Card>
            </motion.div>
          ) : status === 'success' && result && currentTransaction ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <ResultDisplay
                result={result}
                transaction={currentTransaction}
                onNewTransaction={handleNewTransaction}
              />
            </motion.div>
          ) : status === 'error' ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-4xl text-red-600">⚠</span>
                  </div>
                  <h2 className="text-xl font-bold text-red-700">Error</h2>
                  <p className="text-gray-600">{error}</p>
                  <button
                    onClick={handleNewTransaction}
                    className="w-full py-3 bg-user-primary text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Intentar de Nuevo
                  </button>
                </div>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          Powered by Fraud Detection Engine v1.0
        </motion.div>
      </div>
    </div>
  );
}

export default App;
