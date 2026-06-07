import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Eye, FileText, AlertCircle, Calendar, Building2, Calculator, Printer, X, Filter, ArrowUpDown, CreditCard as Edit2 } from 'lucide-react';
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
    invoiced: { cls: 'badge-purple', label: 'Invoiced' },
  };
  const s = map[status] || { cls: 'badge-yellow', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

// Status filter options with mapping to actual status values
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Ordered' },
  { value: 'approved', label: 'Confirmed' },
  { value: 'shipped', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'invoiced', label: 'Invoiced' },
];

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Date (Newest First)' },
  { value: 'date-asc', label: 'Date (Oldest First)' },
  { value: 'total-desc', label: 'Total (High to Low)' },
  { value: 'status', label: 'Status' },
];

function generatePONumber(existingPOs: PurchaseOrder[]): string {
  const currentYear = new Date().getFullYear();
  const prefix = `PO-${currentYear}-`;

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
  // Edit state lives only in React — resets on page refresh
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  // Filter and sort state
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

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

  // Filtered and sorted POs
  const filteredPOs = useMemo(() => {
    let result = [...pos];

    if (filterStatus !== 'all') {
      result = result.filter((po) => po.status === filterStatus);
    }

    if (filterVendor !== 'all') {
      result = result.filter((po) => po.vendorId === filterVendor);
    }

    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case 'date-asc':
        result.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case 'total-desc':
        result.sort((a, b) => b.total - a.total);
        break;
      case 'status': {
        const statusOrder = ['submitted', 'approved', 'shipped', 'delivered', 'invoiced', 'overdue', 'cancelled'];
        result.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
        break;
      }
    }

    return result;
  }, [pos, filterStatus, filterVendor, sortBy]);

  const filteredTotalValue = filteredPOs.reduce((s, p) => s + p.total, 0);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterVendor('all');
  };

  const hasActiveFilters = filterStatus !== 'all' || filterVendor !== 'all';

  const deletePO = (id: string) => {
    const updated = pos.filter((p) => p.id !== id);
    setPosState(updated);
    setPurchaseOrders(updated);
    setDeletingPO(null);
    if (editingPO?.id === id) setEditingPO(null);
  };

  const addPO = (po: PurchaseOrder) => {
    const updated = [...pos, po];
    setPosState(updated);
    setPurchaseOrders(updated);
  };

  const updatePO = (po: PurchaseOrder) => {
    const updated = pos.map((p) => p.id === po.id ? po : p);
    setPosState(updated);
    setPurchaseOrders(updated);
    setEditingPO(null);
  };

  const startEditing = (po: PurchaseOrder) => {
    setEditingPO(po);
    // Scroll to form section
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const cancelEditing = () => setEditingPO(null);

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

      {/* Create / Edit Purchase Order Section */}
      <div ref={formSectionRef} className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          {editingPO ? (
            <><Edit2 size={18} className="text-accent-500" /> Editing {editingPO.poNumber}</>
          ) : (
            <><Plus size={18} className="text-accent-500" /> Create New Purchase Order</>
          )}
        </h2>
        <POCreateForm
          vendors={vendors}
          existingPOs={pos}
          editingPO={editingPO}
          onSave={addPO}
          onUpdate={updatePO}
          onCancelEdit={cancelEditing}
        />
      </div>

      {/* Purchase Orders List Section */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-700/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText size={18} className="text-accent-500" /> Purchase Orders
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-8 pr-8 py-2 bg-navy-800 border border-accent-500/15 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-accent-500/40 relative z-[2]"
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Vendor Filter */}
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={filterVendor}
                  onChange={(e) => setFilterVendor(e.target.value)}
                  className="pl-8 pr-8 py-2 bg-navy-800 border border-accent-500/15 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-accent-500/40 relative z-[2]"
                >
                  <option value="all">All Vendors</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="relative">
                <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-8 pr-8 py-2 bg-navy-800 border border-accent-500/15 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-accent-500/40 relative z-[2]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-accent-500 hover:text-accent-400 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-4 py-2.5 bg-navy-700/30 border-b border-slate-700/40">
          <p className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{filteredPOs.length}</span> of <span className="text-white font-medium">{pos.length}</span> POs
            <span className="mx-2 text-slate-600">|</span>
            Total Value: <span className="text-white font-medium">${filteredTotalValue.toLocaleString()}</span>
          </p>
        </div>

        {pos.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText size={32} className="mx-auto mb-3 text-slate-600" />
            <p>No purchase orders yet</p>
            <p className="text-sm mt-1">Create your first order above</p>
          </div>
        ) : filteredPOs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText size={32} className="mx-auto mb-3 text-slate-600" />
            <p>No purchase orders match the selected filters.</p>
            <button
              onClick={clearFilters}
              className="text-sm text-accent-500 hover:text-accent-400 transition-colors mt-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-navy-700/40">
                  <th className="px-4 py-3 text-slate-400 font-medium">PO Number</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Vendor</th>
                  <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Date Created</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Items</th>
                  <th className="px-4 py-3 text-slate-400 font-medium text-right">Grand Total</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="px-4 py-3 text-slate-400 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.map((po) => (
                  <tr
                    key={po.id}
                    className={`border-b border-slate-700/30 hover:bg-navy-700/30 transition-colors ${editingPO?.id === po.id ? 'bg-accent-500/5 border-accent-500/20' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-accent-400">{po.poNumber}</td>
                    <td className="px-4 py-3 text-white">{po.vendorName}</td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{po.date}</td>
                    <td className="px-4 py-3 text-slate-300 leading-relaxed">
                      {po.items.map((item) => item.description).filter(Boolean).join(', ')}
                    </td>
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
                          onClick={() => startEditing(po)}
                          className={`p-1.5 rounded transition-colors ${editingPO?.id === po.id ? 'text-accent-400 bg-accent-500/15' : 'text-slate-400 hover:text-accent-400 hover:bg-accent-500/10'}`}
                          aria-label="Edit order"
                        >
                          <Edit2 size={14} />
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

/* ========== PO CREATE / EDIT FORM ========== */

interface LineItem extends POItem {
  id: string;
}

function POCreateForm({
  vendors,
  existingPOs,
  editingPO,
  onSave,
  onUpdate,
  onCancelEdit,
}: {
  vendors: Vendor[];
  existingPOs: PurchaseOrder[];
  editingPO: PurchaseOrder | null;
  onSave: (po: PurchaseOrder) => void;
  onUpdate: (po: PurchaseOrder) => void;
  onCancelEdit: () => void;
}) {
  const isEditing = editingPO !== null;

  const [vendorId, setVendorId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [submitted, setSubmitted] = useState(false);
  const pendingFocusRef = useRef<string | null>(null);

  // Sync form fields when editingPO changes
  useEffect(() => {
    if (editingPO) {
      setVendorId(editingPO.vendorId);
      setDeliveryDate(editingPO.deliveryDate);
      setLineItems(
        editingPO.items.map((item) => ({
          id: crypto.randomUUID(),
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      );
      setSubmitted(false);
    } else {
      setVendorId('');
      setDeliveryDate('');
      setLineItems([{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]);
      setSubmitted(false);
    }
  }, [editingPO]);

  const focusInput = useCallback((itemId: string, field: 'description' | 'quantity' | 'unitPrice') => {
    const el = document.getElementById(`item-${itemId}-${field}`);
    if (el) el.focus();
  }, []);

  useEffect(() => {
    if (pendingFocusRef.current) {
      const [id, field] = pendingFocusRef.current.split('|');
      pendingFocusRef.current = null;
      requestAnimationFrame(() => focusInput(id, field as 'description'));
    }
  }, [lineItems, focusInput]);

  const handleItemKeyDown = (e: React.KeyboardEvent, itemId: string, field: 'description' | 'quantity' | 'unitPrice', index: number) => {
    if (e.key !== 'Tab') return;
    const isLastRow = index === lineItems.length - 1;

    if (field === 'description') {
      e.preventDefault();
      focusInput(itemId, 'quantity');
    } else if (field === 'quantity') {
      e.preventDefault();
      focusInput(itemId, 'unitPrice');
    } else if (field === 'unitPrice') {
      if (!e.shiftKey) {
        e.preventDefault();
        if (isLastRow) {
          const newId = crypto.randomUUID();
          setLineItems((prev) => [...prev, { id: newId, description: '', quantity: 1, unitPrice: 0 }]);
          pendingFocusRef.current = `${newId}|description`;
        } else {
          focusInput(lineItems[index + 1].id, 'description');
        }
      }
    }
  };

  const selectedVendor = vendors.find((v) => v.id === vendorId);
  const newPONumber = useMemo(() => generatePONumber(existingPOs), [existingPOs]);
  const displayPONumber = isEditing ? editingPO!.poNumber : newPONumber;

  const hasInvalidQuantity = lineItems.some(
    (item) => item.quantity <= 0 || isNaN(item.quantity)
  );

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
    if (lineItems.length === 1) {
      setLineItems([{ id: lineItems[0].id, description: '', quantity: 1, unitPrice: 0 }]);
      return;
    }
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((items) =>
      items.map((item) => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!vendorId) return;
    if (!deliveryDate) return;
    if (lineItems.length === 0) return;
    if (hasInvalidQuantity) return;

    const items: POItem[] = lineItems.map(({ description, quantity, unitPrice }) => ({
      description,
      quantity,
      unitPrice,
    }));

    if (isEditing && editingPO) {
      const updatedPO: PurchaseOrder = {
        ...editingPO,
        vendorId,
        vendorName: selectedVendor!.name,
        deliveryDate,
        items,
        total: grandTotal,
      };
      onUpdate(updatedPO);
    } else {
      const newPO: PurchaseOrder = {
        id: `po${Date.now()}`,
        poNumber: newPONumber,
        vendorId,
        vendorName: selectedVendor!.name,
        date: new Date().toISOString().slice(0, 10),
        deliveryDate,
        total: grandTotal,
        status: 'submitted',
        items,
      };
      onSave(newPO);
    }

    // Reset form
    setVendorId('');
    setDeliveryDate('');
    setLineItems([{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]);
    setSubmitted(false);
  };

  const handleCancelEdit = () => {
    onCancelEdit();
  };

  if (vendors.length === 0) {
    return (
      <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
        <AlertCircle size={24} className="mx-auto mb-2 text-yellow-400" />
        <p className="text-yellow-400 font-medium">Please add vendors first</p>
        <p className="text-slate-400 text-sm mt-1">You need at least one vendor to create a purchase order</p>
      </div>
    );
  }

  const canSave = vendorId && deliveryDate && lineItems.length > 0 && !hasInvalidQuantity;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* PO Number (read-only) */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">PO Number</label>
          <div className="px-3 py-2 bg-navy-700/50 border border-slate-600/30 rounded-lg text-sm font-mono text-slate-300">
            {displayPONumber}
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Expected Delivery Date *</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 bg-navy-900 border rounded-lg text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2] ${
                submitted && !deliveryDate ? 'border-red-500' : 'border-accent-500/15'
              }`}
            />
          </div>
          {submitted && !deliveryDate && (
            <p className="text-red-400 text-xs mt-1">Delivery date is required</p>
          )}
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
              {lineItems.map((item, index) => {
                const lineTotal = item.quantity * item.unitPrice;
                const isInvalidQty = item.quantity <= 0 || isNaN(item.quantity);
                return (
                  <tr key={item.id} className="border-t border-slate-700/30">
                    <td className="px-3 py-2">
                      <input
                        id={`item-${item.id}-description`}
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        onKeyDown={(e) => handleItemKeyDown(e, item.id, 'description', index)}
                        placeholder="Item description"
                        className="w-full px-2 py-1.5 bg-navy-800 border border-slate-600/30 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        id={`item-${item.id}-quantity`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        onKeyDown={(e) => handleItemKeyDown(e, item.id, 'quantity', index)}
                        className={`w-full px-2 py-1.5 bg-navy-800 border rounded text-sm text-white text-right focus:outline-none ${
                          isInvalidQty ? 'border-red-500' : 'border-slate-600/30 focus:border-accent-500/40'
                        }`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        id={`item-${item.id}-unitPrice`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                        onKeyDown={(e) => handleItemKeyDown(e, item.id, 'unitPrice', index)}
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
                        className="p-1 rounded transition-colors text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        aria-label={lineItems.length === 1 ? 'Clear item' : 'Delete item'}
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

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">Total Items: {lineItems.length}</span>
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

      {/* Save / Cancel Buttons */}
      <div className="flex justify-end gap-3">
        {isEditing && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="btn btn-ghost"
          >
            <X size={16} /> Cancel Edit
          </button>
        )}
        <button
          type="submit"
          disabled={!canSave}
          className={`btn flex items-center gap-2 ${
            canSave ? 'btn-primary' : 'bg-navy-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          <FileText size={16} /> {isEditing ? 'Save Changes' : 'Save Purchase Order'}
        </button>
      </div>
      {!canSave && lineItems.length > 0 && hasInvalidQuantity && (
        <p className="text-red-400 text-xs text-right">Please fix invalid quantities (must be positive numbers)</p>
      )}
    </form>
  );
}

/* ========== VIEW MODAL (PRINTABLE PO DOCUMENT) ========== */

function ViewPOModal({ po, onClose }: { po: PurchaseOrder; onClose: () => void }) {
  const subtotal = po.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  const vendor = getVendors().find((v) => v.id === po.vendorId) ?? null;
  const paymentTerms = vendor?.paymentTerms ?? 'Net 30';

  const handlePrint = () => {
    const printArea = document.querySelector('.print-area') as HTMLElement | null;
    if (!printArea) return;

    const clone = printArea.cloneNode(true) as HTMLElement;
    const controls = clone.querySelector('.print-controls');
    if (controls) controls.remove();

    const printRoot = document.createElement('div');
    printRoot.id = 'po-print-root';
    printRoot.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:99999;background:white';
    printRoot.appendChild(clone);
    document.body.appendChild(printRoot);

    const appRoot = document.getElementById('root');
    const prevDisplay = appRoot ? appRoot.style.display : '';
    if (appRoot) appRoot.style.display = 'none';

    window.print();

    document.body.removeChild(printRoot);
    if (appRoot) appRoot.style.display = prevDisplay;
  };

  return (
    <div className="print-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="print-area card p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Print Controls - hidden during print */}
        <div className="print-controls flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye size={18} className="text-accent-500" /> PO Document
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn btn-ghost flex items-center gap-1.5">
              <Printer size={14} /> Print
            </button>
            <button onClick={onClose} className="btn btn-ghost p-2" aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* === PO DOCUMENT === */}
        <div className="bg-white text-gray-900 rounded-lg p-8 print:p-0 print:rounded-none">
          {/* Header */}
          <div className="po-doc-header flex items-start justify-between pb-4 border-b-2 border-gray-800 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <span className="text-3xl">🚛</span> ProcureAI Procurement
              </h1>
              <p className="text-sm text-gray-500 mt-1">Supply Chain Management</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Purchase Order</p>
              <p className="text-xl font-bold font-mono">{po.poNumber}</p>
              <p className="text-sm text-gray-600 mt-1">Date: {po.date}</p>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Vendor</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-base">{po.vendorName}</p>
              {vendor ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
                  {vendor.contact && <p><span className="text-gray-500">Contact:</span> {vendor.contact}</p>}
                  {vendor.email && <p><span className="text-gray-500">Email:</span> {vendor.email}</p>}
                  {vendor.phone && <p><span className="text-gray-500">Phone:</span> {vendor.phone}</p>}
                  {vendor.location && <p><span className="text-gray-500">Location:</span> {vendor.location}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-1 italic">Vendor details unavailable</p>
              )}
            </div>
          </div>

          {/* Delivery info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Delivery Date</h2>
              <p className="text-sm font-medium">{po.deliveryDate || 'Not specified'}</p>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Status</h2>
              <p className="text-sm font-medium capitalize">{po.status.replace('-', ' ')}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Line Items</h2>
            <table className="po-doc-table w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2.5 text-left font-semibold border-b border-gray-300">Item</th>
                  <th className="px-4 py-2.5 text-right font-semibold border-b border-gray-300 w-20">Qty</th>
                  <th className="px-4 py-2.5 text-right font-semibold border-b border-gray-300 w-28">Unit Price</th>
                  <th className="px-4 py-2.5 text-right font-semibold border-b border-gray-300 w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((item, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-2.5 border-b border-gray-200">{item.description}</td>
                    <td className="px-4 py-2.5 text-right border-b border-gray-200">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-right border-b border-gray-200">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right border-b border-gray-200 font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="po-doc-totals flex justify-end mb-8">
            <div className="w-64 space-y-1.5 pt-3 border-t-2 border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-300">
                <span>Grand Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-300 text-xs text-gray-500">
            <p>Terms: {paymentTerms}. This PO is system-generated.</p>
          </div>
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
