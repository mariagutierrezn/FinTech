import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RulesPage from './pages/RulesPage';
import TransactionsPage from './pages/TransactionsPage';

function App() {
  return (
    <BrowserRouter>
      <div className="dark min-h-screen bg-admin-bg text-white">
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
          </Routes>
        </Layout>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#374151',
              color: '#F9FAFB',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
