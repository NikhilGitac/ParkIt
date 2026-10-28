"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Footer } from "@/components/footer";
import {
  Car,
  Plus,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Building2,
  AlertTriangle,
  Star,
  Users,
  KeyRound,
  Edit3,
  Loader2,
  Sparkles,
  Radio,
  X,
  Phone,
  RefreshCw,
  Sliders,
  Check,
  TrendingUp,
  Inbox,
  AlertCircle,
} from "lucide-react";

export interface OwnerProfile {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  phone?: string;
}

export interface OwnerSpace {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_hour: number;
  photo_url: string;
  is_active: boolean;
  rating: number;
  review_count: number;
  verified_host?: boolean;
  max_vehicle_type?: string;
  created_at?: string;
}

export interface OwnerBooking {
  id: string;
  space_id: string;
  space_title: string;
  space_photo?: string;
  driver_id: string;
  driver_name: string;
  driver_avatar?: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: "pending_payment" | "confirmed" | "checked_in" | "completed" | "cancelled" | string;
  payment_status: "unpaid" | "paid" | "refunded" | string;
  otp_code?: string;
  insurance_plan_name?: string;
  insurance_provider?: string;
  policy_number?: string;
  claim?: {
    id: string;
    damage_type: string;
    status: string;
    incident_at?: string;
  } | null;
  created_at?: string;
}

export interface DashboardMetrics {
  total_earnings: number;
  upcoming_bookings_count: number;
  active_listings_count: number;
  pending_checkins_count: number;
}

export default function DashboardView() {
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [spaces, setSpaces] = useState<OwnerSpace[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_earnings: 0,
    upcoming_bookings_count: 0,
    active_listings_count: 0,
    pending_checkins_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);
  const [showPublishedToast, setShowPublishedToast] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("published") === "true") {
        setShowPublishedToast(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);
  const [isSimulatingBooking, setIsSimulatingBooking] = useState(false);

  // Edit Space Modal State
  const [editingSpace, setEditingSpace] = useState<OwnerSpace | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState<number>(35);
  const [editAddress, setEditAddress] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Toggling space active state
  const [togglingSpaceId, setTogglingSpaceId] = useState<string | null>(null);

  // Load dashboard data from API
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch("/api/owner/dashboard");
      if (res.ok) {
        const data = await res.json();
        setOwner(data.owner);
        setSpaces(data.spaces || []);
        setBookings(data.upcoming_bookings || []);
        setMetrics(data.metrics || {
          total_earnings: 0,
          upcoming_bookings_count: 0,
          active_listings_count: 0,
          pending_checkins_count: 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Requirement 6: Realtime updates using Supabase so new bookings appear without refresh
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to bookings table changes
    const bookingsChannel = supabase
      .channel("owner-bookings-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        (payload: any) => {
          console.log("Realtime event received on bookings:", payload);
          setRealtimeNotification("✨ New booking activity received in real-time!");
          loadDashboardData(true);
          setTimeout(() => setRealtimeNotification(null), 5000);
        }
      )
      .subscribe((status: string) => {
        console.log("Supabase realtime bookings channel status:", status);
      });

    return () => {
      supabase.removeChannel(bookingsChannel);
    };
  }, [loadDashboardData]);

  // Requirement 4: Active/Inactive Toggle Handler
  const handleToggleSpaceStatus = async (space: OwnerSpace) => {
    const newStatus = !space.is_active;
    setTogglingSpaceId(space.id);

    // Optimistic UI update
    setSpaces((prev) =>
      prev.map((s) => (s.id === space.id ? { ...s, is_active: newStatus } : s))
    );
    setMetrics((prev) => ({
      ...prev,
      active_listings_count: newStatus
        ? prev.active_listings_count + 1
        : Math.max(0, prev.active_listings_count - 1),
    }));

    try {
      const res = await fetch(`/api/owner/spaces/${space.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!res.ok) {
        // Rollback on failure
        setSpaces((prev) =>
          prev.map((s) => (s.id === space.id ? { ...s, is_active: space.is_active } : s))
        );
      }
    } catch (err) {
      console.error("Failed to toggle space status:", err);
      // Rollback
      setSpaces((prev) =>
        prev.map((s) => (s.id === space.id ? { ...s, is_active: space.is_active } : s))
      );
    } finally {
      setTogglingSpaceId(null);
    }
  };

  // Requirement 8: Open Edit Space Modal
  const handleOpenEditModal = (space: OwnerSpace) => {
    setEditingSpace(space);
    setEditTitle(space.title);
    setEditPrice(space.price_per_hour);
    setEditAddress(space.address);
    setEditDescription(space.description);
    setEditIsActive(space.is_active);
    setEditError(null);
  };

  // Save Edit Space
  const handleSaveEditSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpace) return;

    setIsSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/owner/spaces/${editingSpace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          price_per_hour: Number(editPrice),
          address: editAddress,
          description: editDescription,
          is_active: editIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save space changes");
      }

      // Update local spaces list
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === editingSpace.id
            ? {
                ...s,
                title: editTitle,
                price_per_hour: Number(editPrice),
                address: editAddress,
                description: editDescription,
                is_active: editIsActive,
              }
            : s
        )
      );

      setEditingSpace(null);
    } catch (err: any) {
      setEditError(err.message || "Failed to update listing.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Demo helper: simulate incoming booking for instant realtime demonstration
  const handleSimulateIncomingBooking = async () => {
    setIsSimulatingBooking(true);
    try {
      const targetSpace = spaces[0];
      const res = await fetch("/api/owner/bookings/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id: targetSpace?.id,
          space_title: targetSpace?.title,
          price_per_hour: targetSpace?.price_per_hour || 45,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRealtimeNotification(`✨ Incoming booking simulated: ${data.booking.driver_name} booked ${data.booking.space_title}!`);
        await loadDashboardData(true);
        setTimeout(() => setRealtimeNotification(null), 5000);
      }
    } catch (e) {
      console.error("Simulation failed:", e);
    } finally {
      setIsSimulatingBooking(false);
    }
  };

  // Format booking time window
  const formatTimeSlot = (startIso: string, endIso: string) => {
    try {
      const s = new Date(startIso);
      const e = new Date(endIso);

      const isToday = new Date().toDateString() === s.toDateString();
      const datePrefix = isToday
        ? "Today"
        : s.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const formatT = (d: Date) => {
        const h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, "0");
        const period = h >= 12 ? "PM" : "AM";
        const dh = h % 12 === 0 ? 12 : h % 12;
        return `${dh}:${m} ${period}`;
      };

      return `${datePrefix} • ${formatT(s)} — ${formatT(e)}`;
    } catch {
      return "Scheduled Arrival";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-[#0B1F3A]">Loading ParKit Host Dashboard...</p>
            <p className="text-xs text-slate-400">Fetching listings, earnings, and live reservations</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0B1F3A]">
      {/* Realtime Notification Banner */}
      {realtimeNotification && (
        <div className="sticky top-16 z-50 bg-[#0B1F3A] text-white px-4 py-2.5 shadow-lg border-b border-[#2FD08A]/40 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2FD08A] animate-ping" />
              <span className="font-bold text-[#2FD08A]">{realtimeNotification}</span>
            </div>
            <button
              onClick={() => setRealtimeNotification(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 pb-20">
        {/* Space Published Success Notification */}
        {showPublishedToast && (
          <div className="bg-[#2FD08A] text-[#0B1F3A] px-4 py-3.5 shadow-md border-b border-[#26b878] flex items-center justify-between">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 stroke-[2.5]" />
                <span className="font-extrabold">
                  🎉 Parking space published successfully! Your listing is now live in your dashboard and on the driver map.
                </span>
              </div>
              <button
                onClick={() => setShowPublishedToast(false)}
                className="p-1 hover:bg-black/10 rounded-lg transition-colors ml-4"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {/* Requirement 1: Welcome Header with the Owner's Name */}
        <section className="bg-[#0B1F3A] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#2FD08A] bg-slate-800 shrink-0 shadow-md">
                  <Image
                    src={
                      owner?.avatar_url ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={owner?.full_name || "Owner"}
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2FD08A]/20 border border-[#2FD08A]/40 px-3 py-0.5 text-xs font-bold text-[#2FD08A]">
                      <Radio className="w-3 h-3 animate-pulse text-[#2FD08A]" />
                      Verified Host
                    </span>
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                      Greater Noida, UP
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                    Welcome back, {owner?.full_name || "Host"}
                  </h1>

                  <p className="mt-1 text-xs sm:text-sm text-slate-300">
                    Your Airbnb-inspired host hub. Manage parking bays, monitor live arrivals, and track payouts.
                  </p>
                </div>
              </div>

              {/* Header Actions: Requirement 8 (Add Space) + Realtime Refresh / Simulation */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSimulateIncomingBooking}
                  disabled={isSimulatingBooking}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                  title="Simulate an incoming driver reservation for realtime demo"
                >
                  {isSimulatingBooking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2FD08A]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#2FD08A]" />
                  )}
                  <span>Simulate Realtime Booking</span>
                </button>

                <button
                  type="button"
                  onClick={() => loadDashboardData(true)}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="Refresh Dashboard"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#2FD08A]" : ""}`} />
                </button>

                <Link
                  href="/owner/list-space"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2FD08A] hover:bg-[#26b878] px-5 py-2.5 text-xs sm:text-sm font-extrabold text-[#0B1F3A] shadow-soft transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>Add a New Space</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Requirement 2: Summary Cards (-mt-8 to overlap beautifully with hero) */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Earnings */}
            <div className="rounded-[16px] bg-white p-5 shadow-soft border border-slate-200/90 transition-all hover:shadow-soft-lg group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Earnings
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#0B1F3A]">
                  ₹{metrics.total_earnings.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4% from last month</span>
              </div>
            </div>

            {/* 2. Upcoming Bookings */}
            <div className="rounded-[16px] bg-white p-5 shadow-soft border border-slate-200/90 transition-all hover:shadow-soft-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Upcoming Bookings
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-[#0B1F3A]">
                  {metrics.upcoming_bookings_count}
                </span>
              </div>
              <div className="mt-2 text-xs font-medium text-slate-500">
                Reserved driver slots today & this week
              </div>
            </div>

            {/* 3. Active Listings */}
            <div className="rounded-[16px] bg-white p-5 shadow-soft border border-slate-200/90 transition-all hover:shadow-soft-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active Listings
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2FD08A] flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#0B1F3A]">
                  {metrics.active_listings_count}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  of {spaces.length} total
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#26b878]">
                <span className="w-2 h-2 rounded-full bg-[#2FD08A]" />
                <span>Live & Discoverable by Drivers</span>
              </div>
            </div>

            {/* 4. Pending Check-ins */}
            <div className="rounded-[16px] bg-white p-5 shadow-soft border border-slate-200/90 transition-all hover:shadow-soft-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pending Check-ins
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#0B1F3A]">
                  {metrics.pending_checkins_count}
                </span>
                <span className="text-xs font-semibold text-amber-700">Awaiting Gate OTP</span>
              </div>
              <div className="mt-2 text-xs font-medium text-slate-500">
                Drivers confirmed & paid arriving soon
              </div>
            </div>
          </div>
        </section>

        {/* Realtime Socket Status Bar */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-slate-100/80 rounded-xl px-4 py-2.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-[#2FD08A] animate-pulse" />
              <span className="font-bold text-[#0B1F3A]">Supabase Realtime Channel: Active</span>
              <span className="text-slate-400">• New bookings & OTP verifications stream instantly</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              City: Greater Noida, UP • Currency: INR (₹)
            </span>
          </div>
        </section>

        {/* Main Content Layout: Left Grid for Spaces, Right Column for Upcoming Bookings */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT SECTION (7 cols): Parking Spaces List & Active Toggle */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0B1F3A] tracking-tight">
                    Your Parking Spaces
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {spaces.length} {spaces.length === 1 ? "space" : "spaces"} listed in Greater Noida
                  </p>
                </div>

                <Link
                  href="/owner/list-space"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A] hover:text-[#26b878] bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Space</span>
                </Link>
              </div>

              {/* Requirement 7: Empty state for No Spaces */}
              {spaces.length === 0 ? (
                <div className="rounded-[16px] bg-white p-12 text-center shadow-soft border border-slate-200/90 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Car className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0B1F3A]">
                      No parking spaces listed yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Turn your empty driveway, private carport, or commercial bay into passive income with ParKit.
                    </p>
                  </div>
                  <Link
                    href="/owner/list-space"
                    className="inline-flex items-center gap-2 bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-soft transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>List Your First Space</span>
                  </Link>
                </div>
              ) : (
                /* Requirement 3 & 4: Space Listing Cards with Toggle & Edit Buttons */
                <div className="space-y-5">
                  {spaces.map((space) => (
                    <div
                      key={space.id}
                      className="rounded-[16px] bg-white overflow-hidden shadow-soft border border-slate-200/90 transition-all hover:shadow-soft-lg flex flex-col sm:flex-row group"
                    >
                      {/* Large Photo with Overlays */}
                      <div className="relative w-full sm:w-56 h-48 sm:h-auto bg-slate-100 shrink-0">
                        <Image
                          src={space.photo_url || "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80"}
                          alt={space.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:hidden" />

                        {/* Price Badge on Photo */}
                        <div className="absolute bottom-3 left-3 rounded-xl bg-white/95 backdrop-blur px-2.5 py-1 text-xs font-extrabold text-[#0B1F3A] shadow-md border border-slate-200">
                          ₹{space.price_per_hour}/hr
                        </div>

                        {/* Status Ribbon */}
                        <div
                          className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow ${
                            space.is_active ? "bg-emerald-500" : "bg-slate-500"
                          }`}
                        >
                          {space.is_active ? "Live" : "Paused"}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          {/* Title & Rating */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-extrabold text-base text-[#0B1F3A] leading-snug line-clamp-1">
                                {space.title}
                              </h3>
                              {space.verified_host && (
                                <span className="inline-flex items-center gap-1 bg-[#2FD08A]/20 text-[#0B1F3A] border border-[#2FD08A]/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                                  <ShieldCheck className="w-3 h-3 text-[#2FD08A]" />
                                  Verified Host
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-xs font-bold text-[#0B1F3A] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                              <Star className="w-3.5 h-3.5 fill-[#FFC93C] text-[#FFC93C]" />
                              <span>{space.rating || 4.8}</span>
                              <span className="text-[10px] font-normal text-slate-400">
                                ({space.review_count || 12})
                              </span>
                            </div>
                          </div>

                          {/* Address */}
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 line-clamp-1">
                            <MapPin className="w-3.5 h-3.5 text-[#2FD08A] shrink-0" />
                            <span className="truncate">{space.address}</span>
                          </p>

                          {/* Description */}
                          <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                            {space.description}
                          </p>
                        </div>

                        {/* Bottom Actions: Active Toggle + Edit Button */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                          {/* Active / Inactive Toggle (Requirement 4) */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleSpaceStatus(space)}
                              disabled={togglingSpaceId === space.id}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                space.is_active ? "bg-[#2FD08A]" : "bg-slate-300"
                              }`}
                              title={space.is_active ? "Click to Pause Listing" : "Click to Activate Listing"}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                                  space.is_active ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                            <span className="text-xs font-bold text-slate-600 select-none">
                              {space.is_active ? "Active" : "Paused"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Requirement 8: Edit Space Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(space)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* View Listing Button */}
                            <Link
                              href={`/driver/space/${space.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#0B1F3A] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Preview driver listing"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT SECTION (5 cols): Upcoming Bookings (Requirement 5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0B1F3A] tracking-tight">
                    Upcoming Bookings
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live driver arrivals & OTP gate check-ins
                  </p>
                </div>

                <span className="text-xs font-bold bg-[#0B1F3A] text-[#2FD08A] px-2.5 py-1 rounded-full">
                  {bookings.length} Bookings
                </span>
              </div>

              {/* Requirement 7: Empty state for No Bookings */}
              {bookings.length === 0 ? (
                <div className="rounded-[16px] bg-white p-8 text-center shadow-soft border border-slate-200/90 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1F3A]">
                      No upcoming bookings right now
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      As soon as drivers reserve one of your spaces, their arrival times, payment status, and gate pass will appear here live.
                    </p>
                  </div>
                </div>
              ) : (
                /* Requirement 5: Upcoming Bookings Cards */
                <div className="space-y-4">
                  {bookings.map((booking) => {
                    const isPendingCheckin = booking.status === "confirmed";
                    const isCheckedIn = booking.status === "checked_in";
                    const isPendingPayment = booking.status === "pending_payment";

                    return (
                      <div
                        key={booking.id}
                        className={`rounded-[16px] bg-white p-5 shadow-soft border transition-all hover:shadow-soft-lg space-y-3.5 ${
                          isPendingCheckin
                            ? "border-emerald-300 ring-2 ring-emerald-100"
                            : "border-slate-200/90"
                        }`}
                      >
                        {/* Driver Info & Amount */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              <Image
                                src={
                                  booking.driver_avatar ||
                                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
                                }
                                alt={booking.driver_name}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-[#0B1F3A]">
                                {booking.driver_name}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Verified Driver
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-extrabold text-base text-[#0B1F3A] block">
                              ₹{booking.total_price}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 uppercase">
                              {booking.payment_status === "paid" ? "Paid Online" : "Payment Pending"}
                            </span>
                          </div>
                        </div>

                        {/* Driver Selected Insurance Plan & Read-Only Claim (if exists) */}
                        <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#2FD08A] shrink-0" />
                            <span className="font-bold text-[#0B1F3A]">
                              {booking.insurance_plan_name || "ParkIt Protect Basic"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({booking.policy_number || "PK-2026-ACTIVE"})
                            </span>
                          </div>

                          {booking.claim ? (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>
                                Claim filed: {booking.claim.damage_type.replace("_", " ")}, {booking.claim.status.replace("_", " ")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              No claims filed
                            </span>
                          )}
                        </div>

                        {/* Space & Time Slot */}
                        <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-[#0B1F3A]">
                            <Car className="w-3.5 h-3.5 text-[#2FD08A] shrink-0" />
                            <span className="truncate">{booking.space_title}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatTimeSlot(booking.start_time, booking.end_time)}</span>
                          </div>
                        </div>

                        {/* Status Badge & Check-in Action */}
                        <div className="flex items-center justify-between pt-1">
                          {/* Status Badge */}
                          {isPendingPayment && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending Payment
                            </span>
                          )}

                          {isPendingCheckin && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                              <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
                              Confirmed (Ready for OTP)
                            </span>
                          )}

                          {isCheckedIn && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-300 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                              Checked In (Gate Barrier Opened)
                            </span>
                          )}

                          {booking.status === "completed" && (
                            <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                              Completed
                            </span>
                          )}

                          {booking.status === "cancelled" && (
                            <span className="text-[11px] font-bold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full">
                              Cancelled
                            </span>
                          )}

                          {/* Quick Link to Owner Verification Screen */}
                          <Link
                            href={`/verify/${booking.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1F3A] hover:text-[#26b878] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-[#2FD08A]" />
                            <span>Verify OTP</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Requirement 8: Edit Space Modal */}
      {editingSpace && (
        <div className="fixed inset-0 z-50 bg-[#0B1F3A]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-[#0B1F3A]">
                  Edit Parking Space
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update listing details, pricing, and live availability.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingSpace(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditSpace} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Space Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#0B1F3A] focus:outline-none focus:border-[#2FD08A]"
                />
              </div>

              {/* Price Per Hour */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Price per Hour (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0B1F3A] focus:outline-none focus:border-[#2FD08A]"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#0B1F3A] focus:outline-none focus:border-[#2FD08A]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Description & Driver Notes
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#0B1F3A] focus:outline-none focus:border-[#2FD08A]"
                />
              </div>

              {/* Active Switch */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0B1F3A] block">
                    Listing Status
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Visible to drivers on the map search
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    editIsActive ? "bg-[#2FD08A]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                      editIsActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSpace(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] text-xs font-extrabold shadow-soft transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B1F3A]" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
