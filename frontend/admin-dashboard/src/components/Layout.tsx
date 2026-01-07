import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/rules', label: 'Reglas', icon: '⚙️' },
    { path: '/transactions', label: 'Transacciones', icon: '💳' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-admin-surface border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-xl font-bold">Fraud Detection Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">María G.</span>
              <div className="w-10 h-10 rounded-full bg-admin-primary flex items-center justify-center">
                <span>MG</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-admin-surface border-b border-gray-700">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-2 py-4 px-4 border-b-2 transition-colors
                  ${
                    location.pathname === item.path
                      ? 'border-admin-primary text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  );
};

export default Layout;
