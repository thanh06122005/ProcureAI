import React, { useMemo, useState } from 'react';
import { Plus, Search, MapPin, Mail, Phone, Clock, Trash2, CreditCard as Edit2, Building2, X } from 'lucide-react';
import { getVendors, setVendors, getPurchaseOrders } from '../lib/store';
import type { Vendor } from '../lib/types';

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
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
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);

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
  };

  const openPOCount = (vendorId: string): number => {
    try {
      const pos = getPurchaseOrders();
      return pos.filter((po) => po.vendorId === vendorId && ['submitted', 'approved', 'shipped'].includes(po.status)).length;
    } catch { return 0; }
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
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <Plus size={16} /> Add Vendor
        </button>
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
            <div key={v.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-base truncate">
                    <Highlight text={v.name} query={search} />
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <CategoryBadge category={v.category} />
                    <StatusBadge status={v.status} />
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
                  <button onClick={() => setEditingVendor(v)} className="btn btn-ghost p-2" aria-label="Edit vendor">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => setDeletingVendor(v)} className="btn btn-ghost p-2 text-red-400 border-red-500/20 hover:border-red-500/40 hover:text-red-300" aria-label="Delete vendor">
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
    </div>
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
        }
      : { ...INITIAL_FORM }
  );
  const [touched, setTouched] = useState<Set<string>>(new Set());

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
