"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ParkingSpace,
  fetchSingleSpaceFromSupabase,
} from "@/lib/parking-data";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  CreditCard,
  QrCode,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function CheckoutView({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const startTime = searchParams.get("startTime") || "09:00";
  const duration = Number(searchParams.get("duration") || 2);
  const total = Number(searchParams.get("total") || 70);

  const [space, setSpace] = useState<ParkingSpace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSpace() {
      setLoading(true);
      const data = await fetchSingleSpaceFromSupabase(spaceId);
      setSpace(data);
      setLoading(false);
    }
    loadSpace();
  }, [spaceId]);

  const [startH] = startTime.split(":").map(Number);
  const endH = (startH + duration) % 24;
  const endTimeStr = `${String(endH).padStart(2, "0")}:00`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 text-[#0B1F3A]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href={`/driver/space/${spaceId}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0B1F3A] hover:text-[#26b878] transition-colors bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Space</span>
        </Link>

        <span className="text-xs font-bold bg-[#0B1F3A] text-[#2FD08A] px-3 py-1.5 rounded-xl">
          ParKit Checkout
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
            Confirm and pay
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your reservation details before locking in your spot.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Reservation Details (3 cols) */}
          <div className="md:col-span-3 space-y-6">
            {/* Space Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <Image
                  src={space?.photo_url || "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80"}
                  alt={space?.title || "Parking spot"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[#0B1F3A] truncate">
                  {space?.title || "Selected Parking Bay"}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {space?.address || "Greater Noida, UP"}
                </p>
                <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md mt-1.5 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-[#2FD08A]" />
                  <span>Verified Space</span>
                </div>
              </div>
            </div>

            {/* Time & Date Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-4">
              <h2 className="text-sm font-bold text-[#0B1F3A]">Your reservation</h2>

              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Date</span>
                </div>
                <span className="font-bold text-[#0B1F3A]">{date}</span>
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Reserved Window</span>
                </div>
                <span className="font-bold text-[#0B1F3A]">
                  {startTime} — {endTimeStr} ({duration} {duration === 1 ? "hour" : "hours"})
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-[#2FD08A]" />
                  <span>Check-in Method</span>
                </div>
                <span className="font-bold text-[#0B1F3A]">Instant OTP & QR Code</span>
              </div>
            </div>

            {/* Payment Method Preview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-3">
              <h2 className="text-sm font-bold text-[#0B1F3A]">Payment Method</h2>
              <div className="p-3.5 rounded-xl border border-[#2FD08A] bg-emerald-50/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-xs">
                    UPI
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0B1F3A]">Instant UPI & QR</span>
                    <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#26b878]">Active</span>
              </div>
            </div>
          </div>

          {/* Pricing & Confirmation (2 cols) */}
          <div className="md:col-span-2">
            <div className="sticky top-20 bg-white p-5 rounded-2xl border border-slate-200 shadow-soft-lg space-y-4">
              <h2 className="text-sm font-bold text-[#0B1F3A]">Price Details</h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>₹{space?.price_per_hour || 35} × {duration}h</span>
                  <span className="font-semibold text-[#0B1F3A]">₹{total}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ParKit Guarantee Fee</span>
                  <span className="font-semibold text-emerald-600">₹0 (Free)</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm text-[#0B1F3A]">
                  <span>Total Amount</span>
                  <span className="text-xl font-extrabold text-[#0B1F3A]">₹{total}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-snug">
                <strong>Booking Milestone:</strong> This reservation will automatically generate an OTP valid for driver gate entry.
              </div>

              <button
                type="button"
                onClick={() => {
                  alert(`Success! Simulated booking confirmed for ${date} at ${startTime}. Your OTP is 491028.`);
                  router.push("/driver");
                }}
                className="w-full bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Confirm & Reserve Spot</span>
              </button>

              <p className="text-center text-[10px] text-slate-400">
                Encrypted & secure checkout powered by ParKit
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
