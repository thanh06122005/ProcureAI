import React, { useMemo } from 'react';
import { Star, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { getVendors, getVendorRatings } from '../lib/store';
import type { Vendor, VendorRating } from '../lib/types';

function ScoreBar({ value, max = 5, color = 'bg-accent-500' }: { value: number; max?: number; color?: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="w-full bg-navy-700 rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < full ? 'text-yellow-400 fill-yellow-400' : i < full + (hasHalf ? 1 : 0) ? 'text-yellow-400 fill-yellow-400/50' : 'text-slate-600'}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-white">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function Scorecard() {
  const vendors = useMemo(() => { try { return getVendors(); } catch { return []; } }, []);
  const ratings = useMemo(() => { try { return getVendorRatings(); } catch { return []; } }, []);

  const combined = useMemo(() => {
    return vendors.map((v) => {
      const r = ratings.find((rt) => rt.vendorId === v.id);
      return { vendor: v, rating: r };
    }).sort((a, b) => (b.rating?.overall || 0) - (a.rating?.overall || 0));
  }, [vendors, ratings]);

  const topVendor = combined[0];
  const avgOverall = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.overall, 0) / ratings.length).toFixed(1) : '0.0';
  const avgQuality = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.quality, 0) / ratings.length).toFixed(1) : '0.0';
  const avgDelivery = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.delivery, 0) / ratings.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div data-tour="scorecard-header">
        <h1 className="text-2xl font-bold text-white">Vendor Scorecard</h1>
        <p className="text-sm text-slate-400 mt-1">Performance ratings and quality metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Star size={20} className="text-yellow-400" />
            <span className="text-sm text-slate-400">Avg Overall</span>
          </div>
          <p className="text-2xl font-bold text-white">{avgOverall}</p>
          <ScoreBar value={Number(avgOverall)} color="bg-yellow-400" />
        </div>
        <div className="kpi-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Award size={20} className="text-accent-500" />
            <span className="text-sm text-slate-400">Avg Quality</span>
          </div>
          <p className="text-2xl font-bold text-white">{avgQuality}</p>
          <ScoreBar value={Number(avgQuality)} color="bg-accent-500" />
        </div>
        <div className="kpi-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-green-400" />
            <span className="text-sm text-slate-400">Avg Delivery</span>
          </div>
          <p className="text-2xl font-bold text-white">{avgDelivery}</p>
          <ScoreBar value={Number(avgDelivery)} color="bg-green-400" />
        </div>
      </div>

      {topVendor && (
        <div className="card p-5 border-yellow-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Award size={24} className="text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Top Performer</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-white">{topVendor.vendor.name}</p>
              <p className="text-sm text-slate-400">{topVendor.vendor.category}</p>
            </div>
            <RatingStars rating={topVendor.rating?.overall || 0} />
          </div>
        </div>
      )}

      <div data-tour="scorecard-list" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {combined.map(({ vendor, rating }) => (
          <div key={vendor.id} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">{vendor.name}</h3>
                <p className="text-sm text-slate-400">{vendor.category}</p>
              </div>
              <RatingStars rating={rating?.overall || 0} />
            </div>

            {rating && (
              <div className="space-y-3">
                {[
                  { label: 'Quality', value: rating.quality, color: 'bg-accent-500' },
                  { label: 'Delivery', value: rating.delivery, color: 'bg-green-400' },
                  { label: 'Cost', value: rating.cost, color: 'bg-yellow-400' },
                  { label: 'Responsiveness', value: rating.responsiveness, color: 'bg-purple-400' },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-400">{m.label}</span>
                      <span className="text-white font-medium">{m.value.toFixed(1)}</span>
                    </div>
                    <ScoreBar value={m.value} color={m.color} />
                  </div>
                ))}
              </div>
            )}

            {rating && rating.reviews.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-700/40 space-y-2">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Recent Reviews</p>
                {rating.reviews.map((rev, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">{rev.reviewer}</span>
                      <span className="text-slate-500 text-xs">{rev.date}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
