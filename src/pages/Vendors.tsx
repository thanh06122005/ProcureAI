import React, { useMemo, useState } from 'react';
import { Plus, Search, Filter, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';
import { getVendors, setVendors } from '../lib/store';
import type { Vendor } from '../lib/types';

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    low: 'badge-green',
    medium: 'badge-yellow',
    high: 'badge-red',
    critical: 'badge-red',
  };
  return <span className={`badge ${map[level] || 'badge-yellow'}`}>{level}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'badge-green',
    inactive: 'badge-red',
    'under-review': 'badge-yellow',
  };
  return <span className={`badge ${map[status] || 'badge-yellow'}`}>{status.replace('-', ' ')}</span>;
}

export default function Vendors() {
  const [vendors, setVendorsState] = useState<Vendor[]>(() => { try { return getVendors(); } catch { return []; } });
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  const categories = useMemo(() => ['all', ...Array.from(new Set(vendors.map((v) => v.category)))], [vendors]);

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.contact.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'all' || v.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [vendors, search, filterCategory]);

  const addVendor = (v: Vendor) => {
    const updated = [...vendors, v];
    setVendorsState(updated);
    setVendors(updated);
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendors</h1>
          <p className="text-sm text-slate-400 mt-1">{vendors.length} registered vendors</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-navy-800 border border-accent-500/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2]"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-navy-800 border border-accent-500/15 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-accent-500/40 relative z-[2]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((v) => (
          <div key={v.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white text-base">{v.name}</h3>
                <p className="text-sm text-slate-400">{v.category}</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={v.status} />
                <RiskBadge level={v.riskLevel} />
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-300 mb-4">
              <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-500" /> {v.location}</div>
              <div className="flex items-center gap-2"><Mail size={14} className="text-slate-500" /> {v.email}</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-slate-500" /> {v.contact}</div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700/40">
              <div className="text-center">
                <p className="text-xs text-slate-500">On-Time</p>
                <p className="text-sm font-semibold text-white">{v.onTimeDelivery}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Quality</p>
                <p className="text-sm font-semibold text-white">{v.qualityScore}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Rating</p>
                <p className="text-sm font-semibold text-yellow-400">{v.rating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddVendorModal onAdd={addVendor} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddVendorModal({ onAdd, onClose }: { onAdd: (v: Vendor) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: `v${Date.now()}`,
      name,
      category,
      contact,
      email,
      location,
      rating: 0,
      status: 'active',
      onTimeDelivery: 0,
      qualityScore: 0,
      costIndex: 0,
      riskLevel: 'low',
      contractEnd: '2027-12-31',
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Add Vendor</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white link">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Vendor Name" className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2]" />
          <input required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2]" />
          <input required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact Person" className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2]" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2]" />
          <input required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full px-3 py-2 bg-navy-900 border border-accent-500/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/40 relative z-[2]" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1 justify-center">Add Vendor</button>
          </div>
        </form>
      </div>
    </div>
  );
}
