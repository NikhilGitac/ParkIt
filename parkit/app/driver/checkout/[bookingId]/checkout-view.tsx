"use client";

import { useEffect, useState, useMemo } from "react";
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
  QrCode,
  MapPin,
  Sparkles,
  AlertTriangle,
  Loader2,
  Check,
  KeyRound,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  Copy,
  Smartphone,
  X,
  CreditCard,
  Info,
} from "lucide-react";

export interface BookingData {
  id: string;
  space_id: string;
  driver_id?: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: "pending_payment" | "confirmed" | "checked_in" | "completed" | "cancelled" | string;
  payment_status: "unpaid" | "paid" | "refunded" | string;
  otp_code?: string;
  qr_code_url?: string;
  checkin_url?: string;
  parking_spaces?: ParkingSpace & {
    profiles?: {
      full_name: string;
      avatar_url?: string;
      phone?: string;
    };
  };
}

export default function CheckoutView({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query param fallbacks if accessed via spaceId navigation
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const startTime = searchParams.get("startTime") || "09:00";
  const duration = Number(searchParams.get("duration") || 2);
  const paramTotal = searchParams.get("total");

  // Core state
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [space, setSpace] = useState<ParkingSpace | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking Creation & Payment states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState<"gpay" | "phonepe" | "paytm" | "bhim" | "qr">("gpay");
  const [upiIdInput, setUpiIdInput] = useState("driver@okhdfcbank");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Load either existing booking or space details
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setBookingError(null);

      try {
        // 1. First check if `id` is a bookingId
        const bookingRes = await fetch(`/api/bookings/${id}`);
        if (bookingRes.ok) {
          const json = await bookingRes.json();
          if (json.booking) {
            setBooking(json.booking);
            if (json.booking.parking_spaces) {
              setSpace(json.booking.parking_spaces);
            }
            setLoading(false);
            return;
          }
        }

        // 2. Otherwise treat `id` as spaceId
        const spaceData = await fetchSingleSpaceFromSupabase(id);
        if (spaceData) {
          setSpace(spaceData);
        } else {
          setBookingError("Parking spot not found.");
        }
      } catch (err: any) {
        console.error("Failed to load checkout data:", err);
        setBookingError("Failed to load reservation data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // Derived time and dates
  const { displayDate, displayTimeRange, durationHours, startIso, endIso } = useMemo(() => {
    if (booking) {
      const s = new Date(booking.start_time);
      const e = new Date(booking.end_time);
      const dHours = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60)));

      const formatTime = (d: Date) => {
        const h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, "0");
        const period = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH}:${m} ${period}`;
      };

      return {
        displayDate: s.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        displayTimeRange: `${formatTime(s)} — ${formatTime(e)}`,
        durationHours: dHours,
        startIso: booking.start_time,
        endIso: booking.end_time,
      };
    }

    // Fallback using query parameters
    const [y, m, d] = date.split("-").map(Number);
    const [startH, startM] = startTime.split(":").map(Number);

    const startObj = new Date(y, m - 1, d, startH, startM || 0, 0);
    const endObj = new Date(startObj.getTime() + duration * 60 * 60 * 1000);

    const formatTime = (dateObj: Date) => {
      const h = dateObj.getHours();
      const mins = String(dateObj.getMinutes()).padStart(2, "0");
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH}:${mins} ${period}`;
    };

    return {
      displayDate: startObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      displayTimeRange: `${formatTime(startObj)} — ${formatTime(endObj)}`,
      durationHours: duration,
      startIso: startObj.toISOString(),
      endIso: endObj.toISOString(),
    };
  }, [booking, date, startTime, duration]);

  const hourlyRate = space?.price_per_hour || 35;
  const totalPrice = booking
    ? booking.total_price
    : paramTotal
    ? Number(paramTotal)
    : hourlyRate * durationHours;

  const currentStatus = booking?.status || "pending_payment";
  const isPaid = booking?.payment_status === "paid" || currentStatus === "confirmed" || currentStatus === "checked_in";

  // Handle Initial Booking Creation (if accessed directly with spaceId)
  const ensureBookingCreated = async (): Promise<string | null> => {
    if (booking) return booking.id;

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const response = await fetch("/api/create_booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id: space?.id || id,
          start_time: startIso,
          end_time: endIso,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || "This slot is no longer available.";
        setBookingError(errorMsg);
        setIsSubmitting(false);
        return null;
      }

      // Fetch the created booking details to maintain state
      const createdRes = await fetch(`/api/bookings/${result.booking_id}`);
      if (createdRes.ok) {
        const createdData = await createdRes.json();
        setBooking(createdData.booking);
      } else {
        setBooking({
          id: result.booking_id,
          space_id: result.space_id,
          start_time: result.start_time,
          end_time: result.end_time,
          total_price: result.total_price,
          status: result.status,
          payment_status: result.payment_status,
          otp_code: result.otp_code,
        });
      }

      // Update URL without full page reload
      window.history.replaceState(null, "", `/driver/checkout/${result.booking_id}`);
      return result.booking_id;
    } catch (err: any) {
      console.error("Failed to create booking:", err);
      setBookingError("Unable to reach booking server. Please check your network and try again.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Click on "Pay with UPI"
  const handleOpenUpiModal = async () => {
    let bookingId = booking?.id;
    if (!bookingId) {
      bookingId = (await ensureBookingCreated()) || undefined;
    }
    if (bookingId) {
      setShowUpiModal(true);
    }
  };

  // Confirm Simulated UPI Payment via /api/bookings/pay
  const handleConfirmUpiPayment = async () => {
    const activeBookingId = booking?.id;
    if (!activeBookingId) return;

    setIsProcessingPayment(true);
    setBookingError(null);

    try {
      const response = await fetch("/api/bookings/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: activeBookingId,
          upi_id: selectedUpiApp === "bhim" ? upiIdInput : `${selectedUpiApp}@upi`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Payment processing failed");
      }

      // Update local state with confirmed payment, QR code, and OTP
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: "confirmed",
              payment_status: "paid",
              otp_code: result.otp_code,
              qr_code_url: result.qr_code_url,
              checkin_url: result.checkin_url,
            }
          : null
      );

      setShowUpiModal(false);
    } catch (err: any) {
      console.error("Error confirming UPI payment:", err);
      setBookingError(err.message || "Failed to confirm UPI payment.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCopyOtp = () => {
    if (booking?.otp_code) {
      navigator.clipboard.writeText(booking.otp_code);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-[#0B1F3A]">Loading reservation details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-[#0B1F3A]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href={space ? `/driver/space/${space.id}` : "/driver"}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0B1F3A] hover:text-[#26b878] transition-colors bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Space</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {currentStatus === "pending_payment" && (
            <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Payment
            </span>
          )}
          {currentStatus === "confirmed" && (
            <span className="text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-700" />
              Confirmed
            </span>
          )}
          {currentStatus === "checked_in" && (
            <span className="text-xs font-bold bg-cyan-100 text-cyan-900 border border-cyan-300 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700" />
              Checked In
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Page Heading */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#26b878] uppercase tracking-wider">
              {isPaid ? "Reservation Confirmed" : "Secure Checkout"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">
              Demo Safe UPI Flow
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
            {isPaid ? "Your Parking Pass is Ready!" : "Confirm & Pay via UPI"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isPaid
              ? "Payment verified. Present the QR code or 6-digit OTP code to the space owner upon arrival."
              : "Review your parking slot, verified host details, and complete payment with instant demo UPI."}
          </p>
        </div>

        {/* Error Alert */}
        {bookingError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-bold text-rose-900">
                  {bookingError.includes("no longer available")
                    ? "Slot Conflict"
                    : "Reservation Notice"}
                </strong>
                <p className="text-xs text-rose-700 mt-0.5">{bookingError}</p>
              </div>
            </div>

            {space && (
              <Link
                href={`/driver/space/${space.id}`}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white hover:bg-rose-100/60 text-rose-800 px-3.5 py-2 rounded-xl border border-rose-300 transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Pick Different Time</span>
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column (3 cols): Space & Summary Details or Confirmed QR/OTP */}
          <div className="lg:col-span-3 space-y-5">
            {/* Space Summary Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                <Image
                  src={
                    space?.photo_url ||
                    "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={space?.title || "Parking spot"}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2FD08A] shrink-0" />
                  <span className="truncate">Greater Noida, UP</span>
                </div>

                <h2 className="font-bold text-base text-[#0B1F3A] leading-snug line-clamp-1">
                  {space?.title || "Central Metro Parking Bay"}
                </h2>

                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {space?.address || "Alpha 1, Greater Noida, UP"}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-200/60">
                    <CheckCircle2 className="w-3 h-3 text-[#2FD08A]" />
                    Verified Space
                  </span>
                  <span className="text-xs font-bold text-[#0B1F3A]">
                    ₹{hourlyRate}/hr
                  </span>
                </div>
              </div>
            </div>

            {/* If Paid / Confirmed: Show QR Code & 6-Digit OTP */}
            {isPaid && booking && (
              <div className="bg-white p-6 rounded-2xl border-2 border-[#2FD08A] shadow-soft-lg space-y-5 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#2FD08A] text-[#0B1F3A] flex items-center justify-center font-bold">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#0B1F3A]">
                        {currentStatus === "checked_in"
                          ? "Checked In & Active"
                          : "Payment Confirmed & Spot Locked"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Booking ID: <span className="font-mono font-semibold">{booking.id.slice(0, 13)}...</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    Paid ₹{totalPrice}
                  </span>
                </div>

                {/* QR Code Presentation */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="relative w-44 h-44 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                    {booking.qr_code_url ? (
                      <Image
                        src={booking.qr_code_url}
                        alt="Owner Check-in QR Code"
                        width={160}
                        height={160}
                        className="rounded-lg"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5">
                        <QrCode className="w-8 h-8" />
                        <span className="text-[10px] font-semibold">Generating QR...</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Gate Entry QR Pass</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-[#0B1F3A]">
                      Scan to Check In
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Show this QR code to the lot owner or gate attendant. Pointing their camera or phone at this QR opens the owner verification portal.
                    </p>
                  </div>
                </div>

                {/* 6-Digit OTP Code Presentation */}
                <div className="p-5 bg-[#0B1F3A] text-white rounded-2xl space-y-2 text-center relative overflow-hidden">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300">
                    <KeyRound className="w-4 h-4 text-[#2FD08A]" />
                    <span>Driver 6-Digit Gate OTP</span>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-[0.25em] text-[#2FD08A] pl-2">
                      {booking.otp_code || "481920"}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyOtp}
                      title="Copy OTP"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                    >
                      {copiedOtp ? (
                        <Check className="w-4 h-4 text-[#2FD08A]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Owner enters this 6-digit code on their device to grant you instant barrier access.
                  </p>
                </div>

                {/* Live Demo Verification Link for Evaluator / Hackathon Judges */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Hackathon Demo: Test Owner Check-in
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                      Live Gate View
                    </span>
                  </div>

                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Test the complete owner verification workflow directly by opening the check-in portal:
                  </p>

                  <a
                    href={`/verify/${booking.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full bg-[#0B1F3A] hover:bg-[#163359] text-white font-bold text-xs py-2.5 px-3 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Open Owner Verify Portal (/verify/{booking.id.slice(0, 8)}...)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#2FD08A]" />
                  </a>
                </div>

                <Link
                  href="/driver"
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-bold text-xs sm:text-sm py-3 px-4 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Driver Map</span>
                </Link>
              </div>
            )}

            {/* Reservation Summary Details */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-soft space-y-4">
              <h3 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wider">
                Booking Schedule & Space Info
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">Date</span>
                  </div>
                  <span className="font-bold text-[#0B1F3A]">{displayDate}</span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">Time Window</span>
                  </div>
                  <span className="font-bold text-[#0B1F3A]">{displayTimeRange}</span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">Duration</span>
                  </div>
                  <span className="font-bold text-[#0B1F3A]">
                    {durationHours} {durationHours === 1 ? "Hour" : "Hours"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-[#2FD08A]" />
                    <span className="font-medium">Host Profile</span>
                  </div>
                  <span className="font-bold text-[#0B1F3A]">
                    {space?.owner_name || "ParKit Verified Host"}
                  </span>
                </div>

                {booking && (
                  <div className="flex items-center justify-between py-2.5 bg-emerald-50/60 -mx-2 px-2 rounded-lg">
                    <div className="flex items-center gap-2.5 text-emerald-800">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold">Booking Reference</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-900">
                      #{booking.id.slice(0, 8)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (2 cols): Price Breakdown & Primary UPI Action */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-soft-lg space-y-5">
              <h3 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wider">
                Price Breakdown
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>
                    ₹{hourlyRate} × {durationHours} {durationHours === 1 ? "hour" : "hours"}
                  </span>
                  <span className="font-semibold text-[#0B1F3A]">
                    ₹{hourlyRate * durationHours}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>ParKit Guarantee & Protection</span>
                  <span className="font-semibold text-emerald-600">Free</span>
                </div>

                <div className="flex justify-between">
                  <span>Convenience & UPI Fee</span>
                  <span className="font-semibold text-[#0B1F3A]">₹0</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm text-[#0B1F3A]">
                  <span>Total Payable</span>
                  <span className="text-2xl font-extrabold text-[#0B1F3A]">
                    ₹{totalPrice}
                  </span>
                </div>
              </div>

              {/* Requirement 3: Add a "Pay with UPI" button */}
              {!isPaid && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleOpenUpiModal}
                    disabled={isSubmitting}
                    className={`w-full font-extrabold text-sm sm:text-base py-3.5 px-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2.5 ${
                      isSubmitting
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] hover:shadow-xl active:scale-[0.98] cursor-pointer"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#0B1F3A]" />
                        <span>Securing Slot...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-5 h-5 text-[#0B1F3A]" />
                        <span>Pay with UPI (₹{totalPrice})</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Demo-safe simulated UPI transaction</span>
                  </p>
                </div>
              )}

              {/* Security badges */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  SSL Encrypted
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#2FD08A]" />
                  Verified Host
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Requirement 4: Clearly Labeled Mock UPI Payment Screen Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-[#0B1F3A]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Safe Demo Notice Banner */}
            <div className="bg-amber-500 text-amber-950 px-4 py-2.5 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>HACKATHON DEMO MODE — Mock UPI Sandbox</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded font-extrabold">
                Safe Test
              </span>
            </div>

            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-[#0B1F3A]">
                  Pay with UPI
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paying to: <span className="font-semibold text-slate-700">ParKit Spaces (Demo)</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                disabled={isProcessingPayment}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amount Banner */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Payable</span>
              <span className="text-2xl font-black text-[#0B1F3A]">₹{totalPrice}</span>
            </div>

            {/* UPI Method Selection */}
            <div className="p-6 space-y-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Choose UPI App or Scan
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* GPay */}
                <button
                  type="button"
                  onClick={() => setSelectedUpiApp("gpay")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    selectedUpiApp === "gpay"
                      ? "border-[#2FD08A] bg-emerald-50/40 ring-2 ring-[#2FD08A]/30"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    G
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0B1F3A] block">Google Pay</span>
                    <span className="text-[10px] text-slate-400">gpay@upi</span>
                  </div>
                </button>

                {/* PhonePe */}
                <button
                  type="button"
                  onClick={() => setSelectedUpiApp("phonepe")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    selectedUpiApp === "phonepe"
                      ? "border-[#2FD08A] bg-emerald-50/40 ring-2 ring-[#2FD08A]/30"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                    Pe
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0B1F3A] block">PhonePe</span>
                    <span className="text-[10px] text-slate-400">ybl@upi</span>
                  </div>
                </button>

                {/* Paytm */}
                <button
                  type="button"
                  onClick={() => setSelectedUpiApp("paytm")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    selectedUpiApp === "paytm"
                      ? "border-[#2FD08A] bg-emerald-50/40 ring-2 ring-[#2FD08A]/30"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    Pt
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0B1F3A] block">Paytm UPI</span>
                    <span className="text-[10px] text-slate-400">paytm@upi</span>
                  </div>
                </button>

                {/* Scan QR */}
                <button
                  type="button"
                  onClick={() => setSelectedUpiApp("qr")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    selectedUpiApp === "qr"
                      ? "border-[#2FD08A] bg-emerald-50/40 ring-2 ring-[#2FD08A]/30"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-[#2FD08A] flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0B1F3A] block">Scan UPI QR</span>
                    <span className="text-[10px] text-slate-400">Any scanner</span>
                  </div>
                </button>
              </div>

              {/* UPI ID entry or QR view */}
              {selectedUpiApp === "qr" ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-2">
                  <div className="inline-block p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    {/* Simulated UPI QR for scan */}
                    <div className="w-28 h-28 bg-slate-900 text-white flex flex-col items-center justify-center rounded-lg">
                      <QrCode className="w-16 h-16 text-[#2FD08A]" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Simulated Dynamic UPI QR • ₹{totalPrice}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Virtual Payment Address (VPA)
                  </label>
                  <input
                    type="text"
                    value={
                      selectedUpiApp === "bhim"
                        ? upiIdInput
                        : `driver@${selectedUpiApp}`
                    }
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold text-[#0B1F3A] focus:outline-none focus:border-[#2FD08A] bg-slate-50"
                  />
                </div>
              )}

              {/* Demo explanation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2FD08A] shrink-0 mt-0.5" />
                <span>
                  No actual money or card data is requested. Clicking approve instantly simulates payment confirmation and generates your gate OTP.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                disabled={isProcessingPayment}
                className="w-1/3 py-3 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmUpiPayment}
                disabled={isProcessingPayment}
                className="w-2/3 py-3 px-4 rounded-xl bg-[#2FD08A] hover:bg-[#26b878] font-extrabold text-xs sm:text-sm text-[#0B1F3A] shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0B1F3A]" />
                    <span>Processing Demo UPI...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Simulate Success (₹{totalPrice})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
