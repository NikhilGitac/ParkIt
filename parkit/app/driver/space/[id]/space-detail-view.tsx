"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ParkingSpace,
  FALLBACK_PARKING_SPACES,
  fetchSpacesFromSupabase,
  GREATER_NOIDA_CENTER,
} from "@/lib/parking-data";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Car,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  Info,
} from "lucide-react";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SpaceDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [space, setSpace] = useState<ParkingSpace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSpace() {
      setLoading(true);
      // Try local fallback first for instant hit
      const local = FALLBACK_PARKING_SPACES.find((s) => s.id === id);
      if (local) {
        setSpace(local);
      }

      // Also try fetching from Supabase
      try {
        const spaces = await fetchSpacesFromSupabase(
          GREATER_NOIDA_CENTER.lat,
          GREATER_NOIDA_CENTER.lng
        );
        const found = spaces.find((s) => s.id === id);
        if (found) {
          setSpace(found);
        }
      } catch (e) {
        console.error("Error fetching space:", e);
      }
      setLoading(false);
    }

    loadSpace();
  }, [id]);

  if (loading && !space) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold text-[#0B1F3A]">Loading parking space details...</p>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-soft max-w-md text-center border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Info className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#0B1F3A]">Parking Space Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            The requested parking spot could not be located or may have been unlisted.
          </p>
          <Link
            href="/driver"
            className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 sm:pb-16 text-[#0B1F3A]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/driver"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0B1F3A] hover:text-[#26b878] transition-colors bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Map</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-[#0B1F3A] text-[#2FD08A] px-2.5 py-1 rounded-lg">
            ParKit Driver
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {/* Title & Location Header */}
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 bg-[#2FD08A]/15 text-[#0B1F3A] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#2FD08A]/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2FD08A]" />
              Verified Space
            </span>

            {space.is_available_now && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-[#2FD08A] animate-pulse"></span>
                Available Now
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
            {space.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-1 font-bold text-[#0B1F3A]">
              <Star className="w-4 h-4 fill-[#FFC93C] text-[#FFC93C]" />
              <span>{space.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({space.review_count} reviews)</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{space.address}</span>
            </div>
          </div>
        </div>

        {/* Gallery / Main Image */}
        <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden bg-slate-200 shadow-soft border border-slate-200 mb-8">
          <Image
            src={space.photo_url}
            alt={space.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
            <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-medium">
              Greater Noida, UP
            </span>
            <span className="bg-[#0B1F3A]/80 backdrop-blur-md px-3 py-1 rounded-full font-bold text-[#2FD08A]">
              ₹{space.price_per_hour}/hr
            </span>
          </div>
        </div>

        {/* Two-Column Grid: Details & Booking Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols): Space Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host Section */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 border-2 border-[#2FD08A]">
                  <Image
                    src={space.owner_avatar}
                    alt={space.owner_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0B1F3A]">
                    Hosted by {space.owner_name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2FD08A]" />
                    ParKit Identity Verified • Responds in under 5 minutes
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert("Host messaging available upon booking confirmation.")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1F3A] hover:text-[#26b878] border border-slate-200 px-3 py-2 rounded-xl transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contact Host</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-soft">
              <h2 className="text-base font-bold text-[#0B1F3A] mb-2.5">
                About this parking space
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {space.description}
              </p>
            </div>

            {/* Amenities & Features */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-soft">
              <h2 className="text-base font-bold text-[#0B1F3A] mb-4">
                Amenities & Space Features
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {space.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-[#0B1F3A]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#2FD08A] shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>{amenity}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-[#0B1F3A]">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#2FD08A] shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <span>Fits Sedan, Hatchback & Full SUV</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-[#0B1F3A]">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#2FD08A] shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span>Instant OTP Check-in</span>
                </div>
              </div>
            </div>

            {/* Operating Availability Schedule */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#0B1F3A]">
                  Weekly Availability Hours
                </h2>
                <span className="text-xs font-bold text-[#26b878] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                  Recurring Schedule
                </span>
              </div>

              <div className="space-y-2">
                {space.availability && space.availability.length > 0 ? (
                  space.availability.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="font-bold text-[#0B1F3A]">
                        {DAY_NAMES[slot.day_of_week]}
                      </span>
                      <span className="font-medium text-slate-600">
                        {slot.start_time} — {slot.end_time}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    24/7 access upon confirmed booking.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Booking Preview Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-soft-lg space-y-5">
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-2xl font-extrabold text-[#0B1F3A]">
                    ₹{space.price_per_hour}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">/ hour</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#0B1F3A]">
                  <Star className="w-3.5 h-3.5 fill-[#FFC93C] text-[#FFC93C]" />
                  <span>{space.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Booking Notice Preview */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Booking Available Soon</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  You are viewing the space in preview mode. The direct reservation flow with OTP generation is currently in development.
                </p>
              </div>

              {/* Price Calculation Simulation */}
              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>₹{space.price_per_hour} × 2 hours (typical stay)</span>
                  <span className="font-semibold text-[#0B1F3A]">₹{space.price_per_hour * 2}</span>
                </div>
                <div className="flex justify-between">
                  <span>ParKit Guarantee & Protection Fee</span>
                  <span className="font-semibold text-emerald-600">₹0 (Free)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm text-[#0B1F3A]">
                  <span>Estimated Total</span>
                  <span>₹{space.price_per_hour * 2}</span>
                </div>
              </div>

              {/* Booking Action Button (Disabled as requested) */}
              <button
                type="button"
                disabled
                className="w-full bg-[#0B1F3A]/40 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Reserve Parking Spot (Coming Soon)</span>
              </button>

              <Link
                href="/driver"
                className="w-full inline-flex items-center justify-center gap-1 text-xs font-bold text-slate-600 hover:text-[#0B1F3A] py-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Interactive Map</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
