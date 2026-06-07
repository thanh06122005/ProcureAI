import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import PurchaseOrders from './pages/PurchaseOrders';
import DeliveryPage from './pages/Delivery';
import Scorecard from './pages/Scorecard';
import AIRisk from './pages/AIRisk';
import { initData } from './lib/store';
import type { Page } from './lib/types';

function App() {
  const [page, setPage] = useState<Page>('dashboard');

  useEffect(() => {
    try {
      initData();
    } catch (e) {
      console.error('Failed to initialize data:', e);
    }
  }, []);

  const renderPage = () => {
    try {
      switch (page) {
        case 'dashboard':
          return <Dashboard onNavigate={setPage} />;
        case 'vendors':
          return <Vendors />;
        case 'purchase-orders':
          return <PurchaseOrders />;
        case 'delivery':
          return <DeliveryPage />;
        case 'scorecard':
          return <Scorecard />;
        case 'ai-risk':
          return <AIRisk />;
        default:
          return <Dashboard onNavigate={setPage} />;
      }
    } catch (e) {
      console.error('Failed to render page:', e);
      return (
        <div className="card p-8 text-center">
          <p className="text-red-400">Something went wrong rendering this page.</p>
          <button onClick={() => setPage('dashboard')} className="btn btn-primary mt-4">
            Return to Dashboard
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-navy-900">
      <NavBar current={page} onNavigate={setPage} />
      <div className="md:ml-[220px] pt-14 md:pt-0">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {renderPage()}
        </main>
        <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-accent-500/10 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <span>ProcureAI Supply Chain Management</span>
            <span>Data stored locally in browser</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
