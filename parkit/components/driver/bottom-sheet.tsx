"use client";

import { useState, useRef, useEffect } from "react";
import { ParkingSpace } from "@/lib/parking-data";
import { ParkingCard } from "./parking-card";
import { ChevronUp, ChevronDown, Sparkles, MapPin, SlidersHorizontal } from "lucide-react";

type SheetPosition = "peek" | "half" | "full";

interface BottomSheetProps {
  spaces: ParkingSpace[];
  bestMatchId: string | null;
  selectedSpace: ParkingSpace | null;
  onSelectSpace: (space: ParkingSpace) => void;
  onOpenFilters: () => void;
}

export function BottomSheet({
  spaces,
  bestMatchId,
  selectedSpace,
  onSelectSpace,
  onOpenFilters,
}: BottomSheetProps) {
  // Mobile sheet position: "peek" (~110px), "half" (52vh), "full" (88vh)
  const [position, setPosition] = useState<SheetPosition>("half");
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchCurrentY, setTouchCurrentY] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const cardListRef = useRef<HTMLDivElement>(null);

  // Touch drag handlers for mobile bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    setTouchCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStartY === null || touchCurrentY === null) return;
    const diff = touchStartY - touchCurrentY; // Positive = dragged UP, Negative = dragged DOWN

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Dragged up
        if (position === "peek") setPosition("half");
        else if (position === "half") setPosition("full");
      } else {
        // Dragged down
        if (position === "full") setPosition("half");
        else if (position === "half") setPosition("peek");
      }
    }

    setTouchStartY(null);
    setTouchCurrentY(null);
  };

  // Toggle button helper
  const togglePosition = () => {
    if (position === "peek") setPosition("half");
    else if (position === "half") setPosition("full");
    else setPosition("half");
  };

  // Auto-scroll selected card into view
  useEffect(() => {
    if (selectedSpace && cardListRef.current) {
      const cardEl = document.getElementById(`parking-card-${selectedSpace.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedSpace]);

  // Height styles mapping for mobile
  const heightStyles: Record<SheetPosition, string> = {
    peek: "h-[110px]",
    half: "h-[54vh]",
    full: "h-[88vh]",
  };

  return (
    <div
      ref={sheetRef}
      className={`
        fixed bottom-0 left-0 right-0 z-[900]
        bg-white rounded-t-3xl shadow-[0_-8px_32px_rgba(11,31,58,0.15)] border-t border-slate-200/90
        flex flex-col transition-all duration-300 ease-out
        ${heightStyles[position]}
        md:fixed md:top-24 md:left-6 md:bottom-6 md:right-auto md:w-[440px] md:h-auto md:max-h-[calc(100vh-7.5rem)]
        md:rounded-2xl md:shadow-soft-lg md:border md:border-slate-200
      `}
    >
      {/* Drag Handle & Mobile Header */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={togglePosition}
        className="shrink-0 pt-2.5 pb-2 px-5 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Visual Pill Drag Bar */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 mx-auto transition-colors md:hidden mb-2" />

        {/* Sheet Title Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-[#0B1F3A] tracking-tight">
              Nearby Parking
            </h2>
            <span className="text-xs font-bold bg-[#0B1F3A]/5 text-[#0B1F3A] px-2.5 py-0.5 rounded-full">
              {spaces.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFilters();
              }}
              className="text-xs font-bold text-[#0B1F3A] hover:text-[#26b878] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Filter</span>
            </button>

            {/* Mobile Expand / Collapse Chevron */}
            <button
              type="button"
              aria-label="Toggle Bottom Sheet Height"
              className="md:hidden w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
            >
              {position === "full" ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Small subtitle indicator */}
        <p className="text-xs text-slate-500 mt-0.5">
          {spaces.length > 0
            ? "Curated spaces sorted by best match & proximity"
            : "No spaces match your active filters"}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-slate-100 shrink-0" />

      {/* Scrollable Card Feed */}
      <div
        ref={cardListRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 overscroll-contain"
      >
        {spaces.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#0B1F3A]">No parking spaces found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Try adjusting your price range, distance limit, or clearing the search text.
            </p>
            <button
              onClick={onOpenFilters}
              className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold bg-[#0B1F3A] text-white px-3.5 py-2 rounded-xl shadow-sm hover:bg-[#163359] transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Adjust Filters
            </button>
          </div>
        ) : (
          spaces.map((space) => {
            const isBest = bestMatchId === space.id;
            const isSelected = selectedSpace?.id === space.id;

            return (
              <div key={space.id} id={`parking-card-${space.id}`}>
                <ParkingCard
                  space={space}
                  isBestMatch={isBest}
                  isSelected={isSelected}
                  onHover={() => onSelectSpace(space)}
                  onSelect={() => onSelectSpace(space)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
