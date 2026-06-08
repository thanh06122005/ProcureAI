import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bell, Truck, Users, FileText } from 'lucide-react';
import type { Page } from '../lib/types';
import { getDeliveries, getVendorRatings, getPurchaseOrders } from '../lib/store';

interface NavBarProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

interface AlertItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  page: Page;
}

const links: { page: Page; label: string; emoji: string }[] = [
  { page: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { page: 'vendors', label: 'Vendors', emoji: '👥' },
  { page: 'purchase-orders', label: 'Purchase Orders', emoji: '📋' },
  { page: 'delivery', label: 'Delivery', emoji: '🚚' },
  { page: 'scorecard', label: 'Scorecard', emoji: '📈' },
  { page: 'ai-risk', label: 'AI Risk', emoji: '🛡️' },
];

function useAlerts(): AlertItem[] {
  return useMemo(() => {
    const alerts: AlertItem[] = [];
    try {
      const deliveries = getDeliveries();
      const ratings = getVendorRatings();
      const pos = getPurchaseOrders();

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      deliveries.forEach((d) => {
        if (d.status === 'delayed') {
          alerts.push({
            id: `del-${d.poNumber}`,
            icon: <Truck size={14} className="text-red-400" />,
            label: 'Overdue Delivery',
            description: `${d.poNumber} from ${d.vendorName}`,
            page: 'delivery',
          });
        }
      });

      pos.forEach((po) => {
        if (po.status === 'overdue') {
          alerts.push({
            id: `po-od-${po.id}`,
            icon: <FileText size={14} className="text-red-400" />,
            label: 'Overdue PO',
            description: `${po.poNumber} — ${po.vendorName}`,
            page: 'purchase-orders',
          });
        }
      });

      ratings.forEach((r) => {
        if (r.overall < 3) {
          alerts.push({
            id: `vr-${r.vendorId}`,
            icon: <Users size={14} className="text-yellow-400" />,
            label: 'Low Vendor Score',
            description: `Score ${r.overall.toFixed(1)}`,
            page: 'scorecard',
          });
        }
      });

      pos.forEach((po) => {
        if (po.status === 'submitted' && po.date < sevenDaysAgo) {
          alerts.push({
            id: `po-st-${po.id}`,
            icon: <FileText size={14} className="text-yellow-400" />,
            label: 'PO Stuck in Ordered',
            description: `${po.poNumber} — 7+ days`,
            page: 'purchase-orders',
          });
        }
      });
    } catch {
      // ignore
    }
    return alerts;
  }, []);
}

export default function NavBar({ current, onNavigate }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const mobileBellRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopBellRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);

  const alerts = useAlerts();
  const alertCount = alerts.length;
  const badgeText = alertCount > 9 ? '9+' : String(alertCount);

  useEffect(() => {
    if (!bellOpen) return;
    const handleClick = (e: MouseEvent) => {
      const insideMobile =
        (mobileBellRef.current?.contains(e.target as Node)) ||
        (mobileDropdownRef.current?.contains(e.target as Node));
      const insideDesktop =
        (desktopBellRef.current?.contains(e.target as Node)) ||
        (desktopDropdownRef.current?.contains(e.target as Node));
      if (!insideMobile && !insideDesktop) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [bellOpen]);

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
    setBellOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-[#0a1628] z-[200] flex items-center px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="btn btn-ghost p-2 text-white"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2 ml-3">
          <span className="text-lg font-bold text-white tracking-tight">ProcureAI</span>
        </div>
        {/* Mobile bell */}
        <div className="ml-auto relative" ref={mobileBellRef}>
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="relative p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                {badgeText}
              </span>
            )}
          </button>
        </div>
        {bellOpen && (
          <div
            ref={mobileDropdownRef}
            className="fixed top-12 right-0 w-72 max-h-80 overflow-y-auto bg-[#0f2240] border border-accent-500/15 rounded-b-lg shadow-xl shadow-black/40 z-[201] scrollbar-thin"
          >
            <AlertDropdownContent alerts={alerts} onNavigate={handleNav} />
          </div>
        )}
      </div>

      {/* Overlay for mobile — display-based, never blocks clicks when hidden */}
      <div
        className={`sidebar-overlay fixed inset-0 bg-black/50 z-[90] md:hidden ${mobileOpen ? 'sidebar-open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`sidebar-mobile fixed left-0 top-0 h-screen w-[220px] bg-[#0f2240] border-r border-accent-500/10 z-[100] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileOpen ? 'sidebar-open' : ''}`}
      >
        {/* Logo + Bell */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-accent-500/10">
          <div
            className="flex items-center gap-2.5 cursor-pointer link"
            onClick={() => handleNav('dashboard')}
          >
            <span className="text-2xl">🚛</span>
            <span className="text-xl font-bold text-white tracking-tight">ProcureAI</span>
          </div>
          <div className="relative" ref={desktopBellRef}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-navy-700/50"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                  {badgeText}
                </span>
              )}
            </button>
            {bellOpen && (
              <div
                ref={desktopDropdownRef}
                className="absolute left-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-[#0f2240] border border-accent-500/15 rounded-lg shadow-xl shadow-black/40 z-[300] scrollbar-thin"
              >
                <AlertDropdownContent alerts={alerts} onNavigate={handleNav} />
              </div>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {links.map((l) => (
            <button
              key={l.page}
              onClick={() => handleNav(l.page)}
              className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 link ${
                current === l.page ? 'sidebar-link-active' : ''
              }`}
            >
              <span className="text-lg leading-none">{l.emoji}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-accent-500/10">
          <p className="text-xs text-slate-500">ProcureAI v1.0</p>
        </div>
      </aside>
    </>
  );
}

function AlertDropdownContent({ alerts, onNavigate }: { alerts: AlertItem[]; onNavigate: (p: Page) => void }) {
  if (alerts.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-slate-500 text-sm">
        No active alerts
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Alerts
      </div>
      {alerts.map((alert) => (
        <button
          key={alert.id}
          onClick={() => onNavigate(alert.page)}
          className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-navy-700/40 transition-colors"
        >
          <span className="mt-0.5 flex-shrink-0">{alert.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{alert.label}</p>
            <p className="text-xs text-slate-400 truncate">{alert.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
