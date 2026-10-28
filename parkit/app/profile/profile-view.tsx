"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Car,
  Building2,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  QrCode,
  KeyRound,
  ExternalLink,
  ChevronRight,
  LogOut,
  Loader2,
  X,
  Check,
  Compass,
  ArrowRight,
  Eye,
  EyeOff,
  Percent,
  TrendingUp,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  InsurancePlan,
  InsuranceClaim,
  FALLBACK_INSURANCE_PLANS,
  DAMAGE_TYPE_LABELS,
} from "@/lib/insurance-data";
import { ClaimModal } from "@/components/insurance/claim-modal";
import { PolicySummaryModal } from "@/components/insurance/policy-summary-modal";

interface ProfileViewProps {
  userId: string;
  userEmail: string;
}

interface ProfileData {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  city: string;
  created_at: string;
  host_status: string;
  driver_status: string;
  id_type: string | null;
  id_last4: string | null;
}

interface Vehicle {
  id: string;
  plate: string;
  type: string;
  created_at: string;
}

interface DriverBooking {
  id: string;
  space_id: string;
  space_title: string;
  space_photo: string | null;
  public_address: string;
  latitude?: number;
  longitude?: number;
  house_no?: string | null;
  building_name?: string | null;
  host_phone?: string | null;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  payment_status: string;
  otp_code?: string | null;
  insurance_plan_id?: string | null;
  insurance_premium?: number | null;
  policy_number?: string | null;
  insurance_status?: string | null;
  insurance_plan?: InsurancePlan | null;
  claims?: InsuranceClaim[];
  created_at: string;
}

interface HostSpace {
  id: string;
  title: string;
  description?: string;
  address: string;
  street?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  price_per_hour: number;
  photo_url?: string;
  is_active: boolean;
  total_slots: number;
  max_vehicle_type?: string;
  verified_host?: boolean;
  created_at: string;
  space_availability?: any[];
}

interface HostBooking {
  id: string;
  space_id: string;
  space_title: string;
  driver_first_name: string;
  driver_avatar: string | null;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  payment_status: string;
  is_otp_verified: boolean;
  insurance_plan_name?: string | null;
  insurance_provider?: string | null;
  policy_number?: string | null;
  claim?: {
    id: string;
    damage_type: string;
    status: string;
    incident_at?: string;
  } | null;
  created_at: string;
}

function formatISTDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

function formatISTTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "PK";
}

export default function ProfileView({ userId, userEmail }: ProfileViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [driverBookings, setDriverBookings] = useState<DriverBooking[]>([]);
  const [hostSpaces, setHostSpaces] = useState<HostSpace[]>([]);
  const [hostBookings, setHostBookings] = useState<HostBooking[]>([]);
  const [driverMetrics, setDriverMetrics] = useState<any>({
    total_bookings: 0,
    total_spent: 0,
    upcoming_count: 0,
    vehicles_saved: 0,
  });
  const [hostMetrics, setHostMetrics] = useState<any>({
    spaces_listed: 0,
    active_listings: 0,
    total_earnings: 0,
    upcoming_bookings: 0,
    pending_checkins: 0,
    occupancy_this_month: 0,
    earnings_this_month: 0,
    earnings_last_7_days: 0,
  });

  // Active Tab: account | driver | host
  const tabFromQuery = searchParams.get("tab");
  const editFromQuery = searchParams.get("edit") === "1";

  const [activeTab, setActiveTab] = useState<"account" | "driver" | "host">("account");
  const [isEditing, setIsEditing] = useState(editFromQuery);

  // Filter chips for Driver and Host bookings
  const [driverFilter, setDriverFilter] = useState<"all" | "upcoming" | "active" | "past" | "cancelled">("all");
  const [hostFilter, setHostFilter] = useState<"all" | "upcoming" | "active" | "past" | "cancelled">("all");

  // Expanded OTP / QR cards in driver tab
  const [expandedEntryCodes, setExpandedEntryCodes] = useState<Record<string, boolean>>({});

  // Account Edit Form State
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editCity, setEditCity] = useState("Greater Noida");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaveToast, setProfileSaveToast] = useState<string | null>(null);

  // Add Vehicle Form State
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehiclePlate, setNewVehiclePlate] = useState("");
  const [newVehicleType, setNewVehicleType] = useState("sedan");
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [addVehicleError, setAddVehicleError] = useState<string | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);

  // Toggle Space Status in Host Tab
  const [togglingSpaceId, setTogglingSpaceId] = useState<string | null>(null);

  // Insurance & Claims state
  const [driverClaims, setDriverClaims] = useState<InsuranceClaim[]>([]);
  const [selectedBookingForClaim, setSelectedBookingForClaim] = useState<DriverBooking | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedBookingForPolicy, setSelectedBookingForPolicy] = useState<DriverBooking | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Logout state
  const [loggingOut, setLoggingOut] = useState(false);

  // Load Profile Data from API
  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setVehicles(data.vehicles || []);
        setDriverBookings(data.driver?.bookings || []);
        setDriverMetrics(data.driver?.metrics || {});
        setHostSpaces(data.host?.spaces || []);
        setHostBookings(data.host?.bookings || []);
        setHostMetrics(data.host?.metrics || {});
        setDriverClaims(data.claims || []);

        // Initialize edit form values
        setEditFullName(data.profile.full_name || "");
        setEditPhone(data.profile.phone || "");
        setEditAvatarUrl(data.profile.avatar_url || "");
        setEditCity(data.profile.city || "Greater Noida");

        // Determine Default Tab Logic if not provided in URL
        if (!tabFromQuery) {
          const hasHostActivity = (data.host?.spaces || []).length > 0;
          const hasDriverActivity =
            (data.driver?.bookings || []).length > 0 || (data.vehicles || []).length > 0;

          if (hasHostActivity && !hasDriverActivity) {
            setActiveTab("host");
          } else if (hasDriverActivity && !hasHostActivity) {
            setActiveTab("driver");
          } else {
            setActiveTab("account");
          }
        }
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  }, [tabFromQuery]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Sync tab with URL if query changes
  useEffect(() => {
    if (tabFromQuery === "driver" || tabFromQuery === "host" || tabFromQuery === "account") {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  useEffect(() => {
    if (editFromQuery) {
      setIsEditing(true);
      setActiveTab("account");
    }
  }, [editFromQuery]);

  // Tab switch handler with URL update
  const handleTabSwitch = (tab: "account" | "driver" | "host") => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    if (tab !== "account") {
      params.delete("edit");
      setIsEditing(false);
    }
    router.replace(`/profile?${params.toString()}`, { scroll: false });
  };

  // Toggle Entry Code accordion
  const toggleEntryCode = (bookingId: string) => {
    setExpandedEntryCodes((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }));
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveError(null);
    setSavingProfile(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editFullName,
          phone: editPhone,
          avatar_url: editAvatarUrl,
          city: editCity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setProfile(data.profile);
      setIsEditing(false);
      setProfileSaveToast("Your profile details have been updated successfully!");
      setTimeout(() => setProfileSaveToast(null), 4000);

      // Dispatch event to update navbar instantly without page reload
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("parkit:profile-updated", {
            detail: {
              full_name: data.profile.full_name,
              avatar_url: data.profile.avatar_url,
              host_status: data.profile.host_status,
              driver_status: data.profile.driver_status,
            },
          })
        );
      }

      // Clean query parameter ?edit=1 if present
      const params = new URLSearchParams(window.location.search);
      params.delete("edit");
      router.replace(`/profile?${params.toString()}`, { scroll: false });
    } catch (err: any) {
      setProfileSaveError(err.message || "Failed to save profile changes.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Add Vehicle Handler
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddVehicleError(null);
    setAddingVehicle(true);

    try {
      const res = await fetch("/api/profile/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate: newVehiclePlate,
          type: newVehicleType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register vehicle.");
      }

      setVehicles((prev) => [data.vehicle, ...prev]);
      setDriverMetrics((prev: any) => ({
        ...prev,
        vehicles_saved: (prev.vehicles_saved || 0) + 1,
      }));
      setNewVehiclePlate("");
      setShowAddVehicleModal(false);
      setProfileSaveToast(`Vehicle ${data.vehicle.plate} added to your account!`);
      setTimeout(() => setProfileSaveToast(null), 4000);
    } catch (err: any) {
      setAddVehicleError(err.message || "Could not add vehicle.");
    } finally {
      setAddingVehicle(false);
    }
  };

  // Delete Vehicle Handler
  const handleDeleteVehicle = async (vehicleId: string, plate: string) => {
    if (!confirm(`Are you sure you want to remove vehicle ${plate}?`)) return;
    setDeletingVehicleId(vehicleId);

    try {
      const res = await fetch(`/api/profile/vehicles/${vehicleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
        setDriverMetrics((prev: any) => ({
          ...prev,
          vehicles_saved: Math.max(0, (prev.vehicles_saved || 1) - 1),
        }));
        setProfileSaveToast(`Vehicle ${plate} removed.`);
        setTimeout(() => setProfileSaveToast(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
    } finally {
      setDeletingVehicleId(null);
    }
  };

  // Toggle Space Status Handler
  const handleToggleSpaceStatus = async (spaceId: string, currentStatus: boolean) => {
    setTogglingSpaceId(spaceId);
    const newStatus = !currentStatus;

    try {
      const res = await fetch(`/api/owner/spaces/${spaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (res.ok) {
        setHostSpaces((prev) =>
          prev.map((s) => (s.id === spaceId ? { ...s, is_active: newStatus } : s))
        );
        setHostMetrics((prev: any) => ({
          ...prev,
          active_listings: prev.active_listings + (newStatus ? 1 : -1),
        }));
      }
    } catch (err) {
      console.error("Failed to toggle space status:", err);
    } finally {
      setTogglingSpaceId(null);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/auth/signout", { method: "POST" });
      router.refresh();
      router.push("/login");
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const isDemoUser = Boolean(
    userEmail === "demo.host@parkit.test" ||
      userEmail === "demo.driver@parkit.test" ||
      userEmail.endsWith("@parkit.test") ||
      userEmail.endsWith("@parkit.internal")
  );

  // Filtered Driver Bookings
  const filteredDriverBookings = useMemo(() => {
    const now = new Date();
    return driverBookings.filter((b) => {
      if (driverFilter === "all") return true;
      if (driverFilter === "cancelled") return b.status === "cancelled";
      if (driverFilter === "upcoming") {
        return (
          ["pending_payment", "confirmed"].includes(b.status) &&
          new Date(b.start_time) > now
        );
      }
      if (driverFilter === "active") {
        return (
          ["confirmed", "checked_in"].includes(b.status) &&
          new Date(b.start_time) <= now &&
          new Date(b.end_time) >= now
        );
      }
      if (driverFilter === "past") {
        return b.status === "completed" || new Date(b.end_time) < now;
      }
      return true;
    });
  }, [driverBookings, driverFilter]);

  // Filtered Host Bookings
  const filteredHostBookings = useMemo(() => {
    const now = new Date();
    return hostBookings.filter((b) => {
      if (hostFilter === "all") return true;
      if (hostFilter === "cancelled") return b.status === "cancelled";
      if (hostFilter === "upcoming") {
        return (
          ["pending_payment", "confirmed"].includes(b.status) &&
          new Date(b.start_time) > now
        );
      }
      if (hostFilter === "active") {
        return (
          ["confirmed", "checked_in"].includes(b.status) &&
          new Date(b.start_time) <= now &&
          new Date(b.end_time) >= now
        );
      }
      if (hostFilter === "past") {
        return b.status === "completed" || new Date(b.end_time) < now;
      }
      return true;
    });
  }, [hostBookings, hostFilter]);

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center py-24 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#2FD08A]" />
          <p className="text-sm font-bold text-[#0B1F3A]">Loading profile details...</p>
        </div>
      </div>
    );
  }

  const initials = getInitials(profile?.full_name, userEmail);

  return (
    <div className="space-y-6 pb-20">
        {/* Toast Notification */}
        {profileSaveToast && (
          <div className="bg-[#2FD08A] text-[#0B1F3A] px-4 py-3 border-b border-[#26b878] shadow-sm animate-in slide-in-from-top duration-200 sticky top-20 z-30">
            <div className="max-w-6xl mx-auto flex items-center justify-between text-xs sm:text-sm font-extrabold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{profileSaveToast}</span>
              </div>
              <button
                onClick={() => setProfileSaveToast(null)}
                className="p-1 hover:bg-black/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TOP PROFILE HEADER CARD */}
        <section className="bg-[#0B1F3A] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left: Avatar + Details */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-[#2FD08A] shrink-0 shadow-md">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#071527] text-[#2FD08A] text-2xl font-black">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {profile?.host_status === "verified" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                        <ShieldCheck className="w-3 h-3 text-[#2FD08A]" /> Verified Host
                      </span>
                    )}
                    {profile?.driver_status === "verified" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                        <Car className="w-3 h-3 text-blue-400" /> Verified Driver
                      </span>
                    )}
                    {isDemoUser && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                        <Sparkles className="w-3 h-3 text-amber-300" /> Demo account
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {profile?.full_name || "ParkIt Member"}
                  </h1>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{userEmail}</span>
                    </span>

                    {profile?.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>+91 {profile.phone}</span>
                      </span>
                    )}

                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile?.city || "Greater Noida, UP"}</span>
                    </span>

                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Member since{" "}
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString("en-IN", {
                              month: "short",
                              year: "numeric",
                            })
                          : "2026"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing((prev) => !prev);
                    if (!isEditing) setActiveTab("account");
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    isEditing
                      ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                      : "bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A]"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "View Profile" : "Edit Profile"}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* NAVIGATION TABS BAR */}
        <div className="bg-white border-b border-slate-200 sticky top-20 z-20 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 sm:gap-8 overflow-x-auto py-2">
              <button
                type="button"
                onClick={() => handleTabSwitch("account")}
                className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "account"
                    ? "border-[#2FD08A] text-[#0B1F3A]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Account</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("driver")}
                className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "driver"
                    ? "border-[#2FD08A] text-[#0B1F3A]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Car className="w-4 h-4 text-emerald-600" />
                <span>Driver Activity</span>
                {driverBookings.length > 0 && (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                    {driverBookings.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("host")}
                className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "host"
                    ? "border-[#2FD08A] text-[#0B1F3A]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Host Activity</span>
                {hostSpaces.length > 0 && (
                  <span className="rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5">
                    {hostSpaces.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TAB CONTENTS CONTAINER */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {/* ========================================================================= */}
          {/* TAB 1: ACCOUNT DETAILS & SETTINGS */}
          {/* ========================================================================= */}
          {activeTab === "account" && (
            <div className="space-y-8">
              {/* Edit Mode Form */}
              {isEditing ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-black text-[#0B1F3A]">Edit Account Profile</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Update your public name, phone number, and location.
                      </p>
                    </div>
                    {isDemoUser && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Demo mode
                      </span>
                    )}
                  </div>

                  {profileSaveError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{profileSaveError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="e.g. Nikhil Yadav"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mobile Phone (10 Digits)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={editPhone}
                            onChange={(e) =>
                              setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                            }
                            placeholder="9810012001"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Must start with 6, 7, 8, or 9.</p>
                      </div>

                      {/* Email (Read-only) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Account Email (Read-only)
                        </label>
                        <input
                          type="email"
                          disabled
                          value={userEmail}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 cursor-not-allowed"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Email cannot be modified for security and booking integrity.
                        </p>
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          City / Region
                        </label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="e.g. Greater Noida"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                        />
                      </div>

                      {/* Avatar Image URL */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Profile Avatar Image URL
                        </label>
                        <input
                          type="url"
                          value={editAvatarUrl}
                          onChange={(e) => setEditAvatarUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditFullName(profile?.full_name || "");
                          setEditPhone(profile?.phone || "");
                          setEditAvatarUrl(profile?.avatar_url || "");
                          setEditCity(profile?.city || "Greater Noida");
                        }}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        {savingProfile ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* View Mode Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Account Details */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#0B1F3A]" />
                        <h3 className="font-extrabold text-sm text-[#0B1F3A]">Account Information</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold text-[#2FD08A] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-medium">Full Name</span>
                        <span className="font-bold text-[#0B1F3A]">{profile?.full_name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-medium">Email Address</span>
                        <span className="font-semibold text-slate-700">{userEmail}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-medium">Contact Phone</span>
                        <span className="font-semibold text-slate-700">
                          {profile?.phone ? `+91 ${profile.phone}` : "Not provided"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-medium">Default City</span>
                        <span className="font-semibold text-slate-700">
                          {profile?.city || "Greater Noida"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-medium">User ID</span>
                        <span className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]">
                          {userId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Verification Status */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#2FD08A]" />
                        <h3 className="font-extrabold text-sm text-[#0B1F3A]">Verification Badges</h3>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Demo Mode
                      </span>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {/* Host Status */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="font-bold text-[#0B1F3A]">Host Status</p>
                            <p className="text-[11px] text-slate-500">
                              {profile?.host_status === "verified"
                                ? "Verified to list parking spaces"
                                : "Unverified (List space to verify)"}
                            </p>
                          </div>
                        </div>

                        {profile?.host_status === "verified" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[10px] font-extrabold uppercase">
                            <Check className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        ) : (
                          <Link
                            href="/owner/list-space"
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs transition-colors"
                          >
                            <span>Verify now</span>
                          </Link>
                        )}
                      </div>

                      {/* Driver Status */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <Car className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-bold text-[#0B1F3A]">Driver Status</p>
                            <p className="text-[11px] text-slate-500">
                              {profile?.driver_status === "verified"
                                ? "Verified for instant reservations"
                                : "Unverified (Book space to verify)"}
                            </p>
                          </div>
                        </div>

                        {profile?.driver_status === "verified" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[10px] font-extrabold uppercase">
                            <Check className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        ) : (
                          <Link
                            href="/driver"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] px-2.5 py-1 text-[11px] font-bold shadow-2xs transition-colors"
                          >
                            <span>Verify now</span>
                          </Link>
                        )}
                      </div>

                      {/* ID Record info */}
                      {profile?.id_type && (
                        <div className="flex justify-between items-center px-1 text-[11px] text-slate-500">
                          <span>Government ID Record:</span>
                          <span className="font-semibold text-slate-700">
                            {profile.id_type} (ending in {profile.id_last4 || "••••"})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Card 3: Saved Vehicles Section */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-6 sm:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Car className="w-5 h-5 text-[#0B1F3A]" />
                    <div>
                      <h3 className="font-extrabold text-base text-[#0B1F3A]">Registered Vehicles</h3>
                      <p className="text-xs text-slate-500">
                        Saved license plates automatically populate during checkout and fit checks.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAddVehicleError(null);
                      setShowAddVehicleModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#2FD08A]" />
                    <span>Add Vehicle</span>
                  </button>
                </div>

                {vehicles.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                    <p className="font-bold text-slate-700">No vehicles registered yet.</p>
                    <p>Add your car or two-wheeler plate for 1-click clearance validation.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-md bg-[#0B1F3A] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                            {v.type}
                          </span>
                          <p className="font-mono text-sm font-black text-[#0B1F3A] tracking-wider">
                            {v.plate}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Saved {new Date(v.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={deletingVehicleId === v.id}
                          onClick={() => handleDeleteVehicle(v.id, v.plate)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete vehicle"
                        >
                          {deletingVehicleId === v.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Log Out Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loggingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>Sign out of ParkIt</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DRIVER ACTIVITY & BOOKINGS */}
          {/* ========================================================================= */}
          {activeTab === "driver" && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Bookings
                  </span>
                  <p className="text-2xl font-black text-[#0B1F3A] mt-1">
                    {driverMetrics.total_bookings}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Spent
                  </span>
                  <p className="text-2xl font-black text-[#0B1F3A] mt-1">
                    ₹{driverMetrics.total_spent}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Upcoming Bookings
                  </span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {driverMetrics.upcoming_count}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Vehicles Registered
                  </span>
                  <p className="text-2xl font-black text-blue-600 mt-1">
                    {driverMetrics.vehicles_saved}
                  </p>
                </div>
              </div>

              {/* My Claims List Section */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2FD08A] flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#0B1F3A]">My Insurance Claims</h3>
                      <p className="text-xs text-slate-500">
                        Claims submitted for vehicle damage incurred during confirmed parking stays.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                    {driverClaims.length} {driverClaims.length === 1 ? "Claim" : "Claims"}
                  </span>
                </div>

                {driverClaims.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    No insurance claims filed. If your vehicle incurs damage while parked at a host's space, use the "Report damage" button on your booking within the claim window.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {driverClaims.map((claim) => {
                      const damageLabel = DAMAGE_TYPE_LABELS[claim.damage_type] || claim.damage_type;
                      return (
                        <div
                          key={claim.id}
                          className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-[#0B1F3A]">
                                  Claim #{claim.id.slice(0, 8)}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                    claim.status === "approved"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : claim.status === "rejected"
                                      ? "bg-rose-100 text-rose-800"
                                      : claim.status === "under_review"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {claim.status.replace("_", " ")}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-700 mt-0.5">
                                Damage: {damageLabel}
                              </p>
                            </div>

                            <div className="sm:text-right">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">
                                Estimated Repair
                              </span>
                              <span className="font-black text-sm text-[#0B1F3A]">
                                ₹{claim.estimated_amount}
                              </span>
                              {claim.approved_amount !== undefined && claim.approved_amount !== null && (
                                <span className="text-xs text-emerald-600 block font-bold">
                                  Approved: ₹{claim.approved_amount}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status Timeline */}
                          <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] font-bold">
                            <span className="text-slate-400 uppercase">Status Timeline:</span>
                            <span className="text-emerald-700 font-extrabold">Submitted</span>
                            <span className="text-slate-300">→</span>
                            <span className={claim.status !== "submitted" ? "text-blue-700 font-extrabold" : "text-slate-400"}>
                              Under review
                            </span>
                            <span className="text-slate-300">→</span>
                            <span
                              className={
                                claim.status === "approved"
                                  ? "text-emerald-700 font-extrabold"
                                  : claim.status === "rejected"
                                  ? "text-rose-700 font-extrabold"
                                  : "text-slate-400"
                              }
                            >
                              {claim.status === "approved" ? "Approved" : claim.status === "rejected" ? "Rejected" : "Decision"}
                            </span>
                          </div>

                          {claim.resolution_note && (
                            <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                              Note: {claim.resolution_note}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Filter Chips Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {(["all", "upcoming", "active", "past", "cancelled"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setDriverFilter(filter)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                        driverFilter === filter
                          ? "bg-[#0B1F3A] text-white shadow-2xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {filter === "active" ? "Active now" : filter}
                    </button>
                  ))}
                </div>

                <Link
                  href="/driver"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2FD08A] hover:underline self-start sm:self-auto"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Find new spot on map</span>
                </Link>
              </div>

              {/* Bookings List */}
              {filteredDriverBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                    <Car className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#0B1F3A]">No bookings found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {driverFilter === "all"
                        ? "You haven't reserved any parking spots yet. Search nearby spots with instant availability on our map."
                        : `No ${driverFilter} reservations found in your history.`}
                    </p>
                  </div>
                  <div>
                    <Link
                      href="/driver"
                      className="inline-flex items-center gap-2 bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-soft transition-all"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Find parking</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDriverBookings.map((b) => {
                    const isUpcomingOrActive =
                      ["pending_payment", "confirmed", "checked_in"].includes(b.status) &&
                      new Date(b.end_time) >= new Date();
                    const isPaid = b.payment_status === "paid";
                    const isExpanded = Boolean(expandedEntryCodes[b.id]);

                    return (
                      <div
                        key={b.id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-5 sm:p-6 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-base text-[#0B1F3A]">
                                {b.space_title}
                              </h4>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                  b.status === "confirmed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : b.status === "checked_in"
                                    ? "bg-blue-100 text-blue-800"
                                    : b.status === "completed"
                                    ? "bg-slate-100 text-slate-700"
                                    : b.status === "cancelled"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {b.status.replace("_", " ")}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#2FD08A] shrink-0" />
                              <span>{b.public_address}</span>
                            </p>

                            {/* Privacy-Guarded Details: Only shown if paid and confirmed */}
                            {b.house_no && (
                              <p className="text-xs text-blue-900 bg-blue-50/70 p-2 rounded-lg border border-blue-200/60 font-semibold mt-2">
                                📍 Private Gate Unit: {b.house_no}{" "}
                                {b.building_name ? `• ${b.building_name}` : ""}
                                {b.host_phone && ` • Host: +91 ${b.host_phone}`}
                              </p>
                            )}
                          </div>

                          <div className="sm:text-right shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Total Paid
                            </span>
                            <p className="text-xl font-black text-[#0B1F3A]">₹{b.total_price}</p>
                          </div>
                        </div>

                        {/* Booking Schedule Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400">
                              Arrival Date
                            </span>
                            <p className="font-bold text-[#0B1F3A] mt-0.5">
                              {formatISTDateTime(b.start_time).split(",")[0]}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400">
                              Time Window
                            </span>
                            <p className="font-bold text-[#0B1F3A] mt-0.5">
                              {formatISTTime(b.start_time)} - {formatISTTime(b.end_time)}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400">
                              Payment
                            </span>
                            <p
                              className={`font-bold mt-0.5 ${
                                isPaid ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {b.payment_status.toUpperCase()}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400">
                              Booking ID
                            </span>
                            <p className="font-mono text-[10px] text-slate-600 truncate mt-0.5">
                              {b.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>

                        {/* Collapsible Gate Entry Pass for Paid Bookings */}
                        {isUpcomingOrActive && isPaid && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => toggleEntryCode(b.id)}
                              className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-[#2FD08A]" />
                              <span>{isExpanded ? "Hide Gate Entry Pass" : "Show Entry Code & Pass"}</span>
                            </button>

                            {isExpanded && (
                              <div className="mt-3 p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-3 animate-in fade-in duration-150">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                      Gate Access Code
                                    </span>
                                    <p className="font-mono text-2xl font-black text-[#2FD08A] tracking-widest mt-0.5">
                                      {b.otp_code || "7842"}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                      Provide this 6-digit OTP code or present pass at parking gate.
                                    </p>
                                  </div>

                                  <div className="w-20 h-20 bg-white rounded-lg p-1.5 flex items-center justify-center shrink-0">
                                    <QrCode className="w-full h-full text-slate-900" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Insurance Row on Booking */}
                        {b.policy_number && (
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-[#2FD08A] shrink-0 font-bold shadow-2xs">
                                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-[#0B1F3A]">
                                    {b.insurance_plan?.plan_name || "Vehicle Protection"}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                                    {b.insurance_status || "Active"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Policy: <span className="font-mono font-bold text-slate-700">{b.policy_number}</span>
                                  {b.insurance_plan?.provider ? ` • ${b.insurance_plan.provider}` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {(() => {
                                const nowMs = Date.now();
                                const startMs = new Date(b.start_time).getTime();
                                const endMs = new Date(b.end_time).getTime();
                                const claimWindowHours = b.insurance_plan?.claim_window_hours || 48;
                                const deadlineMs = endMs + claimWindowHours * 3600 * 1000;
                                const isEligible = (nowMs >= startMs || b.status === "checked_in") && nowMs <= deadlineMs;
                                const isExpired = nowMs > deadlineMs;
                                const isBeforeCheckin = nowMs < startMs && b.status !== "checked_in";

                                return (
                                  <button
                                    type="button"
                                    disabled={!isEligible}
                                    onClick={() => {
                                      setSelectedBookingForClaim(b);
                                      setShowClaimModal(true);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isEligible
                                        ? "bg-rose-500 hover:bg-rose-600 text-white shadow-2xs active:scale-95"
                                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                    }`}
                                    title={
                                      isBeforeCheckin
                                        ? "Damage reporting opens upon check-in"
                                        : isExpired
                                        ? `Claim window expired (${claimWindowHours}h after stay)`
                                        : "Report damage to claim insurance coverage"
                                    }
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>Report damage</span>
                                  </button>
                                );
                              })()}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBookingForPolicy(b);
                                  setShowPolicyModal(true);
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                              >
                                Policy Summary
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Actions Row */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs font-bold">
                          <Link
                            href={`/driver/space/${b.space_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <span>View space</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>

                          {b.latitude && b.longitude && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <span>Get directions</span>
                              <Compass className="w-3 h-3 text-[#2FD08A]" />
                            </a>
                          )}

                          {b.status === "completed" && (
                            <Link
                              href={`/driver/space/${b.space_id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white hover:bg-[#163359] transition-colors"
                            >
                              <span>Book again</span>
                              <ArrowRight className="w-3 h-3 text-[#2FD08A]" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: HOST ACTIVITY & SPACES */}
          {/* ========================================================================= */}
          {activeTab === "host" && (
            <div className="space-y-8">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Spaces Listed
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-black text-[#0B1F3A]">{hostMetrics.spaces_listed}</p>
                    <span className="text-xs text-slate-500 font-semibold">
                      ({hostMetrics.active_listings} active)
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Earnings
                  </span>
                  <p className="text-2xl font-black text-[#0B1F3A] mt-1">
                    ₹{hostMetrics.total_earnings}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Monthly Occupancy
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-2xl font-black text-[#2FD08A]">
                      {hostMetrics.occupancy_this_month}%
                    </p>
                    <span className="text-[10px] text-slate-400">this month</span>
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-[#2FD08A]" />
                    <h3 className="font-extrabold text-sm text-[#0B1F3A]">Earnings Summary</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Real Data</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Last 7 Days</p>
                    <p className="text-base font-black text-[#0B1F3A] mt-0.5">
                      ₹{hostMetrics.earnings_last_7_days}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] font-bold uppercase text-slate-400">This Month</p>
                    <p className="text-base font-black text-[#0B1F3A] mt-0.5">
                      ₹{hostMetrics.earnings_this_month}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] font-bold uppercase text-slate-400">All-Time Total</p>
                    <p className="text-base font-black text-emerald-600 mt-0.5">
                      ₹{hostMetrics.total_earnings}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1: My Spaces */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-[#0B1F3A]">My Listed Spaces</h3>
                    <p className="text-xs text-slate-500">
                      Manage your parking bays, pricing, and active listings.
                    </p>
                  </div>

                  <Link
                    href="/owner/list-space"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#2FD08A]" />
                    <span>List your space</span>
                  </Link>
                </div>

                {hostSpaces.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-12 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#0B1F3A]">
                        You haven't listed a space yet
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Turn your empty driveway, garage, or dedicated lot into passive monthly income
                        with ParKit.
                      </p>
                    </div>
                    <div>
                      <Link
                        href="/owner/list-space"
                        className="inline-flex items-center gap-2 bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-soft transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>List your space</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hostSpaces.map((s) => (
                      <div
                        key={s.id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-5 space-y-4"
                      >
                        <div className="flex gap-4 items-start">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            {s.photo_url ? (
                              <Image
                                src={s.photo_url}
                                alt={s.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                                <Building2 className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-extrabold text-sm text-[#0B1F3A] truncate">
                                {s.title}
                              </h4>
                              {s.verified_host && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Verified
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 truncate mt-0.5">{s.address}</p>

                            <div className="flex items-center gap-3 text-xs mt-2 font-bold text-[#0B1F3A]">
                              <span>₹{s.price_per_hour}/hr</span>
                              <span className="text-slate-300">•</span>
                              <span>{s.total_slots} Bay(s)</span>
                              <span className="text-slate-300">•</span>
                              <span className="capitalize text-slate-600">
                                Max: {s.max_vehicle_type || "SUV"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={togglingSpaceId === s.id}
                              onClick={() => handleToggleSpaceStatus(s.id, s.is_active)}
                              className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer ${
                                s.is_active
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              {togglingSpaceId === s.id ? (
                                <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                              ) : null}
                              <span>{s.is_active ? "Active (Listed)" : "Paused"}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/driver/space/${s.id}`}
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0B1F3A] py-1 px-2"
                            >
                              <span>View as driver</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Bookings Received by Host */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-[#0B1F3A]">Bookings Received</h3>
                    <p className="text-xs text-slate-500">
                      Live driver arrivals and check-ins across your parking bays.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {(["all", "upcoming", "active", "past", "cancelled"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setHostFilter(filter)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                          hostFilter === filter
                            ? "bg-[#0B1F3A] text-white shadow-2xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {filter === "active" ? "Active" : filter}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredHostBookings.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-8 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700">No driver bookings received yet.</p>
                    <p>Once drivers reserve your space, incoming bookings will stream here.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-3 px-4">Space</th>
                            <th className="py-3 px-4">Driver</th>
                            <th className="py-3 px-4">Plan & Policy</th>
                            <th className="py-3 px-4">Time Window (IST)</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Claim Status</th>
                            <th className="py-3 px-4">Gate Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {filteredHostBookings.map((hb) => (
                            <tr key={hb.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-[#0B1F3A]">
                                {hb.space_title}
                              </td>
                              <td className="py-3.5 px-4">
                                {/* Privacy rule: Driver First Name only, NO driver phone */}
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 text-[#0B1F3A] flex items-center justify-center font-bold text-[10px]">
                                    {hb.driver_first_name.slice(0, 1).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-slate-800">
                                    {hb.driver_first_name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-xs">
                                <div className="font-bold text-[#0B1F3A]">
                                  {hb.insurance_plan_name || "ParkIt Protect Basic"}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {hb.policy_number || "PK-2026-ACTIVE"}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                <div>{formatISTDateTime(hb.start_time).split(",")[0]}</div>
                                <div className="text-[11px] text-slate-400">
                                  {formatISTTime(hb.start_time)} - {formatISTTime(hb.end_time)}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#0B1F3A]">
                                ₹{hb.total_price}
                              </td>
                              <td className="py-3.5 px-4">
                                {hb.claim ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-800 border border-rose-200">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    <span>
                                      Claim filed: {hb.claim.damage_type.replace("_", " ")} ({hb.claim.status.replace("_", " ")})
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">None</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                {hb.is_otp_verified ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                                    <Check className="w-3 h-3 text-emerald-600" /> OTP Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                                    <Clock className="w-3 h-3 text-amber-700" /> Check-in Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* Driver Damage Claim Modal */}
      {selectedBookingForClaim && (
        <ClaimModal
          isOpen={showClaimModal}
          onClose={() => {
            setShowClaimModal(false);
            setSelectedBookingForClaim(null);
          }}
          booking={{
            id: selectedBookingForClaim.id,
            space_title: selectedBookingForClaim.space_title,
            start_time: selectedBookingForClaim.start_time,
            end_time: selectedBookingForClaim.end_time,
            policy_number: selectedBookingForClaim.policy_number || undefined,
            insurance_plan: selectedBookingForClaim.insurance_plan || FALLBACK_INSURANCE_PLANS[0],
          }}
          onClaimSubmitted={() => {
            loadProfileData();
          }}
        />
      )}

      {/* Driver Policy Summary Modal */}
      {selectedBookingForPolicy && (
        <PolicySummaryModal
          isOpen={showPolicyModal}
          onClose={() => {
            setShowPolicyModal(false);
            setSelectedBookingForPolicy(null);
          }}
          policyNumber={selectedBookingForPolicy.policy_number || "PK-2026-ACTIVE"}
          plan={selectedBookingForPolicy.insurance_plan || FALLBACK_INSURANCE_PLANS[0]}
          spaceTitle={selectedBookingForPolicy.space_title}
          spaceAddress={selectedBookingForPolicy.public_address}
          driverName={profile?.full_name || "Verified Driver"}
          startTime={selectedBookingForPolicy.start_time}
          endTime={selectedBookingForPolicy.end_time}
          premium={Number(selectedBookingForPolicy.insurance_premium || 0)}
        />
      )}

      {/* ADD VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-soft-lg space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-[#2FD08A]" />
                <h3 className="font-extrabold text-base text-[#0B1F3A]">Register New Vehicle</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVehicleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addVehicleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{addVehicleError}</span>
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  License Plate Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UP16AB1234 or DL01CA9999"
                  value={newVehiclePlate}
                  onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                  className="w-full uppercase font-mono tracking-wider bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Format: 2 state letters, 1-2 district digits, 1-3 series letters, 4 digits.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Classification *</label>
                <select
                  value={newVehicleType}
                  onChange={(e) => setNewVehicleType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40 cursor-pointer capitalize"
                >
                  <option value="bike">Bike / Two-Wheeler</option>
                  <option value="hatchback">Hatchback (Small Compact)</option>
                  <option value="sedan">Sedan (Standard)</option>
                  <option value="suv">SUV / MUV (Large Clearance)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingVehicle}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {addingVehicle ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Register Vehicle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
