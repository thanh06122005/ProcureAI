import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface HelpGuideProps {
  currentPage: string;
  isOpen: boolean;
  onClose: () => void;
}

const pageGuides: Record<string, { title: string; steps: string[] }> = {
  dashboard: {
    title: 'Dashboard',
    steps: [
      'KPI Cards at the top show key metrics: Total Vendors, Open POs, Overdue Deliveries, and Average Vendor Score.',
      'Use the 3M / 6M / 12M buttons to filter the Monthly PO Activity chart by time range.',
      'The bar chart shows PO Count (left axis) and Total Spend in USD (right axis, orange line).',
      'The Recent Purchase Orders table at the bottom lists the latest transactions with their current status.',
    ],
  },
  vendors: {
    title: 'Vendors',
    steps: [
      'The vendor list shows all registered suppliers with their performance score.',
      "Click 'Add Vendor' to register a new supplier into the system.",
      'Click any vendor row to view details, edit information, or update their status.',
      'Vendors with a score below 60 will trigger a low-score alert in the notification bell.',
    ],
  },
  'purchase-orders': {
    title: 'Purchase Orders',
    steps: [
      'Purchase Orders (POs) track procurement requests from creation to delivery.',
      'Use the status filter to view POs by: Pending, Approved, Ordered, Shipped, Delivered, or Overdue.',
      "Click 'Create PO' to start a new purchase order and assign it to a vendor.",
      'POs stuck in the same status for 7+ days will appear as alerts in the notification bell.',
    ],
  },
  delivery: {
    title: 'Delivery',
    steps: [
      'The Delivery page tracks all active shipments and their expected arrival dates.',
      "A PO is marked Overdue when its delivery date has passed and it hasn't been delivered.",
      'Use the status badges to quickly identify which deliveries need attention.',
      'Click any row to update the delivery status or log a delay reason.',
    ],
  },
  scorecard: {
    title: 'Scorecard',
    steps: [
      'The Scorecard evaluates vendor performance across multiple criteria.',
      'Scores are calculated from on-time delivery rate, quality, and responsiveness.',
      'Vendors scoring below 60 are flagged as low-performing and trigger notifications.',
      'Use this page to make informed decisions about renewing or ending vendor contracts.',
    ],
  },
  'ai-risk': {
    title: 'AI Risk',
    steps: [
      'The AI Risk module analyzes your supply chain data to surface potential risks.',
      'Risk scores are computed automatically based on vendor behavior, delays, and PO patterns.',
      'High-risk suppliers are highlighted so you can take proactive action.',
      'Review AI recommendations regularly to prevent supply chain disruptions.',
    ],
  },
};

export default function HelpGuide({ currentPage, isOpen, onClose }: HelpGuideProps) {
  const guide = pageGuides[currentPage] ?? null;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: 390 }}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 h-full flex flex-col border-l border-blue-900/40 shadow-2xl shadow-black/60 transition-transform duration-300 ease-in-out"
        style={{
          zIndex: 400,
          width: 'min(360px, 100vw)',
          background: '#0a1628',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-blue-900/40 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Help &amp; Guide</h2>
            {guide && (
              <p className="text-xs text-blue-400 mt-0.5 font-medium">{guide.title}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close help panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
          {guide ? (
            <ol className="space-y-3">
              {guide.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 p-3 rounded-lg border-l-2 border-blue-600 bg-white/[0.03]"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-400 leading-relaxed">
              Select a page from the sidebar to see specific guidance for that section.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-blue-900/40 flex-shrink-0">
          <p className="text-xs text-slate-500 leading-relaxed">
            💡 Tip: The 🔔 bell icon in the sidebar shows real-time alerts for overdue POs, low vendor scores, and stuck orders.
          </p>
        </div>
      </div>
    </>
  );
}
