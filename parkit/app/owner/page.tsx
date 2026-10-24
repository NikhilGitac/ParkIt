import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const instant = false;
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  DollarSign,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Building,
  Upload,
  Clock,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export default async function OwnerPage() {
  let user: { id: string; email?: string } | null = null;
  let profile: { full_name: string; phone?: string | null; role: string } | null = null;
  const isConfigured = isSupabaseConfigured();

  if (isConfigured) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        redirect("/login?next=/owner");
      }
      user = authUser;

      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("full_name, phone, role")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!dbProfile || !dbProfile.role) {
        redirect("/onboarding");
      }

      if (dbProfile.role !== "owner") {
        redirect("/driver");
      }
      profile = dbProfile;
    } catch (err: any) {
      if (
        err?.digest?.includes("DYNAMIC") ||
        err?.digest?.includes("BAILOUT") ||
        err?.digest?.includes("HANGING") ||
        err?.message?.includes("NEXT_REDIRECT") ||
        err?.message?.includes("cookies")
      ) {
        throw err;
      }
      console.warn("OwnerPage auth query error:", err);
      redirect("/login?error=connection_failed");
    }
  } else {
    user = { id: "demo-owner-id", email: "host@example.com" };
    profile = { full_name: "Demo Space Owner", role: "owner", phone: null };
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1 pb-16">
        {/* Banner if Supabase credentials are placeholder */}
        {!isConfigured && (
          <div className="bg-[#FFC93C]/20 border-b border-[#FFC93C]/40 px-4 py-2.5 text-xs text-[#0B1F3A] flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#0B1F3A] shrink-0" />
            <span>
              <strong>Preview Mode:</strong> Live Supabase credentials not yet detected in <code className="bg-white/80 px-1 py-0.5 rounded font-mono">.env.local</code>. Please set your real <code className="bg-white/80 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code> to test live authentication.
            </span>
          </div>
        )}

        {/* Top Header Banner */}
        <section className="bg-[#0B1F3A] text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block rounded-full bg-[#FFC93C]/20 px-3 py-1 text-xs font-bold text-[#FFC93C]">
                    Space Owner Portal
                  </span>
                  <span className="text-xs text-slate-400">
                    Host: <strong className="text-white">{profile.full_name}</strong>
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold sm:text-4xl">
                  Turn Your Driveway into Income
                </h1>
                <p className="mt-1 text-sm text-slate-300 max-w-xl">
                  Share your unused residential driveway, commercial lot, or private garage with vetted drivers.
                </p>
              </div>

              {/* Status info */}
              <div className="rounded-[16px] bg-white/10 border border-white/10 p-4 text-xs text-slate-300 max-w-xs">
                <span className="font-semibold text-white block mb-1">
                  Status: {user.email}
                </span>
                Protected host route active. Space creation wizard, calendar availability rules, and payout setups will connect here.
              </div>
            </div>
          </div>
        </section>

        {/* Estimated Earnings Card */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="rounded-[16px] bg-white p-6 sm:p-8 shadow-soft border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2FD08A]">
                  Earnings Estimator
                </span>
                <h2 className="text-2xl font-extrabold text-[#0B1F3A] mt-1">
                  What could you earn?
                </h2>
                <p className="text-xs text-slate-500 mt-2">
                  Based on average downtown and midtown residential parking demand.
                </p>
              </div>

              <div className="rounded-xl bg-[#F0F4F8] p-5 border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Estimated Monthly Income
                </p>
                <p className="text-4xl font-black text-[#0B1F3A] mt-1">
                  $480 <span className="text-sm font-normal text-slate-500">/ mo</span>
                </p>
                <p className="text-[11px] text-[#2FD08A] font-bold mt-1">
                  +1 Spot • 5 Days / Week
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <Link
                  href="/owner/list-space"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] text-sm font-bold text-white transition-all hover:bg-[#163359] shadow-soft"
                >
                  <Upload className="h-4 w-4 text-[#2FD08A]" />
                  <span>Start Listing Your Space</span>
                </Link>
                <p className="text-[11px] text-center text-slate-400">
                  Free to list. No upfront fees.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Step Listing Flow */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
          <h2 className="text-xl font-bold text-[#0B1F3A] mb-6">
            List in 3 Easy Steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-[16px] bg-white p-6 shadow-soft border border-slate-200/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1F3A] text-[#2FD08A] mb-4 font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-[#0B1F3A]">Describe your space</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Add your address, upload a photo, and set vehicle size limits (e.g., Compact, SUV, EV).
              </p>
            </div>

            <div className="rounded-[16px] bg-white p-6 shadow-soft border border-slate-200/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2FD08A]/20 text-[#0B1F3A] mb-4 font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-[#0B1F3A]">Set schedule & price</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Choose which hours or days your space is available. Keep complete control of your calendar.
              </p>
            </div>

            <div className="rounded-[16px] bg-white p-6 shadow-soft border border-slate-200/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFC93C]/30 text-[#0B1F3A] mb-4 font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-[#0B1F3A]">Welcome drivers & get paid</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Drivers check-in digitally with QR passes. Payouts are transferred automatically to your account.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
