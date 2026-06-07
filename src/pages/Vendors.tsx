import React, { useMemo, useState, useEffect } from 'react';
import { Plus, Search, MapPin, Mail, Phone, Clock, Trash2, CreditCard as Edit2, Building2, X, Star, FileText, Calendar, ShieldCheck, CreditCard, StickyNote } from 'lucide-react';
import { getVendors, setVendors, getPurchaseOrders, getVendorRatings } from '../lib/store';
import type { Vendor } from '../lib/types';

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Use 'gi' only for split (captures), use a separate non-stateful check for marking
  const splitRegex = new RegExp(`(${escaped})`, 'gi');
  const testRegex = new RegExp(`^${escaped}$`, 'i');
  const parts = text.split(splitRegex);
  return (
    <>
      {parts.map((part, i) =>
        testRegex.test(part) ? (
          <mark key={i} className="bg-yellow-400/80 text-navy-900 rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const CATEGORIES = ['Electronics', 'Logistics', 'Raw Materials', 'Office Supplies', 'IT Services'] as const;
const PAYMENT_TERMS = ['Net 30', 'Net 60', 'Net 90'] as const;
const STATUSES = ['active', 'inactive'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: 'badge-blue',
  Logistics: 'badge-green',
  'Raw Materials': 'badge-yellow',
  'Office Supplies': 'badge-purple',
  'IT Services': 'badge-orange',
};

const CATEGORY_BG_COLORS: Record<string, string> = {
  Electronics: 'bg-blue-500',
  Logistics: 'bg-green-500',
  'Raw Materials': 'bg-yellow-500',
  'Office Supplies': 'bg-purple-500',
  'IT Services': 'bg-orange-500',
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const STATUS_COLORS: Record<string, string> = {
  active: 'badge-green',
  inactive: 'badge-red',
  'under-review': 'badge-yellow',
};

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] || 'badge-yellow';
  return <span className={`badge ${cls}`}>{category}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] || 'badge-yellow';
  return <span className={`badge ${cls}`}>{status.replace('-', ' ')}</span>;
}

function generateVendorId(existingVendors: Vendor[]): string {
  const nums = existingVendors.map((v) => {
    const match = v.id.match(/VND-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `VND-${String(max + 1).padStart(3, '0')}`;
}

export default function Vendors() {
  const [vendors, setVendorsState] = useState<Vendor[]>(() => { try { return getVendors(); } catch { return []; } });
  const [purchaseOrders, setPurchaseOrders] = useState(() => { try { return getPurchaseOrders(); } catch { return []; } });
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Refresh PO data when component mounts or window gains focus (for cross-page updates)
  useEffect(() => {
    const refreshPOs = () => setPurchaseOrders(getPurchaseOrders());
    window.addEventListener('focus', refreshPOs);
    return () => window.removeEventListener('focus', refreshPOs);
  }, []);

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        v.name.toLowerCase().includes(q) ||
        v.contact.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q);
      const matchCat = filterCategory === 'all' || v.category === filterCategory;
      const matchStatus = filterStatus === 'all' || v.status === filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [vendors, search, filterCategory, filterStatus]);

  const addVendor = (v: Vendor) => {
    const updated = [...vendors, v];
    setVendorsState(updated);
    setVendors(updated);
    setShowAdd(false);
  };

  const updateVendor = (v: Vendor) => {
    const updated = vendors.map((existing) => existing.id === v.id ? v : existing);
    setVendorsState(updated);
    setVendors(updated);
    setEditingVendor(null);
  };

  const deleteVendor = (id: string) => {
    const updated = vendors.filter((v) => v.id !== id);
    setVendorsState(updated);
    setVendors(updated);
    setDeletingVendor(null);
    setSelectedVendor(null);
  };

  const openPOCount = (vendorId: string): number => {
    try {
      const pos = getPurchaseOrders();
      return pos.filter((po) => po.vendorId === vendorId && ['submitted', 'approved', 'shipped'].includes(po.status)).length;
    } catch { return 0; }
  };

  const livePOCount = (vendorId: string): number => {
    return purchaseOrders.filter(
      (po) => po.vendorId === vendorId && po.status !== 'delivered' && po.status !== 'cancelled'
    ).length;
  };

  const exportCSV = () => {
    if (vendors.length === 0) {
      alert('No vendors to export');
      return;
    }
    const headers = ['ID', 'Company', 'Category', 'Contact', 'Email', 'Phone', 'PaymentTerms', 'LeadTime', 'Status'];
    const rows = vendors.map((v) => [
      v.id,
      v.name,
      v.category,
      v.contact,
      v.email,
      v.phone,
      v.paymentTerms,
      String(v.leadTime),
      v.status,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vendors.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 size={24} className="text-accent-500" /> Vendor Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">{vendors.length} registered vendors</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn btn-ghost">
            Export CSV
          </button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <Plus size={16} /> Add Vendor
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendors by name, contact, email, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-navy-800 border border-accent-500/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors z-[3]"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Left filter panel */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 bg-navy-800 border border-accent-500/15 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-accent-500/40 relative z-[2]"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-navy-800 border border-accent-500/15 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-accent-500/40 relative z-[2]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-slate-400">
        {search.trim()
          ? <>{filtered.length} of {vendors.length} vendors</>
          : <>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</>
        }
      </p>

      {/* Vendor grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={40} className="mx-auto mb-3 text-slate-600" />
          {search.trim() ? (
            <>
              <p className="text-slate-400 text-lg">No vendors match &ldquo;{search}&rdquo;</p>
              <p className="text-slate-500 text-sm mt-1">Try a different search term or clear the search</p>
            </>
          ) : (
            <>
              <p className="text-slate-400 text-lg">No vendors found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="card p-5 cursor-pointer"
              onClick={() => setSelectedVendor(v)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${CATEGORY_BG_COLORS[v.category] || 'bg-slate-500'}`}
                  >
                    {getInitials(v.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-base truncate">
                        <Highlight text={v.name} query={search} />
                      </h3>
                      {livePOCount(v.id) > 0 && (
                        <span className="badge badge-blue text-xs flex-shrink-0">{livePOCount(v.id)} POs</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <CategoryBadge category={v.category} />
                      <StatusBadge status={v.status} />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-mono ml-2 flex-shrink-0">{v.id}</span>
              </div>

              <div className="space-y-2 text-sm text-slate-300 mb-4">
                <div className="flex items-center gap-2"><Phone size={14} className="text-slate-500 flex-shrink-0" /> <span className="truncate"><Highlight text={v.contact} query={search} /></span></div>
                <div className="flex items-center gap-2"><Mail size={14} className="text-slate-500 flex-shrink-0" /> <span className="truncate"><Highlight text={v.email} query={search} /></span></div>
                {v.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-slate-500 flex-shrink-0" /> <span className="truncate">{v.phone}</span></div>}
                <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-500 flex-shrink-0" /> <span className="truncate">{v.location}</span></div>
                <div className="flex items-center gap-2"><Clock size={14} className="text-slate-500 flex-shrink-0" /> {v.leadTime} days lead time</div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-700/40">
                <span className="text-xs text-slate-500">{v.paymentTerms}</span>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedVendor(null); setEditingVendor(v); }} className="btn btn-ghost p-2" aria-label="Edit vendor">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedVendor(null); setDeletingVendor(v); }} className="btn btn-ghost p-2 text-red-400 border-red-500/20 hover:border-red-500/40 hover:text-red-300" aria-label="Delete vendor">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <VendorFormModal
          title="Add Vendor"
          existingVendors={vendors}
          onSave={addVendor}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Edit Modal */}
      {editingVendor && (
        <VendorFormModal
          title="Edit Vendor"
          existingVendors={vendors}
          initialData={editingVendor}
          onSave={updateVendor}
          onClose={() => setEditingVendor(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingVendor && (
        <DeleteConfirmDialog
          vendor={deletingVendor}
          openPOs={openPOCount(deletingVendor.id)}
          onConfirm={() => deleteVendor(deletingVendor.id)}
          onCancel={() => setDeletingVendor(null)}
        />
      )}

      {/* Detail Panel */}
      <VendorDetailPanel
        vendor={selectedVendor}
        onClose={() => setSelectedVendor(null)}
        onEdit={(v) => { setSelectedVendor(null); setEditingVendor(v); }}
        onDelete={(v) => { setSelectedVendor(null); setDeletingVendor(v); }}
      />
    </div>
  );
}

/* ========== VENDOR DETAIL PANEL ========== */

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
  critical: 'text-red-400',
};

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-700/30 last:border-0">
      <span className="mt-0.5 text-slate-500 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-white break-words">{value}</p>
      </div>
    </div>
  );
}

function VendorDetailPanel({
  vendor,
  onClose,
  onEdit,
  onDelete,
}: {
  vendor: Vendor | null;
  onClose: () => void;
  onEdit: (v: Vendor) => void;
  onDelete: (v: Vendor) => void;
}) {
  const open = vendor !== null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const poData = useMemo(() => {
    if (!vendor) return { total: 0, lastDate: null };
    try {
      const pos = getPurchaseOrders().filter((po) => po.vendorId === vendor.id);
      const lastDate = pos.length > 0
        ? pos.map((p) => p.date).sort().reverse()[0]
        : null;
      return { total: pos.length, lastDate };
    } catch { return { total: 0, lastDate: null }; }
  }, [vendor]);

  const rating = useMemo(() => {
    if (!vendor) return null;
    try {
      return getVendorRatings().find((r) => r.vendorId === vendor.id) ?? null;
    } catch { return null; }
  }, [vendor]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[150] bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 h-full w-[360px] max-w-full z-[160] bg-[#0f2240] border-l border-accent-500/15 shadow-2xl shadow-black/60 flex flex-col transition-transform duration-300 ease-in-out"
        style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {vendor && (
          <>
            {/* Panel header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-accent-500/10 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <CategoryBadge category={vendor.category} />
                  <StatusBadge status={vendor.status} />
                </div>
                <h2 className="text-lg font-bold text-white leading-snug">{vendor.name}</h2>
                <p className="text-xs text-slate-500 font-mono mt-1">{vendor.id}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-700/50 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-3">

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-navy-700/40 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Total Orders</p>
                  <p className="text-lg font-bold text-white">
                    {poData.total === 0 ? <span className="text-sm font-normal text-slate-500">No orders yet</span> : poData.total}
                  </p>
                </div>
                <div className="bg-navy-700/40 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Avg Rating</p>
                  <p className="text-lg font-bold text-white">
                    {rating ? (
                      <span className="flex items-center justify-center gap-1">
                        <Star size={13} className="text-yellow-400 fill-yellow-400" />
                        {rating.overall.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-sm font-normal text-slate-500">Not rated yet</span>
                    )}
                  </p>
                </div>
                <div className="bg-navy-700/40 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">On-Time</p>
                  <p className="text-lg font-bold text-white">{vendor.onTimeDelivery > 0 ? `${vendor.onTimeDelivery}%` : <span className="text-sm font-normal text-slate-500">—</span>}</p>
                </div>
              </div>

              {/* Detail rows */}
              <div className="mb-2">
                <DetailRow icon={<Phone size={14} />} label="Contact Person" value={vendor.contact} />
                <DetailRow icon={<Mail size={14} />} label="Email" value={vendor.email} />
                {vendor.phone && <DetailRow icon={<Phone size={14} />} label="Phone" value={vendor.phone} />}
                <DetailRow icon={<MapPin size={14} />} label="Location" value={vendor.location || '—'} />
                <DetailRow icon={<Clock size={14} />} label="Lead Time" value={`${vendor.leadTime} days`} />
                <DetailRow icon={<CreditCard size={14} />} label="Payment Terms" value={vendor.paymentTerms} />
                <DetailRow icon={<Calendar size={14} />} label="Contract End" value={vendor.contractEnd} />
                <DetailRow
                  icon={<ShieldCheck size={14} />}
                  label="Risk Level"
                  value={<span className={RISK_COLORS[vendor.riskLevel] || 'text-white'}>{vendor.riskLevel.charAt(0).toUpperCase() + vendor.riskLevel.slice(1)}</span>}
                />
                <DetailRow
                  icon={<FileText size={14} />}
                  label="Last Order Date"
                  value={poData.lastDate ?? <span className="text-slate-500">No orders yet</span>}
                />
                {vendor.notes && (
                  <DetailRow
                    icon={<StickyNote size={14} />}
                    label="Notes"
                    value={vendor.notes}
                  />
                )}
              </div>

              {/* Quality metrics */}
              {(vendor.qualityScore > 0 || vendor.onTimeDelivery > 0) && (
                <div className="mt-4 pt-3 border-t border-slate-700/30">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Performance</p>
                  {[
                    { label: 'Quality Score', value: vendor.qualityScore, color: 'bg-accent-500' },
                    { label: 'On-Time Delivery', value: vendor.onTimeDelivery, color: 'bg-green-500' },
                    { label: 'Cost Index', value: vendor.costIndex, color: 'bg-yellow-500' },
                  ].map((m) => (
                    <div key={m.label} className="mb-2.5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{m.label}</span>
                        <span className="text-white font-medium">{m.value}%</span>
                      </div>
                      <div className="h-1.5 bg-navy-700 rounded-full">
                        <div className={`h-1.5 rounded-full ${m.color}`} style={{ width: `${m.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 px-5 py-4 border-t border-accent-500/10 flex-shrink-0">
              <button
                onClick={() => onEdit(vendor)}
                className="btn btn-ghost flex-1 justify-center"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={() => onDelete(vendor)}
                className="btn flex-1 justify-center bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ========== VENDOR FORM MODAL ========== */

interface FormState {
  name: string;
  contact: string;
  email: string;
  phone: string;
  category: string;
  paymentTerms: string;
  leadTime: string;
  status: string;
  location: string;
  notes: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  contact: '',
  email: '',
  phone: '',
  category: CATEGORIES[0],
  paymentTerms: PAYMENT_TERMS[0],
  leadTime: '14',
  status: 'active',
  location: '',
  notes: '',
};

interface FormErrors {
  name?: string;
  email?: string;
  contact?: string;
}

function VendorFormModal({
  title,
  existingVendors,
  initialData,
  onSave,
  onClose,
}: {
  title: string;
  existingVendors: Vendor[];
  initialData?: Vendor;
  onSave: (v: Vendor) => void;
  onClose: () => void;
}) {
  const isEdit = !!initialData;
  const [form, setForm] = useState<FormState>(() =>
    initialData
      ? {
          name: initialData.name,
          contact: initialData.contact,
          email: initialData.email,
          phone: initialData.phone,
          category: initialData.category,
          paymentTerms: initialData.paymentTerms,
          leadTime: String(initialData.leadTime),
          status: initialData.status === 'under-review' ? 'active' : initialData.status,
          location: initialData.location,
          notes: initialData.notes || '',
        }
      : { ...INITIAL_FORM }
  );
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const notesCharCount = form.notes.length;
  const notesMaxChars = 300;

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Company Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.contact.trim()) e.contact = 'Contact Person is required';
    return e;
  };

  const markTouched = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
  };

  const currentErrors = validate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = new Set(['name', 'email', 'contact']);
    setTouched(allTouched);
    const errs = validate();
    if (Object.keys(errs).length > 0) return;

    const id = isEdit && initialData ? initialData.id : generateVendorId(existingVendors);
    onSave({
      id,
      name: form.name.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      category: form.category,
      location: form.location.trim(),
      rating: initialData?.rating ?? 0,
      status: form.status as Vendor['status'],
      onTimeDelivery: initialData?.onTimeDelivery ?? 0,
      qualityScore: initialData?.qualityScore ?? 0,
      costIndex: initialData?.costIndex ?? 0,
      riskLevel: initialData?.riskLevel ?? 'low',
      contractEnd: initialData?.contractEnd ?? '2027-12-31',
      paymentTerms: form.paymentTerms,
      leadTime: parseInt(form.leadTime, 10) || 14,
      notes: form.notes.trim(),
    });
  };

  const fieldClass = (field: string) => {
    const hasError = touched.has(field) && currentErrors[field as keyof FormErrors];
    return `w-full px-3 py-2 bg-navy-900 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2] ${
      hasError ? 'border-red-500' : 'border-accent-500/15'
    }`;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white link text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Company Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onBlur={() => markTouched('name')}
              placeholder="e.g. Apex Materials Corp"
              className={fieldClass('name')}
            />
            {touched.has('name') && currentErrors.name && <p className="text-red-400 text-xs mt-1">{currentErrors.name}</p>}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Contact Person *</label>
            <input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              onBlur={() => markTouched('contact')}
              placeholder="e.g. James Chen"
              className={fieldClass('contact')}
            />
            {touched.has('contact') && currentErrors.contact && <p className="text-red-400 text-xs mt-1">{currentErrors.contact}</p>}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => markTouched('email')}
              placeholder="e.g. contact@company.com"
              className={fieldClass('email')}
            />
            {touched.has('email') && currentErrors.email && <p className="text-red-400 text-xs mt-1">{currentErrors.email}</p>}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. +1-555-0100"
              className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2]"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2]"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Payment Terms</label>
              <select
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2]"
              >
                {PAYMENT_TERMS.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Lead Time (days)</label>
              <input
                type="number"
                min={1}
                value={form.leadTime}
                onChange={(e) => setForm({ ...form, leadTime: e.target.value })}
                className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white focus:outline-none focus:border-accent-500/40 relative z-[2]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Shanghai, China"
              className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2]"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= notesMaxChars) {
                  setForm({ ...form, notes: value });
                }
              }}
              placeholder="Add any notes about this vendor..."
              rows={3}
              className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 resize-none relative z-[2]"
            />
            <p className="text-xs text-slate-500 mt-1 text-right">{notesCharCount} / {notesMaxChars}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1 justify-center">{isEdit ? 'Save Changes' : 'Add Vendor'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========== DELETE CONFIRMATION ========== */

function DeleteConfirmDialog({
  vendor,
  openPOs,
  onConfirm,
  onCancel,
}: {
  vendor: Vendor;
  openPOs: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-white mb-2">Delete Vendor</h2>
        <p className="text-sm text-slate-300 mb-1">Are you sure you want to delete <span className="text-white font-medium">{vendor.name}</span>?</p>
        {openPOs > 0 && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">This vendor has {openPOs} open order{openPOs !== 1 ? 's' : ''}</p>
          </div>
        )}
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="btn btn-ghost flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} className="btn flex-1 justify-center bg-red-500 text-white hover:bg-red-600">Delete</button>
        </div>
      </div>
    </div>
  );
}
