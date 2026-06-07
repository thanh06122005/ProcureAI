import React, { useMemo, useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Users, FileText, AlertTriangle, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { getVendors, getPurchaseOrders, getVendorRatings, getDeliveries } from '../lib/store';
import type { Page } from '../lib/types';

function useAnimatedCounter(target: number, duration = 1500): string {
  const [display, setDisplay] = useState(target === 0 ? '0' : '0');

  useEffect(() => {
    if (target === 0) {
      setDisplay('0');
      return;
    }

    const isFloat = String(target).includes('.');
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      if (isFloat) {
        setDisplay(current.toFixed(1));
      } else {
        setDisplay(String(Math.round(current)));
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [target, duration]);

  return display;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    delivered: 'badge-green',
    approved: 'badge-blue',
    shipped: 'badge-blue',
    submitted: 'badge-yellow',
    overdue: 'badge-red',
    draft: 'badge-yellow',
    cancelled: 'badge-red',
  };
  return <span className={`badge ${map[status] || 'badge-yellow'}`}>{status.replace('-', ' ')}</span>;
}

const GRADIENT_COLORS: Record<string, string> = {
  'Total Vendors': 'from-blue-400 to-blue-600',
  'Open Purchase Orders': 'from-green-400 to-green-600',
  'Overdue Deliveries': 'from-red-400 to-red-600',
  'Avg Vendor Score': 'from-orange-400 to-orange-600',
};

const TREND_DATA: Record<string, { direction: 'up' | 'down'; pct: string }> = {
  'Total Vendors': { direction: 'up', pct: '12%' },
  'Open Purchase Orders': { direction: 'up', pct: '8%' },
  'Overdue Deliveries': { direction: 'down', pct: '3%' },
  'Avg Vendor Score': { direction: 'up', pct: '5%' },
};

function KPICard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const animated = useAnimatedCounter(numericValue);
  const gradientCls = GRADIENT_COLORS[label] || 'from-blue-400 to-blue-600';
  const trend = TREND_DATA[label];

  return (
    <div className="kpi-card p-5 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradientCls}`} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400 font-medium">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-white">{numericValue === 0 ? '0' : animated}</p>
        {trend && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 pb-1 ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.pct}
          </span>
        )}
      </div>
    </div>
  );
}

type RangeOption = 3 | 6 | 12;

function RangeButton({ months, current, onSelect }: { months: RangeOption; current: RangeOption; onSelect: (r: RangeOption) => void }) {
  return (
    <button
      onClick={() => onSelect(months)}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
        current === months
          ? 'bg-accent-500 text-white shadow-md shadow-accent-500/25'
          : 'bg-navy-700/60 text-slate-400 hover:text-white hover:bg-navy-700'
      }`}
    >
      {months}M
    </button>
  );
}

export default function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const vendors = useMemo(() => { try { return getVendors(); } catch { return []; } }, []);
  const pos = useMemo(() => { try { return getPurchaseOrders(); } catch { return []; } }, []);
  const ratings = useMemo(() => { try { return getVendorRatings(); } catch { return []; } }, []);
  const deliveries = useMemo(() => { try { return getDeliveries(); } catch { return []; } }, []);

  const [range, setRange] = useState<RangeOption>(6);
  const [chartReady, setChartReady] = useState(false);
  const [chartError, setChartError] = useState(false);

  useEffect(() => {
    const initChart = () => {
      try {
        if (typeof ChartJS !== 'undefined' && ChartJS.register) {
          ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);
          setChartReady(true);
        } else {
          setChartError(true);
        }
      } catch {
        setChartError(true);
      }
    };

    if (document.readyState === 'complete') {
      initChart();
    } else {
      window.addEventListener('load', initChart);
      return () => window.removeEventListener('load', initChart);
    }
  }, []);

  const openPOs = pos.filter((p) => ['submitted', 'approved', 'shipped'].includes(p.status)).length;
  const overdueDeliveries = pos.filter((p) => p.status === 'overdue').length + deliveries.filter((d) => d.status === 'delayed').length;
  const avgScore = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.overall, 0) / ratings.length).toFixed(1) : '0.0';

  const kpis = [
    { label: 'Total Vendors', value: vendors.length, icon: <Users size={24} />, color: 'text-accent-500' },
    { label: 'Open Purchase Orders', value: openPOs, icon: <FileText size={24} />, color: 'text-green-400' },
    { label: 'Overdue Deliveries', value: overdueDeliveries, icon: <AlertTriangle size={24} />, color: 'text-red-400' },
    { label: 'Avg Vendor Score', value: avgScore, icon: <Star size={24} />, color: 'text-yellow-400' },
  ];

  const monthlyData = useMemo(() => {
    const now = new Date();
    const allMonthsInRange: { key: string; label: string }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en', { month: 'short' });
      allMonthsInRange.push({ key, label });
    }

    const availableMonths = allMonthsInRange.filter((m) =>
      pos.some((p) => p.date.startsWith(m.key))
    );

    const showingPartial = availableMonths.length < range;
    const displayMonths = availableMonths.length > 0 ? availableMonths : allMonthsInRange.slice(-3);

    const counts = displayMonths.map((m) => pos.filter((p) => p.date.startsWith(m.key)).length);
    const spend = displayMonths.map((m) =>
      pos.filter((p) => p.date.startsWith(m.key)).reduce((s, p) => s + p.total, 0)
    );

    return { labels: displayMonths.map((m) => m.label), counts, spend, showingPartial };
  }, [pos, range]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData: any = useMemo(
    () => ({
      labels: monthlyData.labels,
      datasets: [
        {
          label: 'PO Count',
          data: monthlyData.counts,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          label: 'Total Spend',
          type: 'line',
          data: monthlyData.spend,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          pointBackgroundColor: '#f97316',
          pointBorderColor: '#f97316',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          yAxisID: 'y1',
        },
      ],
    }),
    [monthlyData]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartOptions: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: { color: '#94a3b8', usePointStyle: true, padding: 16 },
        },
        title: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const label = ctx.dataset?.label || '';
              if (label === 'PO Count') {
                return `PO Count: ${ctx.parsed?.y ?? 0}`;
              }
              return `Total Spend: $${(ctx.parsed?.y ?? 0).toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(59, 130, 246, 0.08)' },
        },
        y: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          ticks: { color: '#94a3b8', stepSize: 2 },
          grid: { color: 'rgba(59, 130, 246, 0.08)' },
          title: { display: true, text: 'PO Count', color: '#94a3b8' },
        },
        y1: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          ticks: {
            color: '#f97316',
            callback: (value: any) =>
              `$${(typeof value === 'number' ? value : Number(value) / 1000).toLocaleString()}`,
          },
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Total Spend', color: '#f97316' },
        },
      },
    }),
    []
  );

  const recentPOs = pos.slice(0, 5);

  let chartSection: React.ReactNode;
  if (chartError || !chartReady) {
    chartSection = (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-2 text-slate-400 font-medium">Month</th>
              <th className="px-4 py-2 text-slate-400 font-medium text-right">PO Count</th>
              <th className="px-4 py-2 text-slate-400 font-medium text-right">Total Spend</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.labels.map((label, i) => (
              <tr key={label} className="border-b border-slate-700/30">
                <td className="px-4 py-2 text-slate-300">{label}</td>
                <td className="px-4 py-2 text-right text-white">{monthlyData.counts[i]}</td>
                <td className="px-4 py-2 text-right text-white">${monthlyData.spend[i].toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {chartError && (
          <p className="text-xs text-slate-500 mt-2">Chart unavailable; showing data as table.</p>
        )}
      </div>
    );
  } else {
    try {
      chartSection = (
        <div style={{ height: 300 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      );
    } catch {
      chartSection = (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-2 text-slate-400 font-medium">Month</th>
                <th className="px-4 py-2 text-slate-400 font-medium text-right">PO Count</th>
                <th className="px-4 py-2 text-slate-400 font-medium text-right">Total Spend</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.labels.map((label, i) => (
                <tr key={label} className="border-b border-slate-700/30">
                  <td className="px-4 py-2 text-slate-300">{label}</td>
                  <td className="px-4 py-2 text-right text-white">{monthlyData.counts[i]}</td>
                  <td className="px-4 py-2 text-right text-white">${monthlyData.spend[i].toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Supply chain overview and key metrics</p>
        </div>
        <span className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} color={kpi.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Monthly PO Activity</h2>
            <div className="flex gap-1.5">
              <RangeButton months={3} current={range} onSelect={setRange} />
              <RangeButton months={6} current={range} onSelect={setRange} />
              <RangeButton months={12} current={range} onSelect={setRange} />
            </div>
          </div>
          {chartSection}
          {monthlyData.showingPartial && (
            <p className="text-xs text-slate-500 mt-3 italic">Showing available data only</p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button onClick={() => onNavigate('vendors')} className="btn btn-primary w-full justify-center">
              <Users size={16} /> Manage Vendors
            </button>
            <button onClick={() => onNavigate('purchase-orders')} className="btn btn-ghost w-full justify-center">
              <FileText size={16} /> Create PO
            </button>
            <button onClick={() => onNavigate('delivery')} className="btn btn-ghost w-full justify-center">
              <AlertTriangle size={16} /> Track Deliveries
            </button>
            <button onClick={() => onNavigate('ai-risk')} className="btn btn-ghost w-full justify-center">
              <AlertTriangle size={16} /> View Risk Alerts
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Purchase Orders</h2>
          <button onClick={() => onNavigate('purchase-orders')} className="text-sm text-accent-500 hover:text-accent-400 link font-medium">
            View all
          </button>
        </div>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-3 text-slate-400 font-medium">PO Number</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Vendor</th>
              <th className="px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">Date</th>
              <th className="px-4 py-3 text-slate-400 font-medium text-right">Total</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentPOs.map((po) => (
              <tr key={po.id} className="border-b border-slate-700/30 hover:bg-navy-700/30 transition-colors">
                <td className="px-4 py-3 font-mono text-accent-400">{po.poNumber}</td>
                <td className="px-4 py-3 text-white">{po.vendorName}</td>
                <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{po.date}</td>
                <td className="px-4 py-3 text-right text-white font-medium">${po.total.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
