import React, { useState, useMemo } from 'react';
import { MapPin, Truck, Clock, CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import { getDeliveries } from '../lib/store';
import type { Delivery } from '../lib/types';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    'in-transit': { cls: 'badge-blue', icon: <Truck size={12} /> },
    delivered: { cls: 'badge-green', icon: <CheckCircle2 size={12} /> },
    delayed: { cls: 'badge-red', icon: <AlertTriangle size={12} /> },
    'customs-hold': { cls: 'badge-yellow', icon: <Clock size={12} /> },
  };
  const s = map[status] || { cls: 'badge-yellow', icon: <Package size={12} /> };
  return <span className={`badge ${s.cls} flex items-center gap-1`}>{s.icon} {status.replace('-', ' ')}</span>;
}

export default function DeliveryPage() {
  const deliveries = useState<Delivery[]>(() => { try { return getDeliveries(); } catch { return []; } })[0];

  const inTransit = deliveries.filter((d) => d.status === 'in-transit').length;
  const delayed = deliveries.filter((d) => d.status === 'delayed').length;
  const delivered = deliveries.filter((d) => d.status === 'delivered').length;

  return (
    <div className="space-y-6">
      <div data-tour="delivery-header">
        <h1 className="text-2xl font-bold text-white">Delivery Tracking</h1>
        <p className="text-sm text-slate-400 mt-1">Monitor shipments and delivery status</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={20} className="text-accent-500" />
            <span className="text-sm text-slate-400">In Transit</span>
          </div>
          <p className="text-2xl font-bold text-white">{inTransit}</p>
        </div>
        <div className="kpi-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-red-400" />
            <span className="text-sm text-slate-400">Delayed</span>
          </div>
          <p className="text-2xl font-bold text-white">{delayed}</p>
        </div>
        <div className="kpi-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={20} className="text-green-400" />
            <span className="text-sm text-slate-400">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-white">{delivered}</p>
        </div>
      </div>

      <div data-tour="delivery-list" className="space-y-4">
        {deliveries.map((d, i) => (
          <div key={i} className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-accent-400 font-medium">{d.poNumber}</span>
                  <StatusBadge status={d.status} />
                </div>
                <p className="text-sm text-slate-400 mt-1">{d.vendorName}</p>
              </div>
              <div className="text-sm text-slate-400">
                ETA: <span className="text-white">{d.eta}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 text-sm text-slate-300">
                <MapPin size={14} className="text-accent-500" />
                {d.origin}
              </div>
              <div className="flex-1 mx-2">
                <div className="relative">
                  <div className="h-1.5 bg-navy-700 rounded-full">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        d.status === 'delayed' ? 'bg-red-500' : d.status === 'delivered' ? 'bg-green-500' : 'bg-accent-500'
                      }`}
                      style={{ width: `${d.progress}%` }}
                    />
                  </div>
                  <div
                    className={`absolute -top-1 w-3.5 h-3.5 rounded-full border-2 transition-all duration-500 ${
                      d.status === 'delayed' ? 'bg-red-500 border-red-400' : d.status === 'delivered' ? 'bg-green-500 border-green-400' : 'bg-accent-500 border-accent-400'
                    }`}
                    style={{ left: `${d.progress}%`, transform: 'translateX(-50%)' }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-300">
                {d.destination}
                <MapPin size={14} className="text-green-400" />
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">{d.progress}% complete</div>
          </div>
        ))}
      </div>
    </div>
  );
}
