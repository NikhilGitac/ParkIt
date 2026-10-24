import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const instant = false;
import { Header } from "@/components/header";
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
} from "lucide-react";

const DAYS_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function OwnerDashboardPage() {
  const isConfigured = isSupabaseConfigured();
  let user: { id: string; email?: string } | null = null;
  let profile: { full_name: string; role: string } | null = null;
  let spaces: any[] = [];

  if (isConfigured) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        redirect("/login?next=/owner/dashboard");
      }
      user = authUser;

      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!dbProfile || !dbProfile.role) {
        redirect("/onboarding");
      }
      profile = dbProfile;

      // Query host's parking spaces
      const { data: dbSpaces } = await supabase
        .from("parking_spaces")
        .select(`
          id,
          title,
          description,
          address,
          latitude,
          longitude,
          price_per_hour,
          photo_url,
          is_active,
          created_at,
          space_availability (
            id,
            day_of_week,
            start_time,
            end_time
          )
        `)
        .eq("owner_id", authUser.id)
        .order("created_at", { ascending: false });

      if (dbSpaces) {
        spaces = dbSpaces;
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        throw err;
      }
      console.warn("Owner dashboard query error:", err);
    }
  } else {
    user = { id: "demo-owner", email: "host@example.com" };
    profile = { full_name: "Demo Host", role: "owner" };
    spaces = [
      {
        id: "demo-space-1",
        title: "Secure Gated Driveway near Metro",
        description: "Wide covered driveway suitable for Sedans and SUVs with 24/7 CCTV surveillance.",
        address: "Sector 29, Golf Course Road, Gurugram",
        latitude: 28.4595,
        longitude: 77.0266,
        price_per_hour: 60,
        photo_url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
        is_active: true,
        created_at: "2026-10-24T00:00:00.000Z",
        space_availability: [
          { id: "1", day_of_week: 1, start_time: "08:00", end_time: "20:00" },
          { id: "2", day_of_week: 2, start_time: "08:00", end_time: "20:00" },
          { id: "3", day_of_week: 3, start_time: "08:00", end_time: "20:00" },
          { id: "4", day_of_week: 4, start_time: "08:00", end_time: "20:00" },
          { id: "5", day_of_week: 5, start_time: "08:00", end_time: "20:00" },
        ],
      },
    ];
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1 pb-16">
        {!isConfigured && (
          <div className="bg-[#FFC93C]/20 border-b border-[#FFC93C]/40 px-4 py-2.5 text-xs text-[#0B1F3A] flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#0B1F3A] shrink-0" />
            <span>
              <strong>Preview Mode:</strong> Live Supabase credentials pending in <code className="bg-white/80 px-1 py-0.5 rounded font-mono">.env.local</code>. Displaying mock host listings.
            </span>
          </div>
        )}

        {/* Dashboard Hero Banner */}
        <section className="bg-[#0B1F3A] text-white py-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block rounded-full bg-[#FFC93C]/20 px-3 py-1 text-xs font-bold text-[#FFC93C]">
                    Host Workspace
                  </span>
                  <span className="text-xs text-slate-300">
                    Welcome, <strong className="text-white">{profile?.full_name || "Host"}</strong>
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold sm:text-4xl">
                  My Parking Spaces
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  Manage your driveways, view live bookings, and list new spaces.
                </p>
              </div>

              {/* Action: List Space */}
              <Link
                href="/owner/list-space"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2FD08A] px-6 text-sm font-bold text-[#0B1F3A] shadow-soft transition-all hover:bg-[#26b878] hover:shadow-lg"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>List a New Space</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Metrics Row */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-[16px] bg-white p-5 shadow-soft border border-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Listed Spaces
              </p>
              <p className="text-3xl font-extrabold text-[#0B1F3A] mt-1">{spaces.length}</p>
              <span className="text-[11px] text-[#2FD08A] font-bold">● Active & Discoverable</span>
            </div>

            <div className="rounded-[16px] bg-white p-5 shadow-soft border border-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Estimated Monthly Earnings
              </p>
              <p className="text-3xl font-extrabold text-[#0B1F3A] mt-1">
                ₹{spaces.length > 0 ? (spaces[0].price_per_hour * 8 * 22).toLocaleString("en-IN") : "0"}
              </p>
              <span className="text-[11px] text-slate-500">Based on 8 hrs/day occupancy</span>
            </div>

            <div className="rounded-[16px] bg-white p-5 shadow-soft border border-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Host Protection
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm font-bold text-[#0B1F3A]">
                <ShieldCheck className="h-5 w-5 text-[#2FD08A]" />
                <span>Verified Drivers & Automated Payouts</span>
              </div>
            </div>
          </div>
        </section>

        {/* Spaces List Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#0B1F3A]">Your Active Spaces ({spaces.length})</h2>
            <Link
              href="/owner/list-space"
              className="text-xs font-bold text-[#0B1F3A] hover:text-[#2FD08A] transition-colors"
            >
              + Add another space
            </Link>
          </div>

          {spaces.length === 0 ? (
            <div className="rounded-[16px] bg-white p-12 text-center shadow-soft border border-slate-200">
              <Car className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-bold text-[#0B1F3A]">No spaces listed yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Start monetizing your driveway, carport, or private garage today. Listing takes less than 3 minutes.
              </p>
              <div className="mt-6">
                <Link
                  href="/owner/list-space"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] px-6 text-xs font-bold text-white shadow-soft hover:bg-[#163359]"
                >
                  <Plus className="h-4 w-4 text-[#2FD08A]" />
                  <span>List Your First Space</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spaces.map((space) => (
                <div
                  key={space.id}
                  className="rounded-[16px] bg-white overflow-hidden shadow-soft border border-slate-200/90 transition-all hover:shadow-soft-lg"
                >
                  {/* Photo Banner */}
                  <div className="relative h-48 w-full bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={space.photo_url || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80"}
                      alt={space.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
                      {space.is_active ? "Live & Active" : "Paused"}
                    </div>

                    <div className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-3 py-1 text-sm font-extrabold text-[#0B1F3A] shadow-md backdrop-blur">
                      ₹{space.price_per_hour} <span className="text-xs font-normal text-slate-500">/ hr</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-[#0B1F3A] truncate">{space.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{space.address}</span>
                    </p>

                    <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {space.description}
                    </p>

                    {/* Coordinates */}
                    <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span>GPS: {space.latitude.toFixed(4)}, {space.longitude.toFixed(4)}</span>
                    </div>

                    {/* Availability Windows */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Weekly Operating Hours
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {space.space_availability && space.space_availability.length > 0 ? (
                          space.space_availability.map((slot: any) => (
                            <span
                              key={slot.id}
                              className="inline-flex items-center gap-1 rounded-md bg-[#2FD08A]/15 px-2 py-0.5 text-[11px] font-semibold text-[#0B1F3A]"
                            >
                              <Clock className="h-3 w-3 text-[#2FD08A]" />
                              <span>
                                {DAYS_MAP[slot.day_of_week]}: {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No availability set</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
