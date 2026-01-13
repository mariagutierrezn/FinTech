import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './components/ui/Card';
import { TransactionForm } from './components/TransactionForm';
import { ResultDisplay } from './components/ResultDisplay';
import { TransactionsPage } from './pages/TransactionsPage';
import { HomePage } from './pages/HomePage';
import { NavBar } from './components/NavBar';
import { validateTransaction, getUserTransactions } from './services/api';
import { useUser } from './context/UserContext';
import type { TransactionRequest, TransactionResponse, TransactionStatus } from './types/transaction';

type Page = 'home' | 'new-transaction' | 'my-transactions';
type NotificationType = 'success' | 'warning' | 'info';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  read: boolean;
}

// Helper functions para reducir complejidad
const getTransactionTypeLabel = (type: string | undefined): string => {
  if (type === 'transfer') return 'transferencia';
  if (type === 'deposit') return 'depósito';
  return 'pago';
};

function App() {
  const { userId } = useUser();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [result, setResult] = useState<TransactionResponse | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastCheckedTransactions, setLastCheckedTransactions] = useState<Set<string>>(new Set());

  const addNotification = (title: string, message: string, type: NotificationType) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      time: 'Justo ahora',
      type,
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleTransactionReview = (transaction: any, txId: string) => {
    if (!transaction.reviewedBy || lastCheckedTransactions.has(txId)) {
      return;
    }

    const amount = Math.abs(transaction.amount).toLocaleString();
    
    if (transaction.status === 'APPROVED') {
      addNotification(
        'Transacción aprobada por el banco',
        `Tu transacción de $${amount} fue aprobada por el analista.`,
        'success'
      );
    } else if (transaction.status === 'REJECTED') {
      addNotification(
        'Transacción rechazada',
        `Tu transacción de $${amount} fue rechazada por el banco.`,
        'warning'
      );
    }
    
    // Marcar como ya notificada
    setLastCheckedTransactions(prev => new Set([...prev, txId]));
    // Refrescar la página de inicio para actualizar el balance
    setHomeRefreshKey(prev => prev + 1);
  };

  // Polling para verificar actualizaciones de transacciones del admin
  useEffect(() => {
    if (!userId) return;

    const checkForUpdates = async () => {
      try {
        const transactions = await getUserTransactions(userId);
        
        // Verificar transacciones que fueron revisadas por el admin
        transactions.forEach((transaction: any) => {
          const txId = transaction.transactionId || transaction.id;
          handleTransactionReview(transaction, txId);
        });
      } catch (error) {
        console.error('Error checking for transaction updates:', error);
      }
    };

    // Verificar inmediatamente
    checkForUpdates();
    
    // Verificar cada 10 segundos
    const interval = setInterval(checkForUpdates, 10000);

    return () => clearInterval(interval);
  }, [userId, lastCheckedTransactions]);

  const handleSubmit = async (transaction: TransactionRequest) => {
    setStatus('loading');
    setError(null);
    setCurrentTransaction(transaction);

    try {
      const response = await validateTransaction(transaction);
      setResult(response);
      setStatus('success');
      
      const amount = Math.abs(transaction.amount).toLocaleString();
      const transactionTypeLabel = getTransactionTypeLabel(transaction.transactionType);
      
      // Agregar notificación según el resultado
      if (response.status === 'APPROVED') {
        addNotification(
          'Transacción aprobada',
          `Tu ${transactionTypeLabel} de $${amount} fue procesada exitosamente.`,
          'success'
        );
      } else if (response.status === 'SUSPICIOUS' || response.status === 'REJECTED') {
        addNotification(
          'Transacción requiere autenticación',
          `Tu transacción de $${amount} fue marcada como sospechosa. Por favor, confirma tu identidad.`,
          'warning'
        );
      }
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
    // Volver a home y forzar recarga
    setCurrentPage('home');
    setHomeRefreshKey(prev => prev + 1);
  };

  const renderPage = (): JSX.Element => {
    if (currentPage === 'home') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <NavBar 
            currentPage={currentPage} 
            notifications={notifications} 
            showNotifications={showNotifications}
            onPageChange={setCurrentPage}
            onToggleNotifications={() => setShowNotifications(!showNotifications)}
            onCloseNotifications={() => setShowNotifications(false)}
          />
          <HomePage key={homeRefreshKey} onNavigate={setCurrentPage} />
        </div>
      );
    }

    if (currentPage === 'my-transactions') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <NavBar 
            currentPage={currentPage} 
            notifications={notifications} 
            showNotifications={showNotifications}
            onPageChange={setCurrentPage}
            onToggleNotifications={() => setShowNotifications(!showNotifications)}
            onCloseNotifications={() => setShowNotifications(false)}
          />
          <TransactionsPage />
        </div>
      );
    }

    return renderTransactionPage();
  };

  const renderTransactionPage = (): JSX.Element => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <NavBar 
          currentPage={currentPage} 
          notifications={notifications} 
          showNotifications={showNotifications}
          onPageChange={setCurrentPage}
          onToggleNotifications={() => setShowNotifications(!showNotifications)}
          onCloseNotifications={() => setShowNotifications(false)}
        />
        
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Nueva Transferencia
              </h1>
              <p className="text-gray-600">
                Completa los datos para realizar una transacción segura
              </p>
            </motion.div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {renderTransactionContent()}
            </AnimatePresence>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center text-sm text-gray-500"
            >
              Powered by FinTech Bank v1.0
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  const renderTransactionContent = (): JSX.Element | null => {
    if (status === 'idle' || status === 'loading') {
      return (
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
      );
    }
    
    if (status === 'success' && result && currentTransaction) {
      return (
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
      );
    }
    
    if (status === 'error') {
      return (
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
      );
    }
    
    return null;
  };

  return renderPage();
}

export default App;
