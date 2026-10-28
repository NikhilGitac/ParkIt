"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ParkingSpace,
  fetchSingleSpaceFromSupabase,
  SpaceAvailabilityWindow,
} from "@/lib/parking-data";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/auth-modal";
import { DriverVerificationModal } from "@/components/verification/driver-verification-modal";
import { ProtectCarSection } from "@/components/insurance/protect-car-section";
import {
  InsurancePlan,
  FALLBACK_INSURANCE_PLANS,
  getMinPlatformCoverageLimit,
} from "@/lib/insurance-data";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  Info,
  Calendar as CalendarIcon,
  ChevronRight,
  Car,
  Zap,
  Camera,
  AlertTriangle,
  ArrowRight,
  Share2,
  Heart,
  Phone,
} from "lucide-react";

// Dynamic import for MiniSpaceMap to prevent SSR hydration issues
const MiniSpaceMap = dynamic(() => import("@/components/driver/mini-space-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 sm:h-64 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
      Loading map preview...
    </div>
  ),
});

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Common hourly start times for parking reservations
const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
];

function formatTimeSlot(timeStr: string): string {
  const [h] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:00 ${period}`;
}

function getTodayDateString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getInitialStartTime(): string {
  const now = new Date();
  const nextHour = now.getHours() + 1;
  if (nextHour >= 22) return "08:00";
  if (nextHour < 7) return "08:00";
  return `${String(nextHour).padStart(2, "0")}:00`;
}

function getFormattedOffsetDate(daysOffset: number): { value: string; label: string } {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dateNum = String(d.getDate()).padStart(2, "0");
  const value = `${y}-${m}-${dateNum}`;
  const label = daysOffset === 0 ? "Today" : daysOffset === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return { value, label };
}

export default function SpaceDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [space, setSpace] = useState<ParkingSpace | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Booking Form State
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [startTime, setStartTime] = useState<string>(getInitialStartTime());
  const [durationHours, setDurationHours] = useState<number>(2);

  // Driver Authentication state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDriverVerifyModal, setShowDriverVerifyModal] = useState(false);
  const [driverStatus, setDriverStatus] = useState<string>("unverified");
  const [driverPhone, setDriverPhone] = useState<string>("");

  // Insurance Plans state (Driver vehicle protection)
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>(FALLBACK_INSURANCE_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("plan_protect_basic");

  // Load insurance plans from DB
  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch("/api/insurance/plans");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.plans) && data.plans.length > 0) {
            setInsurancePlans(data.plans);
            // Default to basic platform plan if found
            const basic = data.plans.find(
              (p: InsurancePlan) =>
                p.plan_type === "platform" && p.plan_name.toLowerCase().includes("basic")
            );
            if (basic) {
              setSelectedPlanId(basic.id);
            } else {
              setSelectedPlanId(data.plans[0].id);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load insurance plans from DB, using fallbacks:", err);
      }
    }
    loadPlans();
  }, []);

  // Monitor Supabase Auth state for the driver
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch driver verification status whenever user changes
  useEffect(() => {
    async function checkDriverStatus() {
      if (!currentUser) {
        setDriverStatus("unverified");
        return;
      }
      try {
        const res = await fetch("/api/verify/status");
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.driver_status) {
            setDriverStatus(data.profile.driver_status);
          }
          if (data.profile?.phone) {
            setDriverPhone(data.profile.phone);
          }
        }
      } catch (err) {
        console.warn("Could not check driver verification status:", err);
      }
    }
    checkDriverStatus();
  }, [currentUser]);

  // Fetch full space details from Supabase (or fallback)
  useEffect(() => {
    async function loadSpace() {
      setLoading(true);
      const data = await fetchSingleSpaceFromSupabase(id);
      setSpace(data);
      setLoading(false);
    }
    loadSpace();
  }, [id]);

  // Privacy Rule: Check if driver has a confirmed/paid booking or is the owner
  const [hasPaidBooking, setHasPaidBooking] = useState(false);

  useEffect(() => {
    async function checkBookingAccess() {
      if (!currentUser || !space) {
        setHasPaidBooking(false);
        return;
      }

      // Space owner has immediate access
      if (currentUser.id === space.owner_id) {
        setHasPaidBooking(true);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("bookings")
          .select("id, status")
          .eq("space_id", space.id)
          .eq("driver_id", currentUser.id)
          .in("status", ["confirmed", "checked_in", "completed"])
          .limit(1);

        if (!error && data && data.length > 0) {
          setHasPaidBooking(true);
        } else {
          setHasPaidBooking(false);
        }
      } catch {
        setHasPaidBooking(false);
      }
    }

    checkBookingAccess();
  }, [currentUser, space]);

  const isAuthorized = Boolean(
    currentUser && (currentUser.id === space?.owner_id || hasPaidBooking)
  );

  const publicAddress = useMemo(() => {
    if (!space) return "";
    const parts = [space.street, space.landmark, space.city, space.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : space.address;
  }, [space]);

  const fullAddress = useMemo(() => {
    if (!space) return "";
    const parts = [
      space.house_no,
      space.building_name,
      space.street,
      space.landmark,
      space.city,
      space.state,
      space.pincode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : space.address;
  }, [space]);

  const displayAddress = isAuthorized ? fullAddress : publicAddress;

  // Determine availability window for the currently selected date
  const selectedDayOfWeek = useMemo(() => {
    if (!selectedDate) return new Date().getDay();
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.getDay();
  }, [selectedDate]);

  const operatingSlotForDay = useMemo(() => {
    if (!space?.availability) return null;
    return space.availability.find((slot) => slot.day_of_week === selectedDayOfWeek) || null;
  }, [space, selectedDayOfWeek]);

  // Check if a specific start time is allowed and within operating hours
  const checkTimeSlotAvailable = (timeStr: string, duration: number): { available: boolean; reason?: string } => {
    if (!space) return { available: true };
    if (!operatingSlotForDay) {
      return { available: false, reason: "Closed on this day" };
    }

    const [startH, startM] = timeStr.split(":").map(Number);
    const candidateStartMinutes = startH * 60 + (startM || 0);
    const candidateEndMinutes = candidateStartMinutes + duration * 60;

    const [opStartH, opStartM] = operatingSlotForDay.start_time.split(":").map(Number);
    const [opEndH, opEndM] = operatingSlotForDay.end_time.split(":").map(Number);
    const opStartMinutes = opStartH * 60 + (opStartM || 0);
    const opEndMinutes = opEndH * 60 + (opEndM || 0);

    // Past time check if selectedDate is today
    const now = new Date();
    const isToday = selectedDate === getTodayDateString();
    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (candidateStartMinutes <= currentMinutes) {
        return { available: false, reason: "Time already passed today" };
      }
    }

    if (candidateStartMinutes < opStartMinutes || candidateEndMinutes > opEndMinutes) {
      return { available: false, reason: `Outside operating hours (${operatingSlotForDay.start_time} - ${operatingSlotForDay.end_time})` };
    }

    return { available: true };
  };

  // Current selected slot validation
  const currentSlotStatus = useMemo(() => {
    return checkTimeSlotAvailable(startTime, durationHours);
  }, [startTime, durationHours, operatingSlotForDay, selectedDate]);

  // Insurance Plan selection & server-side matched calculations
  const selectedPlan = useMemo(() => {
    return (
      insurancePlans.find((p) => p.id === selectedPlanId) ||
      insurancePlans[0] ||
      FALLBACK_INSURANCE_PLANS[0]
    );
  }, [insurancePlans, selectedPlanId]);

  const insurancePremium = useMemo(() => {
    if (!selectedPlan) return 0;
    const flat = Number(selectedPlan.premium_flat || 0);
    const hourly = Number(selectedPlan.premium_per_hour || 0);
    return Math.round(flat + hourly * durationHours);
  }, [selectedPlan, durationHours]);

  const minProtectionLimit = useMemo(() => {
    return getMinPlatformCoverageLimit(insurancePlans);
  }, [insurancePlans]);

  // Calculated pricing (rate * hours + insurance premium)
  const hourlyRate = space?.price_per_hour || 35;
  const subtotal = hourlyRate * durationHours;
  const estimatedTotal = subtotal + insurancePremium;

  const checkoutUrl = useMemo(() => {
    if (!space || !currentSlotStatus.available) return "#";
    const q = new URLSearchParams({
      date: selectedDate,
      startTime: startTime,
      duration: String(durationHours),
      total: String(estimatedTotal),
      rate: String(hourlyRate),
      insurancePlanId: selectedPlan?.id || "",
    });
    return `/driver/checkout/${space.id}?${q.toString()}`;
  }, [space, currentSlotStatus.available, selectedDate, startTime, durationHours, estimatedTotal, hourlyRate, selectedPlan]);

  // Handler to navigate to checkout or trigger driver authentication
  const handleBookNow = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!currentSlotStatus.available || !space) return;

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setShowDriverVerifyModal(true);
  };

  if (loading && !space) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold text-[#0B1F3A]">Loading parking spot details...</p>
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

  const gallery = space.gallery_photos && space.gallery_photos.length > 0
    ? space.gallery_photos
    : [space.photo_url];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 sm:pb-16 text-[#0B1F3A]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/driver"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0B1F3A] hover:text-[#26b878] transition-colors bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Map</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: space.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Listing link copied to clipboard!");
              }
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#0B1F3A] transition-colors"
            title="Share Space"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold bg-[#0B1F3A] text-[#2FD08A] px-2.5 py-1.5 rounded-xl">
            ParKit Driver
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Title Header */}
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 bg-[#2FD08A]/15 text-[#0B1F3A] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#2FD08A]/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2FD08A]" />
              Verified Space
            </span>

            {space.verified_host && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2FD08A]" />
                Verified Host
              </span>
            )}

            {space.is_available_now && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-[#2FD08A] animate-pulse"></span>
                Available Now
              </span>
            )}

            {/* Insured parking badge */}
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2FD08A]" />
              <span>Insured parking • Every booking is protected by ParkIt, up to ₹{minProtectionLimit.toLocaleString("en-IN")} at minimum</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
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
              <span>{displayAddress}</span>
            </div>
          </div>
        </div>

        {/* Airbnb-style Photo Gallery */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-72 sm:h-96 rounded-2xl overflow-hidden shadow-soft border border-slate-200/90">
            {/* Primary Hero Image (Spans 2 columns on desktop) */}
            <div className="relative md:col-span-2 h-full bg-slate-200 overflow-hidden group">
              <Image
                src={gallery[0]}
                alt={space.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-[#0B1F3A]/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                Main Driveway
              </div>
            </div>

            {/* Secondary Photos Grid (Hidden or stacked on mobile) */}
            <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-3 h-full">
              {gallery.slice(1, 4).map((img, i) => (
                <div
                  key={i}
                  className={`relative h-full bg-slate-200 overflow-hidden group cursor-pointer ${
                    i === 0 ? "col-span-2 h-[calc(50%-6px)]" : "h-[calc(50%-6px)]"
                  }`}
                  onClick={() => setActivePhotoIdx(i + 1)}
                >
                  <Image
                    src={img}
                    alt={`${space.title} angle ${i + 1}`}
                    fill
                    sizes="25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2.5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              Real photos of parking bay and driveway
            </span>
            <span className="font-semibold text-[#0B1F3A]">
              Greater Noida, UP
            </span>
          </div>
        </div>

        {/* Two-Column Responsive Layout: Content vs Focused Booking Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols): Details, Host, Amenities, Map Preview, Reviews */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host Public Profile Card */}
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
                {isAuthorized && (space.contact_phone || space.owner_phone) ? (
                  <a
                    href={`tel:${space.contact_phone || space.owner_phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-xl hover:bg-emerald-100 transition-colors shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#2FD08A]" />
                    <span>Call Host: {space.contact_phone || space.owner_phone}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => alert(`Connecting with host ${space.owner_name}... Direct host phone and chat unlock upon confirmed booking.`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1F3A] hover:text-[#26b878] border border-slate-200 px-3 py-2 rounded-xl transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Contact Host</span>
                  </button>
                )}
              </div>
            </div>

            {/* Space Description */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-soft">
              <h2 className="text-base font-bold text-[#0B1F3A] mb-2.5">
                About this parking space
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {space.description}
              </p>
            </div>

            {/* Amenities & Space Features */}
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

            {/* Map Location Preview & Privacy Protection */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-base font-bold text-[#0B1F3A]">
                    Location & Directions
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{displayAddress}</p>
                </div>
                {isAuthorized ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2FD08A]" />
                    Full Address Unlocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Exact House No. Protected
                  </span>
                )}
              </div>

              <MiniSpaceMap
                latitude={space.latitude}
                longitude={space.longitude}
                title={space.title}
                address={displayAddress}
              />

              {/* Unlocked Details for Paid Booking / Owner */}
              {isAuthorized ? (
                <div className="mt-4 rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-[#2FD08A]" />
                    <span>Booking Confirmed — Detailed Entry Information</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Exact Location
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {space.house_no ? `Unit/House: ${space.house_no}` : "House no. not set"}
                        {space.building_name ? ` • ${space.building_name}` : ""}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Host Contact Phone
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-2">
                        <span>{space.contact_phone || space.owner_phone || "Not listed"}</span>
                        {(space.contact_phone || space.owner_phone) && (
                          <a
                            href={`tel:${space.contact_phone || space.owner_phone}`}
                            className="text-[#26b878] hover:underline font-bold"
                          >
                            Call Now
                          </a>
                        )}
                      </p>
                    </div>
                  </div>

                  {space.entry_instructions && (
                    <div className="p-2.5 rounded-lg bg-white border border-emerald-100 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Gate Entry Instructions
                      </span>
                      <p className="font-mono text-slate-800 mt-0.5">
                        {space.entry_instructions}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/80 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A] mb-1">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Driver Privacy Shield Active</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Exact house number, building name, gate entry instructions, and host phone number are revealed immediately after completing a confirmed booking.
                  </p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-slate-400 font-medium">
                      House No: <span className="font-bold text-slate-600">🔒 Locked</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-slate-400 font-medium">
                      Building: <span className="font-bold text-slate-600">🔒 Locked</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-slate-400 font-medium">
                      Instructions: <span className="font-bold text-slate-600">🔒 Locked</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-slate-400 font-medium">
                      Host Phone: <span className="font-bold text-slate-600">🔒 Locked</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Operating Availability Schedule */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-[#0B1F3A]">
                    Weekly Operating Hours
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reservations are valid strictly within these confirmed windows
                  </p>
                </div>
                <span className="text-xs font-bold text-[#26b878] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                  Recurring Schedule
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DAY_NAMES.map((dayName, dayIndex) => {
                  const windowSlot = space.availability?.find((s) => s.day_of_week === dayIndex);
                  const isSelectedDay = dayIndex === selectedDayOfWeek;

                  return (
                    <div
                      key={dayIndex}
                      className={`flex items-center justify-between text-xs py-2 px-3 rounded-xl border transition-colors ${
                        isSelectedDay
                          ? "bg-emerald-50/80 border-[#2FD08A] ring-1 ring-[#2FD08A]/30"
                          : "bg-slate-50/70 border-slate-100"
                      }`}
                    >
                      <span className={`font-bold ${isSelectedDay ? "text-[#0B1F3A]" : "text-slate-700"}`}>
                        {dayName} {isSelectedDay && "(Selected)"}
                      </span>
                      {windowSlot ? (
                        <span className="font-semibold text-slate-700">
                          {windowSlot.start_time} — {windowSlot.end_time}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Closed</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Authentic Reviews Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-soft">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-[#FFC93C] text-[#FFC93C]" />
                  <span className="text-lg font-extrabold text-[#0B1F3A]">
                    {space.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-500 font-medium">
                    ({space.review_count} driver reviews)
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  100% Verified Drivers
                </span>
              </div>

              {/* Review Cards List */}
              <div className="space-y-4">
                {space.reviews && space.reviews.length > 0 ? (
                  space.reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#0B1F3A] text-[#2FD08A] flex items-center justify-center font-bold text-xs">
                            {rev.driver_name.charAt(0)}
                          </div>
                          <span className="font-bold text-xs text-[#0B1F3A]">
                            {rev.driver_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-[#FFC93C] text-[#FFC93C]" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        "{rev.comment}"
                      </p>
                      <span className="text-[10px] text-slate-400 mt-2 block">
                        Verified stay • {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "Recent"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-3">
                    No reviews yet. Be the first to park here!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Uber-like Focused Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-soft-lg space-y-5">
              {/* Price Header */}
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
                    ₹{hourlyRate}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">/ hour</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#0B1F3A]">
                  <Star className="w-3.5 h-3.5 fill-[#FFC93C] text-[#FFC93C]" />
                  <span>{space.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({space.review_count})</span>
                </div>
              </div>

              {/* 1. Date Selector */}
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1.5 uppercase tracking-wider">
                  1. Select Date
                </label>
                {/* Quick Date Pills: Today, Tomorrow, +2 Days */}
                <div className="flex gap-1.5 mb-2">
                  {[0, 1, 2].map((offset) => {
                    const info = getFormattedOffsetDate(offset);
                    const isSelected = selectedDate === info.value;
                    return (
                      <button
                        key={offset}
                        type="button"
                        onClick={() => setSelectedDate(info.value)}
                        className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                          isSelected
                            ? "bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer"
                        }`}
                      >
                        {info.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <input
                    type="date"
                    min={getTodayDateString()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    suppressHydrationWarning
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Day: {DAY_NAMES[selectedDayOfWeek]}</span>
                  {operatingSlotForDay ? (
                    <span className="text-[#26b878] font-bold">
                      Open {operatingSlotForDay.start_time} - {operatingSlotForDay.end_time}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold">Closed on {DAY_NAMES[selectedDayOfWeek]}</span>
                  )}
                </div>
              </div>

              {/* 2. Start Time Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    2. Arrival Time
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Selected: {formatTimeSlot(startTime)}
                  </span>
                </div>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  suppressHydrationWarning
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40 cursor-pointer"
                >
                  {TIME_SLOTS.map((t) => {
                    const status = checkTimeSlotAvailable(t, durationHours);
                    return (
                      <option key={t} value={t} disabled={!status.available}>
                        {formatTimeSlot(t)} {!status.available ? `(${status.reason || "Unavailable"})` : "✓ Available"}
                      </option>
                    );
                  })}
                </select>

                {/* Quick available time pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {TIME_SLOTS.filter((t) => checkTimeSlotAvailable(t, durationHours).available)
                    .slice(0, 4)
                    .map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setStartTime(t)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          startTime === t
                            ? "bg-[#2FD08A] text-[#0B1F3A] border-[#2FD08A] shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {formatTimeSlot(t)}
                      </button>
                    ))}
                </div>
              </div>

              {/* 3. Duration Selector */}
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1.5 uppercase tracking-wider">
                  3. Duration
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4, 6, 8, 10, 12].map((hrs) => {
                    const testStatus = checkTimeSlotAvailable(startTime, hrs);
                    const isSelected = durationHours === hrs;

                    return (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => setDurationHours(hrs)}
                        disabled={!testStatus.available}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          isSelected
                            ? "bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-sm"
                            : !testStatus.available
                            ? "bg-slate-100 text-slate-400 border-slate-200/50 cursor-not-allowed line-through"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer"
                        }`}
                      >
                        {hrs}h
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Protect your car Section (Grouping ParkIt plans & Partner insurers) */}
              <ProtectCarSection
                plans={insurancePlans}
                selectedPlanId={selectedPlan?.id || selectedPlanId}
                onSelectPlan={setSelectedPlanId}
                durationHours={durationHours}
              />

              {/* Live Price Breakdown */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    ₹{hourlyRate} × {durationHours} {durationHours === 1 ? "hour" : "hours"}
                  </span>
                  <span className="font-semibold text-[#0B1F3A]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2FD08A]" />
                    <span className="font-medium text-[#0B1F3A]">{selectedPlan?.plan_name || "Vehicle Protection"}</span>
                    <span className="text-[10px] text-slate-400">({selectedPlan?.provider || "ParkIt"})</span>
                  </div>
                  <span className={`font-semibold ${insurancePremium === 0 ? "text-emerald-600" : "text-[#0B1F3A]"}`}>
                    {insurancePremium === 0 ? "Included" : `+₹${insurancePremium}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm text-[#0B1F3A]">
                  <span>Total (incl. taxes)</span>
                  <span className="text-lg font-extrabold text-[#0B1F3A]">
                    ₹{estimatedTotal}
                  </span>
                </div>
              </div>

              {/* Status Notice if unavailable */}
              {!currentSlotStatus.available && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    {currentSlotStatus.reason || "The selected time window is outside the host's operating schedule."}
                  </span>
                </div>
              )}

              {/* Prominent Green "Book now" Button */}
              <button
                type="button"
                disabled={!currentSlotStatus.available}
                onClick={handleBookNow}
                className={`w-full font-extrabold text-sm sm:text-base py-3.5 px-5 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  currentSlotStatus.available
                    ? "bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] hover:shadow-xl active:scale-[0.98] cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                <span>Book now</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="text-center">
                <p className="text-[11px] text-slate-400">
                  You won't be charged yet until reviewing on checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Booking Footer (Always accessible on phones) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-[#0B1F3A]">
              ₹{estimatedTotal}
            </span>
            <span className="text-xs text-slate-500 font-medium">for {durationHours}h</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {formatTimeSlot(startTime)} on {selectedDate.slice(5)}
          </span>
        </div>

        <button
          type="button"
          disabled={!currentSlotStatus.available}
          onClick={handleBookNow}
          className={`font-extrabold text-sm py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
            currentSlotStatus.available
              ? "bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] active:scale-95 cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <span>Book now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Authentication Modal shown when unauthenticated user attempts to book */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectUrl={checkoutUrl}
        title={`Sign in to book "${space.title}"`}
        subtitle="Sign in or create a quick driver account to reserve this spot and receive instant gate entry OTP."
        onSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
          setShowDriverVerifyModal(true);
        }}
      />

      {/* Driver Verification & Instant Reservation Modal (Demo Mode) */}
      <DriverVerificationModal
        isOpen={showDriverVerifyModal}
        onClose={() => setShowDriverVerifyModal(false)}
        spaceId={space.id}
        spaceTitle={space.title}
        spaceAddress={displayAddress}
        hourlyRate={hourlyRate}
        durationHours={durationHours}
        totalPrice={estimatedTotal}
        selectedDate={selectedDate}
        startTime={startTime}
        initialPhone={driverPhone || currentUser?.phone || ""}
        isAlreadyVerified={driverStatus === "verified"}
        selectedPlan={selectedPlan}
        insurancePremium={insurancePremium}
        onReservationComplete={() => {
          setHasPaidBooking(true);
          setShowDriverVerifyModal(false);
        }}
      />
    </div>
  );
}
