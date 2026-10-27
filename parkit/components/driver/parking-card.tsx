"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ParkingSpace } from "@/lib/parking-data";
import { Star, MapPin, Clock, Sparkles, ShieldCheck, ChevronRight } from "lucide-react";

interface ParkingCardProps {
  space: ParkingSpace;
  isBestMatch?: boolean;
  isSelected?: boolean;
  matchExplanation?: string;
  aiGenerated?: boolean;
  onHover?: () => void;
  onSelect?: () => void;
}

export function ParkingCard({
  space,
  isBestMatch = false,
  isSelected = false,
  matchExplanation,
  aiGenerated = false,
  onHover,
  onSelect,
}: ParkingCardProps) {
  const [imgSrc, setImgSrc] = useState(
    space.photo_url ||
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80"
  );

  return (
    <Link
      href={`/driver/space/${space.id}`}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`group relative block rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 ${
        isSelected
          ? "border-[#2FD08A] ring-2 ring-[#2FD08A]/40 bg-emerald-50/10"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-3.5 p-3 sm:p-3.5">
        {/* Photo Container */}
        <div className="relative w-full sm:w-44 h-40 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-slate-100">
          <Image
            src={imgSrc}
            alt={space.title}
            fill
            sizes="(max-width: 640px) 100vw, 176px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => {
              setImgSrc("https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80");
            }}
          />

          {/* Yellow "Best Match" Badge on the Top Result */}
          {isBestMatch && (
            <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-[#FFC93C] text-[#0B1F3A] text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm z-10 border border-amber-300/60">
              <Sparkles className="w-3 h-3 fill-[#0B1F3A]" />
              <span>Best match</span>
            </div>
          )}

          {/* Availability pill badge on photo */}
          <div className="absolute bottom-2.5 left-2.5 z-10">
            {space.is_available_now ? (
              <span className="inline-flex items-center gap-1.5 bg-[#0B1F3A]/90 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/20">
                <span className="w-2 h-2 rounded-full bg-[#2FD08A] animate-pulse"></span>
                Available Now
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-slate-900/80 text-slate-200 text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-md">
                <Clock className="w-3 h-3 text-slate-400" />
                Scheduled
              </span>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            {/* Rating and Distance Header */}
            <div className="flex items-center justify-between gap-2 text-xs mb-1">
              <div className="flex items-center gap-1 text-[#0B1F3A] font-bold">
                <Star className="w-3.5 h-3.5 fill-[#FFC93C] text-[#FFC93C]" />
                <span>{space.rating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({space.review_count})</span>
              </div>

              {space.distance_km !== undefined && (
                <span className="text-slate-500 font-medium flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {space.distance_km} km away
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-[#0B1F3A] text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-[#26b878] transition-colors">
              {space.title}
            </h3>

            {/* Address */}
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {space.address}
            </p>

            {/* Amenities tags preview */}
            <div className="flex flex-wrap gap-1 mt-2">
              {space.amenities.slice(0, 2).map((amenity, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                >
                  {amenity}
                </span>
              ))}
              {space.amenities.length > 2 && (
                <span className="text-[10px] text-slate-400 self-center">
                  +{space.amenities.length - 2}
                </span>
              )}
            </div>

            {/* AI / Smart Match Explanation Banner */}
            {isBestMatch && matchExplanation && (
              <div className="mt-2.5 p-2 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] font-semibold text-[#0B1F3A] flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="line-clamp-2">{matchExplanation}</span>
              </div>
            )}
          </div>

          {/* Pricing & CTA Footer */}
          <div className="flex items-baseline justify-between mt-3 pt-2.5 border-t border-slate-100">
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-[#0B1F3A] tracking-tight">
                ₹{space.price_per_hour}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ hour</span>
            </div>

            <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1F3A] group-hover:text-[#26b878] transition-colors">
              <span>View details</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
