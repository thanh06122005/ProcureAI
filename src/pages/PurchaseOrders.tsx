import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Eye, FileText, AlertCircle, Calendar, Building2, Calculator } from 'lucide-react';
import { getPurchaseOrders, setPurchaseOrders, getVendors } from '../lib/store';
import type { PurchaseOrder, POItem, Vendor } from '../lib/types';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    delivered: { cls: 'badge-green', label: 'Delivered' },
    approved: { cls: 'badge-blue', label: 'Approved' },
    shipped: { cls: 'badge-blue', label: 'Shipped' },
    submitted: { cls: 'badge-yellow', label: 'Ordered' },
    overdue: { cls: 'badge-red', label: 'Overdue' },
    draft: { cls: 'badge-yellow', label: 'Draft' },
    cancelled: { cls: 'badge-red', label: 'Cancelled' },
  };
  const s = map[status] || { cls: 'badge-yellow', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function generatePONumber(existingPOs: PurchaseOrder[]): string {
  const currentYear = new Date().getFullYear();
  const prefix = `PO-${currentYear}-`;

  // Find max sequence for current year
  const maxSeq = existingPOs.reduce((max, po) => {
    if (po.poNumber.startsWith(prefix)) {
      const seqStr = po.poNumber.replace(prefix, '');
      const seq = parseInt(seqStr, 10);
      return !isNaN(seq) && seq > max ? seq : max;
    }
    return max;
  }, 0);

  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export default function PurchaseOrders() {
  const [pos, setPosState] = useState<PurchaseOrder[]>(() => {
    try { return getPurchaseOrders(); } catch { return []; }
  });
  const [vendors, setVendorsState] = useState<Vendor[]>(() => {
    try { return getVendors(); } catch { return []; }
  });
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [deletingPO, setDeletingPO] = useState<PurchaseOrder | null>(null);

  // Refresh data on focus
  useEffect(() => {
    const refresh = () => {
      setPosState(getPurchaseOrders());
      setVendorsState(getVendors());
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const totalValue = pos.reduce((s, p) => s + p.total, 0);

  const deletePO = (id: string) => {
    const updated = pos.filter((p) => p.id !== id);
    setPosState(updated);
    setPurchaseOrders(updated);
    setDeletingPO(null);
  };

  const addPO = (po: PurchaseOrder) => {
    const updated = [...pos, po];
    setPosState(updated);
    setPurchaseOrders(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={24} className="text-accent-500" /> Purchase Orders
          </h1>
          <p className="text-sm text-slate-400 mt-1">{pos.length} orders totaling ${totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Create New Purchase Order Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus size={18} className="text-accent-500" /> Create New Purchase Order
        </h2>
        <POCreateForm
          vendors={vendors}
          existingPOs={pos}
          onSave={addPO}
        />
      </div>

      {/* Purchase Orders List Section */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-700/40">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText size={18} className="text-accent-500" /> Purchase Orders
          </h2>
        </div>
        {pos.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText size={32} className="mx-auto mb-3 text-slate-600" />
            <p>No purchase orders yet</p>
            <p className="text-sm mt-1">Create your first order above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-navy-700/40">
                  <th className="px-4 py-3 text-slate-400 font-medium">PO Number</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Vendor</th>
                  <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Date Created</th>
                  <th className="px-4 py-3 text-slate-400 font-medium text-center">Items</th>
                  <th className="px-4 py-3 text-slate-400 font-medium text-right">Grand Total</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="px-4 py-3 text-slate-400 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po) => (
                  <tr key={po.id} className="border-b border-slate-700/30 hover:bg-navy-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-accent-400">{po.poNumber}</td>
                    <td className="px-4 py-3 text-white">{po.vendorName}</td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{po.date}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{po.items.length}</td>
                    <td className="px-4 py-3 text-right text-white font-medium">${po.total.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewingPO(po)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-700 rounded transition-colors"
                          aria-label="View order"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingPO(po)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          aria-label="Delete order"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewingPO && (
        <ViewPOModal po={viewingPO} onClose={() => setViewingPO(null)} />
      )}

      {/* Delete Confirmation */}
      {deletingPO && (
        <DeletePODialog
          po={deletingPO}
          onConfirm={() => deletePO(deletingPO.id)}
          onCancel={() => setDeletingPO(null)}
        />
      )}
    </div>
  );
}

/* ========== PO CREATE FORM ========== */

interface LineItem extends POItem {
  id: string;
}

function POCreateForm({
  vendors,
  existingPOs,
  onSave,
}: {
  vendors: Vendor[];
  existingPOs: PurchaseOrder[];
  onSave: (po: PurchaseOrder) => void;
}) {
  const [vendorId, setVendorId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const selectedVendor = vendors.find((v) => v.id === vendorId);
  const poNumber = useMemo(() => generatePONumber(existingPOs), [existingPOs]);

  // Check for invalid quantities (not positive)
  const hasInvalidQuantity = lineItems.some(
    (item) => item.quantity <= 0 || isNaN(item.quantity)
  );

  // Calculations
  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [lineItems]
  );
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  const addItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Validation
    if (!vendorId) return;
    if (lineItems.length === 0) return;
    if (hasInvalidQuantity) return;

    const newPO: PurchaseOrder = {
      id: `po${Date.now()}`,
      poNumber,
      vendorId,
      vendorName: selectedVendor!.name,
      date: new Date().toISOString().slice(0, 10),
      deliveryDate,
      total: grandTotal,
      status: 'submitted',
      items: lineItems.map(({ description, quantity, unitPrice }) => ({
        description,
        quantity,
        unitPrice,
      })),
    };

    onSave(newPO);

    // Reset form
    setVendorId('');
    setDeliveryDate('');
    setLineItems([{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]);
    setSubmitted(false);
  };

  // No vendors case
  if (vendors.length === 0) {
    return (
      <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
        <AlertCircle size={24} className="mx-auto mb-2 text-yellow-400" />
        <p className="text-yellow-400 font-medium">Please add vendors first</p>
        <p className="text-slate-400 text-sm mt-1">You need at least one vendor to create a purchase order</p>
      </div>
    );
  }

  const canSave = vendorId && lineItems.length > 0 && !hasInvalidQuantity;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* PO Number (read-only) */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">PO Number</label>
          <div className="px-3 py-2 bg-navy-700/50 border border-slate-600/30 rounded-lg text-sm font-mono text-slate-300">
            {poNumber}
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Expected Delivery Date</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2]"
            />
          </div>
        </div>
      </div>

      {/* Vendor Dropdown */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Vendor *</label>
        <div className="relative">
          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 bg-navy-900 border rounded-lg text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2] ${
              submitted && !vendorId ? 'border-red-500' : 'border-accent-500/15'
            }`}
          >
            <option value="">Select a vendor...</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        {submitted && !vendorId && (
          <p className="text-red-400 text-xs mt-1">Please select a vendor</p>
        )}
      </div>

      {/* Line Items Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-slate-400">Line Items</label>
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-accent-500 hover:text-accent-400 transition-colors flex items-center gap-1"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-700/40 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-700/30">
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Item Name</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium w-24">Quantity</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium w-28">Unit Price</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium w-28">Line Total</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => {
                const lineTotal = item.quantity * item.unitPrice;
                const isInvalidQty = item.quantity <= 0 || isNaN(item.quantity);
                return (
                  <tr key={item.id} className="border-t border-slate-700/30">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                        className="w-full px-2 py-1.5 bg-navy-800 border border-slate-600/30 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        className={`w-full px-2 py-1.5 bg-navy-800 border rounded text-sm text-white text-right focus:outline-none ${
                          isInvalidQty ? 'border-red-500' : 'border-slate-600/30 focus:border-accent-500/40'
                        }`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-navy-800 border border-slate-600/30 rounded text-sm text-white text-right focus:outline-none focus:border-accent-500/40"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-white font-medium">
                      ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={lineItems.length === 1}
                        className={`p-1 rounded transition-colors ${
                          lineItems.length === 1
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                        }`}
                        aria-label="Delete item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {lineItems.length === 0 && (
          <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
            <AlertCircle size={12} /> Add at least one item
          </p>
        )}
      </div>

      {/* Summary Section */}
      <div className="bg-navy-700/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={16} className="text-accent-500" />
          <span className="text-sm font-medium text-white">Summary</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Subtotal</span>
            <span className="text-white">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Tax (10%)</span>
            <span className="text-white">${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-slate-600/30">
            <span className="text-white font-medium">Grand Total</span>
            <span className="text-lg font-bold text-accent-400">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSave}
          className={`btn flex items-center gap-2 ${
            canSave ? 'btn-primary' : 'bg-navy-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          <FileText size={16} /> Save Purchase Order
        </button>
      </div>
      {!canSave && lineItems.length > 0 && hasInvalidQuantity && (
        <p className="text-red-400 text-xs text-right">Please fix invalid quantities (must be positive numbers)</p>
      )}
    </form>
  );
}

/* ========== VIEW MODAL ========== */

function ViewPOModal({ po, onClose }: { po: PurchaseOrder; onClose: () => void }) {
  const subtotal = po.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye size={18} className="text-accent-500" /> {po.poNumber}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs text-slate-400">Vendor</p>
            <p className="text-sm text-white font-medium">{po.vendorName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Date Created</p>
            <p className="text-sm text-white">{po.date}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Delivery Date</p>
            <p className="text-sm text-white">{po.deliveryDate || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Status</p>
            <StatusBadge status={po.status} />
          </div>
        </div>

        <div className="border border-slate-700/40 rounded-lg overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-700/30">
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Item</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium">Qty</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium">Unit Price</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item, i) => (
                <tr key={i} className="border-t border-slate-700/30">
                  <td className="px-3 py-2 text-slate-300">{item.description}</td>
                  <td className="px-3 py-2 text-right text-white">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-white">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-white font-medium">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-navy-700/30 rounded-lg p-4 mb-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-white">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Tax (10%)</span>
              <span className="text-white">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-600/30">
              <span className="text-white font-medium">Grand Total</span>
              <span className="text-lg font-bold text-accent-400">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="btn btn-primary">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ========== DELETE CONFIRMATION ========== */

function DeletePODialog({
  po,
  onConfirm,
  onCancel,
}: {
  po: PurchaseOrder;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-white mb-2">Delete Purchase Order</h2>
        <p className="text-sm text-slate-300 mb-1">
          Are you sure you want to delete <span className="text-white font-mono">{po.poNumber}</span>?
        </p>
        <p className="text-xs text-slate-500 mb-4">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-ghost flex-1 justify-center">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn flex-1 justify-center bg-red-500 text-white hover:bg-red-600">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
