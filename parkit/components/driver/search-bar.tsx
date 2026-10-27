"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, ArrowLeft, Car, Check, Sparkles } from "lucide-react";
import { FilterState } from "./filter-modal";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterState;
  onOpenFilterModal: () => void;
  onQuickToggleAvailableNow: () => void;
  onQuickTogglePrice40: () => void;
  onQuickToggleDistance5: () => void;
  totalSpacesCount: number;
}

export function FloatingSearchBar({
  searchQuery,
  onSearchChange,
  filters,
  onOpenFilterModal,
  onQuickToggleAvailableNow,
  onQuickTogglePrice40,
  onQuickToggleDistance5,
  totalSpacesCount,
}: SearchBarProps) {
  // Compute active filter badge count
  let activeFilterCount = 0;
  if (filters.maxPrice < 100) activeFilterCount++;
  if (filters.maxDistance < 25) activeFilterCount++;
  if (filters.availableNowOnly) activeFilterCount++;
  if (filters.minRating > 0) activeFilterCount++;

  return (
    <div className="absolute top-3 left-3 right-3 sm:top-5 sm:left-6 sm:right-6 z-[1000] pointer-events-none flex flex-col items-center">
      {/* Search Bar Container */}
      <div className="w-full max-w-xl pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-soft-lg border border-slate-200/90 p-2 sm:p-2.5 flex items-center gap-2 transition-all">
          {/* ParKit Minimal Logo / Home */}
          <Link
            href="/"
            title="ParKit Home"
            className="w-9 h-9 rounded-xl bg-[#0B1F3A] hover:bg-[#163359] text-[#2FD08A] flex items-center justify-center shrink-0 transition-colors"
          >
            <Car className="w-5 h-5" />
          </Link>

          {/* Search Input Box */}
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1.5 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Where do you need parking?"
              className="w-full bg-transparent text-sm sm:text-base font-medium text-[#0B1F3A] placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs mr-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 mx-0.5"></div>

          {/* Filter Button */}
          {/* Filter Button */}
          <button
            type="button"
            onClick={onOpenFilterModal}
            aria-label="Open Filters"
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilterCount > 0
                ? "bg-[#2FD08A] text-[#0B1F3A] shadow-sm hover:bg-[#26b878]"
                : "bg-slate-100 hover:bg-slate-200 text-[#0B1F3A]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#0B1F3A] text-white text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* AI Assistant Button */}
          <Link
            href="/driver/assistant"
            title="Ask ParKit AI Concierge"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-[#0B1F3A] hover:bg-[#163359] text-[#2FD08A] shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#2FD08A]" />
            <span className="hidden sm:inline">AI Concierge</span>
          </Link>
        </div>

        {/* Quick Filter Horizontal Scroll Chips */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 overflow-x-auto no-scrollbar py-1 px-0.5">
          {/* Quick Chip: AI Concierge */}
          <Link
            href="/driver/assistant"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#0B1F3A] text-[#2FD08A] border border-[#2FD08A]/40 shadow-xs hover:bg-[#163359] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#2FD08A]" />
            <span>Ask AI Assistant</span>
          </Link>

          {/* Quick Chip: Available Now */}
          <button
            type="button"
            onClick={onQuickToggleAvailableNow}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              filters.availableNowOnly
                ? "bg-[#2FD08A] text-[#0B1F3A] ring-2 ring-[#2FD08A]/40"
                : "bg-white/95 backdrop-blur-md text-[#0B1F3A] hover:bg-white border border-slate-200/80"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${filters.availableNowOnly ? "bg-[#0B1F3A]" : "bg-[#2FD08A]"}`}></span>
            Available Now
          </button>

          {/* Quick Chip: Under ₹40 */}
          <button
            type="button"
            onClick={onQuickTogglePrice40}
            className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              filters.maxPrice <= 40
                ? "bg-[#0B1F3A] text-white"
                : "bg-white/95 backdrop-blur-md text-slate-700 hover:bg-white border border-slate-200/80"
            }`}
          >
            <span>Under ₹40</span>
          </button>

          {/* Quick Chip: Within 5 km */}
          <button
            type="button"
            onClick={onQuickToggleDistance5}
            className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              filters.maxDistance <= 5
                ? "bg-[#0B1F3A] text-white"
                : "bg-white/95 backdrop-blur-md text-slate-700 hover:bg-white border border-slate-200/80"
            }`}
          >
            <span>Within 5 km</span>
          </button>

          {/* Quick Recap Badge */}
          <div className="shrink-0 text-[11px] font-semibold text-slate-500 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-200/60 shadow-sm ml-auto">
            {totalSpacesCount} {totalSpacesCount === 1 ? "space" : "spaces"} nearby
          </div>
        </div>
      </div>
    </div>
  );
}
