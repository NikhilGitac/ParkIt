"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  LogOut,
  User,
  Building2,
  Car,
  Sparkles,
  Loader2,
  ChevronDown,
  Edit3,
  ShieldCheck,
  Compass,
  ArrowRight,
} from "lucide-react";

interface NavbarUserMenuProps {
  user: { id: string; email?: string } | null;
  userRole: "driver" | "owner" | null;
  userName: string | null;
  userAvatar?: string | null;
  hostStatus?: string | null;
  driverStatus?: string | null;
  mobile?: boolean;
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
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

export function NavbarUserMenu({
  user,
  userRole,
  userName: initialUserName,
  userAvatar: initialUserAvatar,
  hostStatus: initialHostStatus,
  driverStatus: initialDriverStatus,
  mobile = false,
}: NavbarUserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Dynamic state that can be updated on client after profile edits
  const [userName, setUserName] = useState<string | null>(initialUserName);
  const [userAvatar, setUserAvatar] = useState<string | null>(initialUserAvatar || null);
  const [hostStatus, setHostStatus] = useState<string | null>(initialHostStatus || null);
  const [driverStatus, setDriverStatus] = useState<string | null>(initialDriverStatus || null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync with prop updates
  useEffect(() => {
    setUserName(initialUserName);
  }, [initialUserName]);

  useEffect(() => {
    setUserAvatar(initialUserAvatar || null);
    setImgError(false);
  }, [initialUserAvatar]);

  useEffect(() => {
    setHostStatus(initialHostStatus || null);
  }, [initialHostStatus]);

  useEffect(() => {
    setDriverStatus(initialDriverStatus || null);
  }, [initialDriverStatus]);

  // Listen for instant client-side profile update events (emitted by profile edit form)
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        full_name?: string;
        avatar_url?: string;
        host_status?: string;
        driver_status?: string;
      }>;
      if (customEvent.detail) {
        if (customEvent.detail.full_name !== undefined) {
          setUserName(customEvent.detail.full_name);
        }
        if (customEvent.detail.avatar_url !== undefined) {
          setUserAvatar(customEvent.detail.avatar_url);
          setImgError(false);
        }
        if (customEvent.detail.host_status !== undefined) {
          setHostStatus(customEvent.detail.host_status);
        }
        if (customEvent.detail.driver_status !== undefined) {
          setDriverStatus(customEvent.detail.driver_status);
        }
      }
    };

    window.addEventListener("parkit:profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("parkit:profile-updated", handleProfileUpdate);
    };
  }, []);

  // 1. Close on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  // 2. Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // 3. Close on Escape key & keyboard accessibility
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && dropdownOpen) {
        setDropdownOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (dropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/auth/signout", { method: "POST" });
      router.refresh();
      router.push("/login");
    } catch (err) {
      console.error("Signout error:", err);
      router.push("/login");
    } finally {
      setLoggingOut(false);
      setDropdownOpen(false);
    }
  };

  const isDemoUser = Boolean(
    user?.email === "demo.host@parkit.test" ||
      user?.email === "demo.driver@parkit.test" ||
      user?.email?.endsWith("@parkit.test") ||
      user?.email?.endsWith("@parkit.internal")
  );

  const displayName = userName || user?.email?.split("@")[0] || "User";
  const initials = getInitials(userName, user?.email);

  // Avatar Element Renderer
  const renderAvatar = (sizeClass = "w-7 h-7 text-xs") => {
    if (userAvatar && !imgError) {
      return (
        <div className={`relative ${sizeClass} rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200`}>
          <Image
            src={userAvatar}
            alt={displayName}
            fill
            sizes="48px"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-full bg-[#0B1F3A] text-[#2FD08A] font-extrabold flex items-center justify-center shrink-0 border border-[#0B1F3A]/20 shadow-2xs`}
      >
        {initials}
      </div>
    );
  };

  // ============================================================================
  // MOBILE MENU (Rendered inside the Mobile Drawer)
  // ============================================================================
  if (mobile) {
    if (user) {
      return (
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
          {/* User Profile Header Card */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-3">
              {renderAvatar("w-10 h-10 text-sm")}
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm text-[#0B1F3A] truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {hostStatus === "verified" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" /> Verified Host
                </span>
              )}
              {driverStatus === "verified" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/90 text-blue-800 border border-blue-300 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                  <Car className="w-2.5 h-2.5 text-blue-700" /> Verified Driver
                </span>
              )}
              {isDemoUser && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Demo account
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col space-y-1 text-sm font-semibold">
            <Link
              href="/profile"
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A]"
            >
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-slate-400" />
                <span>My Profile</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href="/profile?edit=1"
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A]"
            >
              <div className="flex items-center gap-2.5">
                <Edit3 className="h-4 w-4 text-slate-400" />
                <span>Edit Profile</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <div className="h-px bg-slate-100 my-1" />

            <Link
              href="/profile?tab=driver"
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A]"
            >
              <div className="flex items-center gap-2.5">
                <Car className="h-4 w-4 text-emerald-600" />
                <span>My Driver Activity</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href="/profile?tab=host"
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A]"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-amber-600" />
                <span>My Host Activity</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <div className="h-px bg-slate-100 my-1" />

            <Link
              href="/owner/dashboard"
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A]"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-[#0B1F3A]" />
                <span>Host Dashboard</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href="/driver"
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A]"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="h-4 w-4 text-[#2FD08A]" />
                <span>Driver Portal</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 disabled:opacity-50 mt-2"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span>Log out</span>
          </button>
        </div>
      );
    }

    return (
      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
        <Link
          href="/login"
          className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-[#0B1F3A] hover:bg-slate-50"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="flex h-11 w-full items-center justify-center rounded-xl bg-[#2FD08A] text-sm font-semibold text-[#0B1F3A] shadow-sm hover:bg-[#26b878]"
        >
          Sign up
        </Link>
      </div>
    );
  }

  // ============================================================================
  // DESKTOP PILL BUTTON WITH INTERACTIVE DROPDOWN & MOBILE AVATAR
  // ============================================================================
  if (user) {
    return (
      <div className="flex items-center gap-2">
        {/* Mobile: Avatar only shortcut to profile */}
        <Link
          href="/profile"
          className="flex md:hidden rounded-full p-0.5 border border-slate-200 hover:border-slate-300 transition-colors"
          title="My Profile"
          aria-label="My Profile"
        >
          {renderAvatar("w-8 h-8 text-xs")}
        </Link>

        {/* Desktop: Pill Button with Interactive Dropdown */}
        <div className="relative hidden md:block">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          aria-label="User navigation menu"
          className={`flex items-center gap-2.5 rounded-full pl-1.5 pr-3 py-1 text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
            dropdownOpen
              ? "bg-white border-[#2FD08A] ring-2 ring-[#2FD08A]/30 text-[#0B1F3A]"
              : "bg-slate-50/90 hover:bg-white border-slate-200/90 text-slate-700 hover:border-slate-300"
          }`}
        >
          {renderAvatar("w-7 h-7 text-xs")}
          <span className="font-bold max-w-[120px] truncate text-[#0B1F3A]">
            {displayName}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
              dropdownOpen ? "rotate-180 text-[#0B1F3A]" : ""
            }`}
          />
        </button>

        {/* Accessible Dropdown Card */}
        {dropdownOpen && (
          <div
            ref={dropdownRef}
            role="menu"
            aria-label="User profile menu"
            className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-soft-lg z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header: Avatar, Name, Email, Badges */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/90 space-y-2">
              <div className="flex items-center gap-2.5">
                {renderAvatar("w-9 h-9 text-xs")}
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[#0B1F3A] truncate leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Badges Container */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {hostStatus === "verified" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" /> Verified Host
                  </span>
                )}
                {driverStatus === "verified" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                    <Car className="w-2.5 h-2.5 text-blue-700" /> Verified Driver
                  </span>
                )}
                {isDemoUser && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Demo account
                  </span>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1.5 space-y-0.5">
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A] font-semibold transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>

              <Link
                href="/profile?edit=1"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A] font-semibold transition-colors"
              >
                <Edit3 className="w-4 h-4 text-slate-400" />
                <span>Edit Profile</span>
              </Link>

              <div className="h-px bg-slate-100 my-1" />

              <Link
                href="/profile?tab=driver"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A] font-semibold transition-colors"
              >
                <Car className="w-4 h-4 text-emerald-600" />
                <span>My Driver Activity</span>
              </Link>

              <Link
                href="/profile?tab=host"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A] font-semibold transition-colors"
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>My Host Activity</span>
              </Link>

              <div className="h-px bg-slate-100 my-1" />

              <Link
                href="/owner/dashboard"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A] font-semibold transition-colors"
              >
                <Building2 className="w-4 h-4 text-[#0B1F3A]" />
                <span>Host Dashboard</span>
              </Link>

              <Link
                href="/driver"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A] font-semibold transition-colors"
              >
                <Compass className="w-4 h-4 text-[#2FD08A]" />
                <span>Driver Portal</span>
              </Link>

              <div className="h-px bg-slate-100 my-1" />

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition-colors text-left disabled:opacity-50 cursor-pointer"
              >
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 text-red-500" />
                )}
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  // Logged-out state
  return (
    <div className="hidden md:flex items-center gap-3">
      <Link
        href="/login"
        className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-[#0B1F3A] transition-colors hover:bg-slate-100"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2FD08A] px-5 text-sm font-semibold text-[#0B1F3A] shadow-sm transition-all hover:bg-[#26b878] hover:shadow"
      >
        Sign up
      </Link>
    </div>
  );
}
