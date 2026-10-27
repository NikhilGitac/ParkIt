"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Car,
  KeyRound,
  AlertTriangle,
  Loader2,
  Calendar,
  MapPin,
  Check,
  ArrowLeft,
  XCircle,
  HelpCircle,
  Sparkles,
  Phone,
} from "lucide-react";

export type BookingStatusType =
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled";

interface VerifyViewProps {
  bookingId: string;
}

export default function VerifyView({ bookingId }: VerifyViewProps) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load booking details
  async function loadBooking() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      const data = await res.json();
      if (res.ok && data.booking) {
        setBooking(data.booking);
      } else {
        setErrorMsg(data.error || "Booking not found");
      }
    } catch (e: any) {
      setErrorMsg("Failed to connect to verification server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  // Handle OTP verification submit
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpInput.trim().length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code provided by the driver.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/bookings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          otp_code: otpInput.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error || "Invalid OTP code. Please check with driver.");
        setIsVerifying(false);
        return;
      }

      setSuccessMsg(result.message || "Driver check-in verified successfully!");
      setBooking((prev: any) => ({
        ...prev,
        status: "checked_in",
      }));
    } catch (err: any) {
      setErrorMsg("Verification request failed. Please check network connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  const status: BookingStatusType = booking?.status || "pending_payment";

  // Visual status pill attributes
  const statusConfig: Record<
    BookingStatusType,
    { label: string; badgeClass: string; icon: any; description: string }
  > = {
    pending_payment: {
      label: "Pending Payment",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
      icon: Clock,
      description: "Driver has initiated booking but payment has not cleared yet.",
    },
    confirmed: {
      label: "Confirmed (Ready for Check-In)",
      badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
      icon: CheckCircle2,
      description: "Payment confirmed. Ask driver for 6-digit OTP to authorize gate entry.",
    },
    checked_in: {
      label: "Checked In (Active on Bay)",
      badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
      icon: Check,
      description: "Driver OTP verified. Vehicle authorized and currently occupying parking bay.",
    },
    completed: {
      label: "Completed",
      badgeClass: "bg-purple-100 text-purple-900 border-purple-300",
      icon: CheckCircle2,
      description: "Reservation duration has ended and driver has departed.",
    },
    cancelled: {
      label: "Cancelled",
      badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
      icon: XCircle,
      description: "This reservation was cancelled and is no longer valid.",
    },
  };

  const currentConfig = statusConfig[status] || statusConfig.pending_payment;
  const StatusIcon = currentConfig.icon;

  if (loading && !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold text-[#0B1F3A]">Loading owner verification pass...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-soft max-w-md text-center border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#0B1F3A]">Booking Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">{errorMsg}</p>
          <Link
            href="/driver"
            className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Driver Home
          </Link>
        </div>
      </div>
    );
  }

  const space = booking?.parking_spaces || {};
  const driver = booking?.profiles || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-[#0B1F3A]">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#0B1F3A] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2FD08A] text-[#0B1F3A] flex items-center justify-center font-black">
            P
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">ParKit Gate Access Portal</h1>
            <span className="text-[10px] text-slate-300">Space Owner & Attendant Verification</span>
          </div>
        </div>

        <Link
          href={`/driver/checkout/${bookingId}`}
          className="text-xs font-bold text-[#2FD08A] hover:underline"
        >
          View Driver Checkout
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        {/* Status Indicator Card */}
        <div className={`p-4 sm:p-5 rounded-2xl border mb-6 shadow-sm ${currentConfig.badgeClass}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/80 shadow-sm flex items-center justify-center shrink-0">
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-extrabold opacity-75">
                Current Reservation State
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {currentConfig.label}
              </h2>
              <p className="text-xs opacity-90 mt-0.5">{currentConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Space & Driver Information Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-soft mb-6 space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-[#0B1F3A]">
                {space.title || "Reserved Parking Bay"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {space.address || "Greater Noida, UP"}
              </p>
            </div>
            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
              #{bookingId.slice(0, 8)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Driver Name
              </span>
              <span className="font-bold text-[#0B1F3A] text-sm mt-0.5 block truncate">
                {driver.full_name || "Verified ParKit Driver"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Amount Paid
              </span>
              <span className="font-bold text-[#0B1F3A] text-sm mt-0.5 block">
                ₹{booking.total_price}
              </span>
            </div>

            <div className="col-span-2 p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Reserved Time Window
                  </span>
                  <span className="font-semibold text-slate-700">
                    {new Date(booking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} —{" "}
                    {new Date(booking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {new Date(booking.start_time).toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* State 1: Confirmed -> OTP Entry Form */}
        {status === "confirmed" && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#2FD08A] shadow-soft-lg mb-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#2FD08A]" />
                <h3 className="font-bold text-base text-[#0B1F3A]">
                  Enter 6-Digit Driver OTP
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#26b878] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Awaiting Gate Check-In
              </span>
            </div>

            <p className="text-xs text-slate-500">
              The driver displays their 6-digit OTP on their phone confirmation pass. Enter it below to verify authorization and open the gate.
            </p>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setOtpInput(clean);
                  }}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] font-mono text-3xl font-extrabold py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-[#2FD08A] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2FD08A]/20 transition-all text-[#0B1F3A]"
                />
              </div>

              {/* Demo auto-fill convenience button for hackathon testing */}
              {booking.otp_code && (
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-400">Demo test hint: Driver OTP is {booking.otp_code}</span>
                  <button
                    type="button"
                    onClick={() => setOtpInput(booking.otp_code)}
                    className="text-xs font-bold text-[#26b878] hover:underline cursor-pointer"
                  >
                    Auto-Fill OTP
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying || otpInput.length !== 6}
                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  otpInput.length === 6 && !isVerifying
                    ? "bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] cursor-pointer hover:shadow-lg active:scale-98"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify OTP & Authorize Gate</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* State 2: Already Checked In Banner */}
        {status === "checked_in" && (
          <div className="bg-emerald-50 border-2 border-emerald-400 p-6 rounded-2xl text-center space-y-3 mb-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="font-extrabold text-lg text-emerald-900">
              Gate Access Authorized
            </h3>
            <p className="text-xs text-emerald-800 max-w-sm mx-auto">
              {successMsg || "Driver has been successfully checked in. The assigned parking bay is active."}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-emerald-900 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active on Bay
              </span>
            </div>
          </div>
        )}

        {/* State 3: Pending Payment Warning */}
        {status === "pending_payment" && (
          <div className="bg-amber-50 border border-amber-300 p-5 rounded-2xl text-xs text-amber-900 space-y-2 mb-6">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Awaiting Payment Clearance</span>
            </div>
            <p>
              The driver has not yet completed payment. Once payment is confirmed via UPI, gate check-in will be unlocked automatically.
            </p>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="text-center pt-2">
          <Link
            href="/driver"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0B1F3A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Driver Search</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
