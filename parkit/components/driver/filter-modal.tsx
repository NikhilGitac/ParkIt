"use client";

import { X, RotateCcw, Check, Sparkles } from "lucide-react";

export interface FilterState {
  maxPrice: number; // 20 to 100
  maxDistance: number; // 1 to 25 (km), 25 = Any
  availableNowOnly: boolean;
  minRating: number; // 0, 4.5, 4.8
}

export const DEFAULT_FILTERS: FilterState = {
  maxPrice: 100,
  maxDistance: 25,
  availableNowOnly: false,
  minRating: 0,
};

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
  matchCount: number;
}

export function FilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  matchCount,
}: FilterModalProps) {
  if (!isOpen) return null;

  const isFiltered =
    filters.maxPrice < 100 ||
    filters.maxDistance < 25 ||
    filters.availableNowOnly ||
    filters.minRating > 0;

  const handlePriceChange = (val: number) => {
    onApplyFilters({ ...filters, maxPrice: val });
  };

  const handleDistanceChange = (val: number) => {
    onApplyFilters({ ...filters, maxDistance: val });
  };

  const handleToggleAvailableNow = () => {
    onApplyFilters({ ...filters, availableNowOnly: !filters.availableNowOnly });
  };

  const handleRatingChange = (val: number) => {
    onApplyFilters({ ...filters, minRating: filters.minRating === val ? 0 : val });
  };

  const handleReset = () => {
    onApplyFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Filter Spaces</h2>
            {isFiltered && (
              <span className="w-2 h-2 rounded-full bg-[#2FD08A]"></span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close Filter Modal"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filter Options */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* 1. Maximum Price */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-[#0B1F3A]">
                Maximum Hourly Rate
              </label>
              <span className="text-sm font-extrabold text-[#26b878] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                {filters.maxPrice >= 100 ? "Any (up to ₹100)" : `Under ₹${filters.maxPrice}/hr`}
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={filters.maxPrice}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              className="w-full accent-[#2FD08A] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            {/* Quick Price Chips */}
            <div className="flex gap-2 mt-3">
              {[35, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePriceChange(p)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    filters.maxPrice === p
                      ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {p === 100 ? "Any" : `≤ ₹${p}`}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Maximum Distance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-[#0B1F3A]">
                Maximum Distance
              </label>
              <span className="text-sm font-extrabold text-[#0B1F3A] bg-slate-100 px-2.5 py-0.5 rounded-full">
                {filters.maxDistance >= 25 ? "Any distance" : `Within ${filters.maxDistance} km`}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              step="1"
              value={filters.maxDistance}
              onChange={(e) => handleDistanceChange(Number(e.target.value))}
              className="w-full accent-[#0B1F3A] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            {/* Quick Distance Chips */}
            <div className="flex gap-2 mt-3">
              {[2, 5, 10, 25].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDistanceChange(d)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    filters.maxDistance === d
                      ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {d === 25 ? "Any" : `${d} km`}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Available Now Toggle */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
               onClick={handleToggleAvailableNow}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#0B1F3A]">Available Now Only</span>
                <span className="w-2 h-2 rounded-full bg-[#2FD08A]"></span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter out spots outside their weekly operating hours
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={filters.availableNowOnly}
              aria-label="Toggle Available Now"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                filters.availableNowOnly ? "bg-[#2FD08A]" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  filters.availableNowOnly ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 4. Minimum Rating */}
          <div>
            <label className="block text-sm font-bold text-[#0B1F3A] mb-2">
              Minimum Rating
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Any", val: 0 },
                { label: "★ 4.5+", val: 4.5 },
                { label: "★ 4.8+ Top", val: 4.8 },
              ].map((r) => (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => handleRatingChange(r.val)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    filters.minRating === r.val
                      ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isFiltered}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-colors ${
              isFiltered
                ? "text-slate-600 bg-white border-slate-200 hover:bg-slate-100 cursor-pointer"
                : "text-slate-400 border-transparent cursor-not-allowed opacity-50"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#0B1F3A] hover:bg-[#163359] text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Show {matchCount} {matchCount === 1 ? "Space" : "Spaces"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
