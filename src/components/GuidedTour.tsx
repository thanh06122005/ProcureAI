import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  currentPage: string;
  isRunning: boolean;
  onClose: () => void;
}

const tourSteps: Record<string, TourStep[]> = {
  dashboard: [
    {
      target: 'kpi-cards',
      title: 'KPI Overview',
      description:
        '4 cards showing your key metrics: Total Vendors, Open POs, Overdue Deliveries, and Average Vendor Score. Values animate when data loads.',
      position: 'bottom',
    },
    {
      target: 'chart-range',
      title: 'Time Range Filter',
      description: 'Switch between 3M, 6M, and 12M to filter the activity chart below.',
      position: 'bottom',
    },
    {
      target: 'chart-panel',
      title: 'Monthly PO Activity',
      description:
        'Bars show PO Count (left axis). The orange line shows Total Spend in USD (right axis).',
      position: 'top',
    },
    {
      target: 'recent-orders',
      title: 'Recent Purchase Orders',
      description:
        'Your latest POs with status badges. Colors indicate: blue = Ordered, yellow = Pending, green = Delivered, red = Overdue.',
      position: 'top',
    },
  ],
  vendors: [
    {
      target: 'vendors-header',
      title: 'Vendor Management',
      description:
        'All your registered suppliers are listed here with their performance score.',
      position: 'bottom',
    },
    {
      target: 'add-vendor-btn',
      title: 'Add a New Vendor',
      description:
        "Click here to register a new supplier. Fill in their name, category, and contact details.",
      position: 'bottom',
    },
    {
      target: 'vendor-list',
      title: 'Vendor List',
      description:
        'Click any row to view full details, edit info, or update performance scores. Vendors below 60 trigger a bell alert.',
      position: 'top',
    },
  ],
  'purchase-orders': [
    {
      target: 'po-header',
      title: 'Purchase Orders',
      description: 'Track every procurement request from creation through delivery.',
      position: 'bottom',
    },
    {
      target: 'po-status-filter',
      title: 'Status Filter',
      description:
        'Filter POs by status: Pending, Approved, Ordered, Shipped, Delivered, Overdue.',
      position: 'bottom',
    },
    {
      target: 'create-po-btn',
      title: 'Create a PO',
      description:
        'Start a new purchase order here. Select a vendor, add line items, and set an expected delivery date.',
      position: 'bottom',
    },
    {
      target: 'po-list',
      title: 'PO List',
      description:
        'POs stuck in the same status for 7+ days are flagged automatically in the notification bell.',
      position: 'top',
    },
  ],
  delivery: [
    {
      target: 'delivery-header',
      title: 'Delivery Tracking',
      description: 'Monitor all active shipments and their expected arrival dates.',
      position: 'bottom',
    },
    {
      target: 'delivery-list',
      title: 'Shipment List',
      description:
        'Red rows are overdue — delivery date has passed with no confirmation. Click a row to update status or log a delay.',
      position: 'top',
    },
  ],
  scorecard: [
    {
      target: 'scorecard-header',
      title: 'Vendor Scorecard',
      description:
        'Performance scores calculated from on-time delivery, quality, and responsiveness.',
      position: 'bottom',
    },
    {
      target: 'scorecard-list',
      title: 'Score Breakdown',
      description:
        'Vendors below 60 are flagged as low-performing. Use this to decide on contract renewals.',
      position: 'top',
    },
  ],
  'ai-risk': [
    {
      target: 'ai-risk-header',
      title: 'AI Risk Analysis',
      description:
        'Machine learning analyzes your supply chain data to surface hidden risks.',
      position: 'bottom',
    },
    {
      target: 'ai-risk-list',
      title: 'Risk Scores',
      description:
        'High-risk suppliers are ranked at the top. Review AI recommendations to prevent disruptions before they happen.',
      position: 'top',
    },
  ],
};

const PAD = 8; // px padding around highlight box

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPos {
  top: number;
  left: number;
  arrowSide: 'top' | 'bottom' | 'left' | 'right';
}

function computeTooltip(
  rect: HighlightRect,
  position: 'top' | 'bottom' | 'left' | 'right',
  tooltipW: number,
  tooltipH: number,
): TooltipPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 12;

  let top: number;
  let left: number;
  let arrowSide: TooltipPos['arrowSide'];

  // Prefer requested position, fallback if not enough space
  const spaceBelow = vh - (rect.top + rect.height + PAD);
  const spaceAbove = rect.top - PAD;
  const spaceRight = vw - (rect.left + rect.width + PAD);
  const spaceLeft = rect.left - PAD;

  let resolvedPos = position;
  if (position === 'bottom' && spaceBelow < tooltipH + margin && spaceAbove > spaceBelow) {
    resolvedPos = 'top';
  } else if (position === 'top' && spaceAbove < tooltipH + margin && spaceBelow > spaceAbove) {
    resolvedPos = 'bottom';
  } else if (position === 'right' && spaceRight < tooltipW + margin && spaceLeft > spaceRight) {
    resolvedPos = 'left';
  } else if (position === 'left' && spaceLeft < tooltipW + margin && spaceRight > spaceLeft) {
    resolvedPos = 'right';
  }

  if (resolvedPos === 'bottom') {
    top = rect.top + rect.height + PAD + margin;
    left = rect.left + rect.width / 2 - tooltipW / 2;
    arrowSide = 'top';
  } else if (resolvedPos === 'top') {
    top = rect.top - PAD - margin - tooltipH;
    left = rect.left + rect.width / 2 - tooltipW / 2;
    arrowSide = 'bottom';
  } else if (resolvedPos === 'right') {
    top = rect.top + rect.height / 2 - tooltipH / 2;
    left = rect.left + rect.width + PAD + margin;
    arrowSide = 'left';
  } else {
    top = rect.top + rect.height / 2 - tooltipH / 2;
    left = rect.left - PAD - margin - tooltipW;
    arrowSide = 'right';
  }

  // Clamp horizontally
  left = Math.max(margin, Math.min(left, vw - tooltipW - margin));
  // Clamp vertically
  top = Math.max(margin, Math.min(top, vh - tooltipH - margin));

  return { top, left, arrowSide };
}

export default function GuidedTour({ currentPage, isRunning, onClose }: GuidedTourProps) {
  const steps = tourSteps[currentPage] ?? [];
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[stepIndex] ?? null;

  const positionStep = useCallback(() => {
    if (!currentStep) return;

    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (!el) {
      // skip missing elements
      setStepIndex((i) => {
        const next = i + 1;
        if (next >= steps.length) { onClose(); return i; }
        return next;
      });
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Wait a tick for scroll to settle before measuring
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const rect: HighlightRect = {
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      };
      setHighlight(rect);

      // Measure tooltip size from DOM (approximate if not yet rendered)
      const tw = tooltipRef.current?.offsetWidth ?? 320;
      const th = tooltipRef.current?.offsetHeight ?? 180;
      const pos = computeTooltip(rect, currentStep.position ?? 'bottom', tw, th);
      setTooltipPos(pos);
    });
  }, [currentStep, steps.length, onClose]);

  // Re-position whenever step changes or tour starts
  useEffect(() => {
    if (!isRunning || !currentStep) return;
    positionStep();
  }, [isRunning, stepIndex, positionStep, currentStep]);

  // Reset step when page or running state changes
  useEffect(() => {
    setStepIndex(0);
    setHighlight(null);
    setTooltipPos(null);
  }, [currentPage, isRunning]);

  // Re-measure on window resize
  useEffect(() => {
    if (!isRunning) return;
    const onResize = () => positionStep();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isRunning, positionStep]);

  const goNext = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      onClose();
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex, steps.length, onClose]);

  const goPrev = useCallback(() => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }, [stepIndex]);

  if (!isRunning || !currentStep || steps.length === 0) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <>
      {/* Highlight box — creates the cutout overlay via box-shadow */}
      {highlight && (
        <div
          style={{
            position: 'fixed',
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
            border: '2px solid rgba(59,130,246,0.8)',
            borderRadius: '10px',
            zIndex: 500,
            pointerEvents: 'none',
            transition: 'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease',
          }}
        />
      )}

      {/* Tooltip card */}
      {tooltipPos && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 501,
            width: 'min(320px, calc(100vw - 24px))',
            transition: 'top 0.25s ease, left 0.25s ease',
          }}
        >
          {/* Arrow */}
          <Arrow side={tooltipPos.arrowSide} />

          <div
            style={{
              background: '#0f2244',
              border: '1px solid rgba(59,130,246,0.4)',
              borderRadius: '12px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              padding: '16px',
            }}
          >
            {/* Step counter */}
            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  background: 'rgba(59,130,246,0.2)',
                  color: '#60a5fa',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                Step {stepIndex + 1} of {steps.length}
              </span>
            </div>

            {/* Title */}
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
              {currentStep.title}
            </p>

            {/* Description */}
            <p style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.6, marginBottom: '14px' }}>
              {currentStep.description}
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Skip */}
              <button
                onClick={onClose}
                style={{
                  marginRight: 'auto',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '4px 2px',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#94a3b8'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#64748b'; }}
              >
                Skip
              </button>

              {/* Prev */}
              <button
                onClick={goPrev}
                disabled={isFirst}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148,163,184,0.25)',
                  background: 'transparent',
                  color: isFirst ? '#334155' : '#94a3b8',
                  fontSize: '13px',
                  cursor: isFirst ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>

              {/* Next / Finish */}
              <button
                onClick={goNext}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#3b82f6'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = '#2563eb'; }}
              >
                {isLast ? 'Finish' : 'Next'} {!isLast && <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close button (top-right escape hatch) */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          zIndex: 502,
          background: 'rgba(15,34,68,0.9)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: '8px',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Close tour"
      >
        <X size={16} />
      </button>
    </>
  );
}

function Arrow({ side }: { side: 'top' | 'bottom' | 'left' | 'right' }) {
  const size = 8;
  const color = 'rgba(59,130,246,0.4)';
  const fill = '#0f2244';

  const style: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    pointerEvents: 'none',
  };

  if (side === 'top') {
    return (
      <div
        style={{
          ...style,
          top: -size,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${size}px solid transparent`,
          borderRight: `${size}px solid transparent`,
          borderBottom: `${size}px solid ${color}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: -size + 1,
            borderLeft: `${size - 1}px solid transparent`,
            borderRight: `${size - 1}px solid transparent`,
            borderBottom: `${size - 1}px solid ${fill}`,
          }}
        />
      </div>
    );
  }

  if (side === 'bottom') {
    return (
      <div
        style={{
          ...style,
          bottom: -size,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${size}px solid transparent`,
          borderRight: `${size}px solid transparent`,
          borderTop: `${size}px solid ${color}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 2,
            left: -size + 1,
            borderLeft: `${size - 1}px solid transparent`,
            borderRight: `${size - 1}px solid transparent`,
            borderTop: `${size - 1}px solid ${fill}`,
          }}
        />
      </div>
    );
  }

  if (side === 'left') {
    return (
      <div
        style={{
          ...style,
          left: -size,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${size}px solid transparent`,
          borderBottom: `${size}px solid transparent`,
          borderRight: `${size}px solid ${color}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 2,
            top: -size + 1,
            borderTop: `${size - 1}px solid transparent`,
            borderBottom: `${size - 1}px solid transparent`,
            borderRight: `${size - 1}px solid ${fill}`,
          }}
        />
      </div>
    );
  }

  // right
  return (
    <div
      style={{
        ...style,
        right: -size,
        top: '50%',
        transform: 'translateY(-50%)',
        borderTop: `${size}px solid transparent`,
        borderBottom: `${size}px solid transparent`,
        borderLeft: `${size}px solid ${color}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: 2,
          top: -size + 1,
          borderTop: `${size - 1}px solid transparent`,
          borderBottom: `${size - 1}px solid transparent`,
          borderLeft: `${size - 1}px solid ${fill}`,
        }}
      />
    </div>
  );
}
