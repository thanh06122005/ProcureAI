import React, { useState } from 'react';
import type { Page } from '../lib/types';

interface NavBarProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

const links: { page: Page; label: string; emoji: string }[] = [
  { page: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { page: 'vendors', label: 'Vendors', emoji: '👥' },
  { page: 'purchase-orders', label: 'Purchase Orders', emoji: '📋' },
  { page: 'delivery', label: 'Delivery', emoji: '🚚' },
  { page: 'scorecard', label: 'Scorecard', emoji: '📈' },
  { page: 'ai-risk', label: 'AI Risk', emoji: '🛡️' },
];

export default function NavBar({ current, onNavigate }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
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
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <div className="flex items-center gap-2 ml-3">
          <span className="text-lg font-bold text-white tracking-tight">ProcureAI</span>
        </div>
      </div>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[150] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[220px] bg-[#0f2240] border-r border-accent-500/10 z-[100] flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-[220px] md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-5 h-16 border-b border-accent-500/10 cursor-pointer link"
          onClick={() => handleNav('dashboard')}
        >
          <span className="text-2xl">🚛</span>
          <span className="text-xl font-bold text-white tracking-tight">ProcureAI</span>
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
