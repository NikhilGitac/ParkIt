"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Car, Menu, X, ArrowRight, LogOut, User, Building2 } from "lucide-react";

export function Header() {
  const router = useRouter();
  const supabase = createClient();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [userRole, setUserRole] = useState<"driver" | "owner" | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    async function getSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profile) {
            setUserRole(profile.role as "driver" | "owner");
            setUserName(profile.full_name);
          } else if (session.user.user_metadata) {
            setUserRole(session.user.user_metadata.role);
            setUserName(session.user.user_metadata.full_name);
          }
        } else {
          setUser(null);
          setUserRole(null);
          setUserName(null);
        }
      } catch (err) {
        console.warn("Could not retrieve Supabase session:", err);
      } finally {
        setLoading(false);
      }
    }

    getSession();

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        try {
          if (session?.user) {
            setUser(session.user);
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, role")
              .eq("id", session.user.id)
              .maybeSingle();

            if (profile) {
              setUserRole(profile.role as "driver" | "owner");
              setUserName(profile.full_name);
            } else if (session.user.user_metadata) {
              setUserRole(session.user.user_metadata.role);
              setUserName(session.user.user_metadata.full_name);
            }
          } else {
            setUser(null);
            setUserRole(null);
            setUserName(null);
          }
        } catch {
          // Ignore state change errors
        } finally {
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // Ignore listener attachment errors if unconfigured
    }
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setUserName(null);
    router.refresh();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#0B1F3A]/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ParKit Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B1F3A] text-[#2FD08A] shadow-sm transition-transform group-hover:scale-105">
            <Car className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
              Par<span className="text-[#2FD08A]">Kit</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 -mt-1">
              Smart Parking
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/driver"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-[#0B1F3A]"
          >
            Find Parking
          </Link>
          <Link
            href="/owner"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-[#0B1F3A]"
          >
            List Your Space
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-[#0B1F3A]"
          >
            How It Works
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-[#0B1F3A]"
          >
            Features
          </Link>
        </nav>

        {/* Auth Buttons / User Profile */}
        <div className="hidden md:flex items-center gap-3">
          {!loading && user ? (
            <div className="flex items-center gap-3">
              {/* Role Portal Shortcut */}
              <Link
                href={userRole === "owner" ? "/owner" : "/driver"}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                  userRole === "owner"
                    ? "bg-[#FFC93C]/20 text-[#0B1F3A] hover:bg-[#FFC93C]/30"
                    : "bg-[#2FD08A]/20 text-[#0B1F3A] hover:bg-[#26b878]/30"
                }`}
              >
                {userRole === "owner" ? (
                  <Building2 className="h-3.5 w-3.5" />
                ) : (
                  <Car className="h-3.5 w-3.5" />
                )}
                <span>{userRole === "owner" ? "Host Dashboard" : "Driver Portal"}</span>
              </Link>

              {/* User badge */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-2 py-1 bg-slate-100 rounded-lg">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-[120px] truncate">{userName || user.email?.split("@")[0]}</span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-xl p-2.5 text-[#0B1F3A] hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#0B1F3A]/10 bg-white px-4 pt-2 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3 pt-2">
            <Link
              href="/driver"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-base font-semibold text-[#0B1F3A] hover:bg-slate-50"
            >
              <span>Find Parking</span>
              <ArrowRight className="h-4 w-4 text-[#2FD08A]" />
            </Link>
            <Link
              href="/owner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-base font-semibold text-[#0B1F3A] hover:bg-slate-50"
            >
              <span>List Your Space</span>
              <span className="rounded-full bg-[#FFC93C]/30 px-2 py-0.5 text-xs font-semibold text-[#0B1F3A]">
                Earn
              </span>
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
            >
              How It Works
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
            >
              Features
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
            {!loading && user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500">
                  <span>Logged in as:</span>
                  <span className="font-bold text-[#0B1F3A]">{userName || user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-[#0B1F3A] hover:bg-slate-50"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-[#2FD08A] text-sm font-semibold text-[#0B1F3A] shadow-sm hover:bg-[#26b878]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
