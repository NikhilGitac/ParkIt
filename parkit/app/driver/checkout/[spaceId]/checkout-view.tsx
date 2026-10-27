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
  CreditCard,
  QrCode,
  MapPin,
  Sparkles,
  AlertTriangle,
  Loader2,
  Check,
  KeyRound,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

export interface BookingResponse {
  success: boolean;
  booking_id: string;
  space_id: string;
  driver_id: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  payment_status: string;
  otp_code: string;
}

export default function CheckoutView({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const startTime = searchParams.get("startTime") || "09:00";
  const duration = Number(searchParams.get("duration") || 2);
  const paramTotal = searchParams.get("total");

  const [space, setSpace] = useState<ParkingSpace | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking Creation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingResponse | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    async function loadSpace() {
      setLoading(true);
      const data = await fetchSingleSpaceFromSupabase(spaceId);
      setSpace(data);
      setLoading(false);
    }
    loadSpace();
  }, [spaceId]);

  // Compute ISO start and end timestamps
  const { startIso, endIso, endTimeStr, displayDate } = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    const [startH, startM] = startTime.split(":").map(Number);

    const startObj = new Date(y, m - 1, d, startH, startM || 0, 0);
    const endObj = new Date(startObj.getTime() + duration * 60 * 60 * 1000);

    const endH = endObj.getHours();
    const endMinuteStr = String(endObj.getMinutes()).padStart(2, "0");
    const endPeriod = endH >= 12 ? "PM" : "AM";
    const displayEndH = endH % 12 === 0 ? 12 : endH % 12;

    const startPeriod = startH >= 12 ? "PM" : "AM";
    const displayStartH = startH % 12 === 0 ? 12 : startH % 12;

    return {
      startIso: startObj.toISOString(),
      endIso: endObj.toISOString(),
      endTimeStr: `${displayStartH}:${String(startM || 0).padStart(2, "0")} ${startPeriod} — ${displayEndH}:${endMinuteStr} ${endPeriod}`,
      displayDate: startObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  }, [date, startTime, duration]);

  const hourlyRate = space?.price_per_hour || 35;
  const subtotal = hourlyRate * duration;
  const totalPrice = paramTotal ? Number(paramTotal) : subtotal;

  // Requirement 8: Call create_booking before showing payment
  const handleContinueToPayment = async () => {
    setIsSubmitting(true);
    setBookingError(null);

    try {
      const response = await fetch("/api/create_booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id: spaceId,
          start_time: startIso,
          end_time: endIso,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Overlap or validation conflict error
        const errorMessage = result.error || "This slot is no longer available.";
        setBookingError(errorMessage);
        setIsSubmitting(false);
        return;
      }

      // Success: booking created with status pending_payment and payment_status unpaid
      setBookingData(result);
    } catch (err: any) {
      console.error("Failed to execute create_booking:", err);
      setBookingError("Unable to reach booking server. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate payment completion
  const handleSimulatePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentCompleted(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-[#0B1F3A]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href={`/driver/space/${spaceId}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0B1F3A] hover:text-[#26b878] transition-colors bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Space</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-[#0B1F3A] text-[#2FD08A] px-3 py-1.5 rounded-xl">
            ParKit Reservation
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Page Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#26b878] uppercase tracking-wider">
              {paymentCompleted
                ? "Step 3 of 3: Confirmed"
                : bookingData
                ? "Step 2 of 3: Payment"
                : "Step 1 of 3: Review Reservation"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
            {paymentCompleted
              ? "Reservation Confirmed!"
              : bookingData
              ? "Complete Payment"
              : "Review Booking Summary"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {paymentCompleted
              ? "Your parking bay is reserved and your entry OTP has been activated."
              : bookingData
              ? "Booking pending payment. Select a payment method to unlock your gate OTP."
              : "Confirm your reserved parking slot and duration before proceeding to payment."}
          </p>
        </div>

        {/* Error Alert on Overlap Conflict or Validation Failure */}
        {bookingError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-bold text-rose-900">
                  {bookingError.includes("no longer available")
                    ? "Time Slot Unavailable"
                    : "Reservation Notice"}
                </strong>
                <p className="text-xs text-rose-700 mt-0.5">{bookingError}</p>
              </div>
            </div>

            <Link
              href={`/driver/space/${spaceId}`}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white hover:bg-rose-100/60 text-rose-800 px-3.5 py-2 rounded-xl border border-rose-300 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Choose Another Slot</span>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column (3 cols): Summary & Details */}
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

                <h3 className="font-bold text-base text-[#0B1F3A] leading-snug line-clamp-1">
                  {space?.title || "Central Metro Parking Bay"}
                </h3>

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

            {/* Booking Summary Card */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-soft space-y-4">
              <h2 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wider">
                Reservation Summary
              </h2>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">Selected Date</span>
                  </div>
                  <span className="font-bold text-[#0B1F3A]">{displayDate}</span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">Arrival & Departure</span>
                  </div>
                  <span className="font-bold text-[#0B1F3A]">{endTimeStr}</span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <HourglassIcon />
                    <span className="font-medium">Duration</span>
                  </div>
                  <span className="font-bold text-[#0B1F3A]">
                    {duration} {duration === 1 ? "Hour" : "Hours"}
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

                {bookingData && (
                  <div className="flex items-center justify-between py-2.5 bg-emerald-50/60 -mx-2 px-2 rounded-lg">
                    <div className="flex items-center gap-2.5 text-emerald-800">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold">Booking Reference</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-900">
                      #{bookingData.booking_id.slice(0, 8)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Post-Booking Payment Section (Revealed only after create_booking succeeds) */}
            {bookingData && !paymentCompleted && (
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#2FD08A] shadow-soft space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wider">
                    Select Payment Method
                  </h2>
                  <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Status: Pending Payment
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl border-2 border-[#2FD08A] bg-emerald-50/20 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        UPI
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[#0B1F3A]">Instant UPI & QR</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Fastest</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#2FD08A] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between opacity-75">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-700">Credit / Debit Card</span>
                        <p className="text-[11px] text-slate-400">Visa, Mastercard, RuPay</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Available</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessingPayment}
                  className="w-full bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming UPI Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay ₹{totalPrice} & Unlock Gate OTP</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Confirmed Entry Pass (After payment) */}
            {paymentCompleted && bookingData && (
              <div className="bg-white p-6 rounded-2xl border-2 border-[#2FD08A] shadow-soft-lg space-y-4 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#2FD08A] text-[#0B1F3A] flex items-center justify-center font-bold">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#0B1F3A]">Booking Confirmed & Paid</h3>
                      <p className="text-[11px] text-slate-500">Ref #{bookingData.booking_id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    Paid ₹{totalPrice}
                  </span>
                </div>

                {/* Gate Entry OTP Display */}
                <div className="p-4 bg-slate-900 text-white rounded-xl text-center space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#2FD08A]" />
                    Driver Check-in OTP Code
                  </span>
                  <div className="font-mono text-3xl font-extrabold tracking-widest text-[#2FD08A]">
                    {bookingData.otp_code}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Provide this 6-digit code or scan QR at the gate barrier upon arrival.
                  </p>
                </div>

                <Link
                  href="/driver"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#0B1F3A] hover:bg-[#163359] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Driver Map</span>
                </Link>
              </div>
            )}
          </div>

          {/* Right Column (2 cols): Price Breakdown & Primary Action */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-soft-lg space-y-5">
              <h2 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wider">
                Price Breakdown
              </h2>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>
                    ₹{hourlyRate} × {duration} {duration === 1 ? "hour" : "hours"}
                  </span>
                  <span className="font-semibold text-[#0B1F3A]">₹{subtotal}</span>
                </div>

                <div className="flex justify-between">
                  <span>ParKit Safe Parking Guarantee</span>
                  <span className="font-semibold text-emerald-600">Free</span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Taxes & GST</span>
                  <span className="font-semibold text-[#0B1F3A]">₹0</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm text-[#0B1F3A]">
                  <span>Total Amount</span>
                  <span className="text-2xl font-extrabold text-[#0B1F3A]">
                    ₹{totalPrice}
                  </span>
                </div>
              </div>

              {/* Requirement 7 & 8: Primary Action Button calling create_booking before showing payment */}
              {!bookingData && (
                <div>
                  <button
                    type="button"
                    onClick={handleContinueToPayment}
                    disabled={isSubmitting}
                    className={`w-full font-extrabold text-sm sm:text-base py-3.5 px-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      isSubmitting
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] hover:shadow-xl active:scale-[0.98] cursor-pointer"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#0B1F3A]" />
                        <span>Verifying Availability...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to payment</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Reserves your slot and prevents other drivers from booking this time.
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
    </div>
  );
}

function HourglassIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
