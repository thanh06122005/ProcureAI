import React, { useMemo, useState } from 'react';
import { Shield, AlertTriangle, AlertCircle, Info, CheckCircle2, Filter } from 'lucide-react';
import { getRiskAlerts, setRiskAlerts, getVendors } from '../lib/store';
import type { RiskAlert } from '../lib/types';

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    low: { cls: 'badge-green', icon: <Info size={12} /> },
    medium: { cls: 'badge-yellow', icon: <AlertCircle size={12} /> },
    high: { cls: 'badge-red', icon: <AlertTriangle size={12} /> },
    critical: { cls: 'badge-red', icon: <AlertTriangle size={12} /> },
  };
  const s = map[severity] || map.low;
  return <span className={`badge ${s.cls} flex items-center gap-1`}>{s.icon} {severity}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    supply: 'badge-blue',
    financial: 'badge-yellow',
    compliance: 'badge-green',
    geopolitical: 'badge-red',
    quality: 'badge-yellow',
  };
  return <span className={`badge ${map[type] || 'badge-yellow'}`}>{type}</span>;
}

export default function AIRisk() {
  const [alerts, setAlerts] = useState<RiskAlert[]>(() => { try { return getRiskAlerts(); } catch { return []; } });
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const vendors = useMemo(() => { try { return getVendors(); } catch { return []; } }, []);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      const matchSev = filterSeverity === 'all' || a.severity === filterSeverity;
      const matchType = filterType === 'all' || a.type === filterType;
      return matchSev && matchType;
    });
  }, [alerts, filterSeverity, filterType]);

  const types = useMemo(() => ['all', ...Array.from(new Set(alerts.map((a) => a.type)))], [alerts]);
  const severities = ['all', 'low', 'medium', 'high', 'critical'];

  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.resolved).length;
  const highCount = alerts.filter((a) => a.severity === 'high' && !a.resolved).length;
  const unresolvedCount = alerts.filter((a) => !a.resolved).length;

  const resolveAlert = (id: string) => {
    const updated = alerts.map((a) => a.id === id ? { ...a, resolved: true } : a);
    setAlerts(updated);
    setRiskAlerts(updated);
  };

  const vendorRiskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.filter((a) => !a.resolved).forEach((a) => {
      counts[a.vendorName] = (counts[a.vendorName] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [alerts]);

  return (
    <div className="space-y-6">
      <div data-tour="ai-risk-header">
        <h1 className="text-2xl font-bold text-white">AI Risk Monitor</h1>
        <p className="text-sm text-slate-400 mt-1">Automated risk detection and vendor intelligence</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card p-5 border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-red-400" />
            <span className="text-sm text-slate-400">Critical</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
        </div>
        <div className="kpi-card p-5 border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={20} className="text-yellow-400" />
            <span className="text-sm text-slate-400">High Severity</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{highCount}</p>
        </div>
        <div className="kpi-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={20} className="text-accent-500" />
            <span className="text-sm text-slate-400">Unresolved</span>
          </div>
          <p className="text-2xl font-bold text-white">{unresolvedCount}</p>
        </div>
      </div>

      {vendorRiskCounts.length > 0 && (
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Risk Concentration</h2>
          <div className="space-y-3">
            {vendorRiskCounts.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-sm text-slate-300 w-48 truncate">{name}</span>
                <div className="flex-1 bg-navy-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${count > 2 ? 'bg-red-500' : count > 1 ? 'bg-yellow-500' : 'bg-accent-500'}`}
                    style={{ width: `${(count / (vendorRiskCounts[0][1] || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-slate-400 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-navy-800 border border-accent-500/15 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-accent-500/40 relative z-[2]"
          >
            {severities.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Severities' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-navy-800 border border-accent-500/15 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-accent-500/40 relative z-[2]"
          >
            {types.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div data-tour="ai-risk-list" className="space-y-3">
        {filtered.map((alert) => (
          <div key={alert.id} className={`card p-5 ${alert.resolved ? 'opacity-60' : ''} ${alert.severity === 'critical' ? 'border-red-500/30' : alert.severity === 'high' ? 'border-yellow-500/20' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <SeverityBadge severity={alert.severity} />
                  <TypeBadge type={alert.type} />
                  {alert.resolved && (
                    <span className="badge badge-green flex items-center gap-1"><CheckCircle2 size={12} /> Resolved</span>
                  )}
                </div>
                <h3 className="font-semibold text-white mb-1">{alert.title}</h3>
                <p className="text-sm text-slate-400 mb-2">{alert.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Vendor: <span className="text-slate-300">{alert.vendorName}</span></span>
                  <span>Detected: <span className="text-slate-300">{alert.date}</span></span>
                </div>
              </div>
              {!alert.resolved && (
                <button onClick={() => resolveAlert(alert.id)} className="btn btn-ghost text-sm whitespace-nowrap">
                  <CheckCircle2 size={14} /> Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-8 text-center text-slate-400">
            <Shield size={32} className="mx-auto mb-3 text-slate-600" />
            <p>No risk alerts match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
