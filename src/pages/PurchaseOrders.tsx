import React, { useState, useMemo } from 'react';
import { Plus, Search, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { getPurchaseOrders, setPurchaseOrders, getVendors } from '../lib/store';
import type { PurchaseOrder, POItem } from '../lib/types';

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

export default function PurchaseOrders() {
  const [pos, setPosState] = useState<PurchaseOrder[]>(() => { try { return getPurchaseOrders(); } catch { return []; } });
  const [search, setSearch] = useState('');
  const [expandedPo, setExpandedPo] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    return pos.filter((p) =>
      p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(search.toLowerCase())
    );
  }, [pos, search]);

  const toggleExpand = (id: string) => {
    setExpandedPo((prev) => (prev === id ? null : id));
  };

  const addPO = (po: PurchaseOrder) => {
    const updated = [...pos, po];
    setPosState(updated);
    setPurchaseOrders(updated);
    setShowAdd(false);
  };

  const totalValue = pos.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Purchase Orders</h1>
          <p className="text-sm text-slate-400 mt-1">{pos.length} orders totaling ${totalValue.toLocaleString()}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <Plus size={16} /> New PO
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by PO number or vendor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-navy-800 border border-accent-500/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2]"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-navy-700/40">
                <th className="px-4 py-3 text-slate-400 font-medium w-8"></th>
                <th className="px-4 py-3 text-slate-400 font-medium">PO Number</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Vendor</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Order Date</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Delivery Date</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-right">Total</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((po) => (
                <React.Fragment key={po.id}>
                  <tr
                    className="border-b border-slate-700/30 hover:bg-navy-700/30 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(po.id)}
                  >
                    <td className="px-4 py-3">
                      {expandedPo === po.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </td>
                    <td className="px-4 py-3 font-mono text-accent-400">{po.poNumber}</td>
                    <td className="px-4 py-3 text-white">{po.vendorName}</td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{po.date}</td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{po.deliveryDate}</td>
                    <td className="px-4 py-3 text-right text-white font-medium">${po.total.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                  </tr>
                  {expandedPo === po.id && (
                    <tr className="bg-navy-700/20">
                      <td colSpan={7} className="px-6 py-4">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Line Items</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-500">
                              <th className="py-1 text-left">Description</th>
                              <th className="py-1 text-right">Qty</th>
                              <th className="py-1 text-right">Unit Price</th>
                              <th className="py-1 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {po.items.map((item, i) => (
                              <tr key={i} className="text-slate-300">
                                <td className="py-1">{item.description}</td>
                                <td className="py-1 text-right">{item.quantity.toLocaleString()}</td>
                                <td className="py-1 text-right">${item.unitPrice.toFixed(2)}</td>
                                <td className="py-1 text-right">${(item.quantity * item.unitPrice).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddPOModal onAdd={addPO} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddPOModal({ onAdd, onClose }: { onAdd: (po: PurchaseOrder) => void; onClose: () => void }) {
  const vendors = useMemo(() => { try { return getVendors(); } catch { return []; } }, []);
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState<POItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

  const selectedVendor = vendors.find((v) => v.id === vendorId);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof POItem, value: string | number) => {
    const updated = [...items];
    (updated[i] as any)[field] = value;
    setItems(updated);
  };

  const total = items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    const poCount = getPurchaseOrders().length;
    onAdd({
      id: `po${Date.now()}`,
      poNumber: `PO-2026-${String(poCount + 1).padStart(3, '0')}`,
      vendorId,
      vendorName: selectedVendor.name,
      date,
      deliveryDate,
      total,
      status: 'draft',
      items,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">New Purchase Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white link">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2]">
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2]" />
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} placeholder="Delivery Date" className="px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2]" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Line Items</span>
              <button type="button" onClick={addItem} className="text-sm text-accent-500 hover:text-accent-400 link">+ Add Item</button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Description" className="col-span-5 px-2 py-1.5 bg-navy-900 border border-accent-500/15 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2]" />
                <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} className="col-span-2 px-2 py-1.5 bg-navy-900 border border-accent-500/15 rounded text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2]" />
                <input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))} className="col-span-3 px-2 py-1.5 bg-navy-900 border border-accent-500/15 rounded text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2]" />
                <button type="button" onClick={() => removeItem(i)} className="col-span-2 text-slate-500 hover:text-red-400 text-sm link">Remove</button>
              </div>
            ))}
          </div>
          <div className="text-right text-sm text-slate-300 pt-2">
            Total: <span className="font-bold text-white">${total.toLocaleString()}</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1 justify-center">Create PO</button>
          </div>
        </form>
      </div>
    </div>
  );
}
