import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  Car,
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  QrCode,
  IndianRupee,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Navigation,
  Building2,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] overflow-x-hidden w-full max-w-full">
      <Header />

      <main className="flex-1 overflow-x-hidden w-full max-w-full">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F0F4F8] to-[#F8FAFC] py-16 sm:py-24 lg:py-28">
          {/* Subtle decorative background glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#2FD08A]/10 to-[#FFC93C]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0B1F3A]/10 bg-white px-4 py-1.5 text-xs font-semibold text-[#0B1F3A] shadow-soft mb-8">
              <span className="flex h-2 w-2 rounded-full bg-[#2FD08A]"></span>
              <span>Next-Gen Smart Urban Parking</span>
              <Sparkles className="h-3.5 w-3.5 text-[#FFC93C]" />
            </div>

            {/* Headline */}
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-6xl sm:leading-[1.15]">
              Smart parking, <br className="hidden sm:block" />
              <span className="relative inline-block text-[#0B1F3A]">
                zero circling
                <span className="absolute bottom-1 left-0 -z-10 h-3 w-full bg-[#2FD08A]/25 rounded-md"></span>
              </span>{" "}
              around the block.
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-600 leading-relaxed">
              Reserve guaranteed parking spots in seconds or turn your empty driveway or garage
              into passive monthly income. Fast, cashless, and stress-free.
            </p>

            {/* TWO PRIMARY BUTTONS */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
              <Link
                href="/driver"
                className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-[16px] bg-[#2FD08A] px-8 text-base font-bold text-[#0B1F3A] shadow-soft transition-all hover:bg-[#26b878] hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                <Search className="h-5 w-5 stroke-[2.2]" />
                <span>Find parking</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/owner/list-space"
                className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-[16px] bg-[#0B1F3A] px-8 text-base font-bold text-white shadow-soft transition-all hover:bg-[#163359] hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                <IndianRupee className="h-5 w-5 text-[#FFC93C] stroke-[2.4]" />
                <span>List your space</span>
                <span className="rounded-full bg-[#FFC93C] px-2 py-0.5 text-xs font-black text-[#0B1F3A]">
                  Earn ₹₹₹
                </span>
              </Link>
            </div>

            {/* Quick Interactive Search Preview Card */}
            <div className="mt-14 mx-auto max-w-4xl rounded-[16px] bg-white p-4 sm:p-5 shadow-soft border border-slate-200/80">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100 text-left">
                  <MapPin className="h-5 w-5 text-[#2FD08A] shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Destination</p>
                    <p className="text-sm font-semibold text-[#0B1F3A] truncate">Downtown, Tech Hub</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100 text-left">
                  <Clock className="h-5 w-5 text-[#0B1F3A] shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Arrival Time</p>
                    <p className="text-sm font-semibold text-[#0B1F3A]">Today, 2:30 PM</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100 text-left">
                  <Car className="h-5 w-5 text-[#FFC93C] shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vehicle Type</p>
                    <p className="text-sm font-semibold text-[#0B1F3A]">Sedan / SUV</p>
                  </div>
                </div>

                <Link
                  href="/driver"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-[#163359]"
                >
                  <Search className="h-4 w-4 text-[#2FD08A]" />
                  <span>Search Spots</span>
                </Link>
              </div>

              {/* Live badges */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#2FD08A]" /> 100% Guaranteed Spot
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#2FD08A]" /> Free 10-Min Cancellation
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#2FD08A]" /> Contactless QR Pass
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS & VALUE PROP */}
        <section className="py-12 bg-white border-y border-slate-200/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="p-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A]">12,500+</p>
                <p className="mt-1 text-sm font-medium text-slate-500">Available Parking Spots</p>
              </div>
              <div className="p-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#2FD08A]">20 mins</p>
                <p className="mt-1 text-sm font-medium text-slate-500">Average Time Saved Daily</p>
              </div>
              <div className="p-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A]">₹14,500</p>
                <p className="mt-1 text-sm font-medium text-slate-500">Avg Monthly Host Earnings</p>
              </div>
              <div className="p-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#FFC93C]">4.9 / 5</p>
                <p className="mt-1 text-sm font-medium text-slate-500">Driver Satisfaction Rating</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID - 16px CARDS & SOFT SHADOWS */}
        <section id="features" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2FD08A] bg-[#2FD08A]/10 px-3 py-1 rounded-full">
                Engineered for Mobility
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-[#0B1F3A] sm:text-4xl">
                Everything you need to park or earn with peace of mind
              </h2>
              <p className="mt-4 text-base text-slate-600">
                ParKit eliminates parking friction with smart space discovery, effortless booking, and host monetization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="rounded-[16px] bg-white p-8 shadow-soft border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-soft-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B1F3A] text-[#2FD08A] mb-6">
                  <Navigation className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0B1F3A]">Instant Spot Guarantee</h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                  Never circle busy streets again. Lock in your exact parking bay before leaving home and navigate directly to it with turn-by-turn guidance.
                </p>
                <div className="mt-6 flex items-center text-sm font-semibold text-[#0B1F3A]">
                  <Link href="/driver" className="inline-flex items-center gap-1.5 hover:text-[#2FD08A]">
                    Explore Driver Features <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-[16px] bg-white p-8 shadow-soft border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-soft-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2FD08A]/20 text-[#0B1F3A] mb-6">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0B1F3A]">Contactless QR Pass</h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                  Fast access without tickets or gate attendants. Receive an encrypted QR code pass instantly to scan and check into your reserved spot.
                </p>
                <div className="mt-6 flex items-center text-sm font-semibold text-[#0B1F3A]">
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-[#2FD08A]" /> Bank-grade verification
                  </span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-[16px] bg-white p-8 shadow-soft border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-soft-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFC93C]/20 text-[#0B1F3A] mb-6">
                  <IndianRupee className="h-6 w-6 text-[#0B1F3A]" />
                </div>
                <h3 className="text-xl font-bold text-[#0B1F3A]">Monetize Idle Driveways</h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                  Homeowners and facility managers can list spare parking spots in 3 minutes. Set custom pricing, view reservations, and get paid directly.
                </p>
                <div className="mt-6 flex items-center text-sm font-semibold text-[#0B1F3A]">
                  <Link href="/owner" className="inline-flex items-center gap-1.5 hover:text-[#FFC93C]">
                    Calculate Your Earnings <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION - DEDICATED FOR DRIVERS AND OWNERS */}
        <section id="how-it-works" className="py-20 sm:py-24 bg-white border-t border-slate-200/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] bg-slate-100 px-3.5 py-1 rounded-full border border-slate-200">
                Simple & Frictionless
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-[#0B1F3A] sm:text-4xl tracking-tight">
                How ParKit Works
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600">
                A seamless urban mobility ecosystem tailored for both drivers and private space hosts.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* FLOW 1: FOR DRIVERS */}
              <div className="rounded-3xl bg-slate-50/70 p-6 sm:p-8 border border-slate-200/90 shadow-soft space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0B1F3A] text-[#2FD08A] flex items-center justify-center font-bold shadow-xs">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-[#0B1F3A]">For Drivers</h3>
                      <p className="text-xs text-slate-500">Guaranteed parking in 3 easy steps</p>
                    </div>
                  </div>
                  <Link
                    href="/driver"
                    className="text-xs font-bold text-[#0B1F3A] hover:text-[#26b878] inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
                  >
                    <span>Launch Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B1F3A] text-xs font-extrabold text-white shrink-0 shadow-xs">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#0B1F3A]">Search & AI Recommendation</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Explore OpenStreetMap parking pins near you. ParKit's AI concierge recommends the best match based on proximity, hourly rate, and operating windows.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2FD08A] text-xs font-extrabold text-[#0B1F3A] shrink-0 shadow-xs">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#0B1F3A]">Lock Slot & Pay with UPI</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Pick your start time and duration. Database overlap locks prevent double-booking while you complete the demo-safe instant UPI checkout.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFC93C] text-xs font-extrabold text-[#0B1F3A] shrink-0 shadow-xs">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#0B1F3A]">Scan QR Pass & Gate OTP</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Receive a scannable QR pass and 6-digit gate OTP. Drive in, present your code to the lot owner, and park with zero circling.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FLOW 2: FOR SPACE OWNERS */}
              <div className="rounded-3xl bg-slate-50/70 p-6 sm:p-8 border border-slate-200/90 shadow-soft space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#2FD08A] text-[#0B1F3A] flex items-center justify-center font-bold shadow-xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-[#0B1F3A]">For Space Owners</h3>
                      <p className="text-xs text-slate-500">Monetize idle driveways & bays</p>
                    </div>
                  </div>
                  <Link
                    href="/owner/dashboard"
                    className="text-xs font-bold text-[#0B1F3A] hover:text-[#26b878] inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
                  >
                    <span>Host Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B1F3A] text-xs font-extrabold text-white shrink-0 shadow-xs">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#0B1F3A]">List in 2 Minutes</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Pin your driveway or private bay on the map, set hourly rates (₹20 - ₹100/hr), and define custom operating days and hours.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2FD08A] text-xs font-extrabold text-[#0B1F3A] shrink-0 shadow-xs">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#0B1F3A]">Real-time Booking Stream</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Driver reservations stream directly into your host dashboard via Supabase Realtime without manual phone calls or message hassle.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFC93C] text-xs font-extrabold text-[#0B1F3A] shrink-0 shadow-xs">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#0B1F3A]">Verify OTP & Track Earnings</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Validate the driver's 6-digit OTP code on the verification screen to grant gate entry. Monitor total earnings with automated payouts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DUAL CTA BANNER */}
        <section className="py-20 bg-gradient-to-br from-[#0B1F3A] via-[#071527] to-[#0B1F3A] text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[16px] bg-white/5 border border-white/10 p-8 sm:p-14 text-center backdrop-blur-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2FD08A]/20 px-3.5 py-1 text-xs font-semibold text-[#2FD08A] mb-6">
                <Zap className="h-3.5 w-3.5" />
                Get Started Today
              </span>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Ready to experience stress-free parking?
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-slate-300">
                Join thousands of drivers saving time daily, or list your driveway to turn unused concrete into regular income.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/driver"
                  className="flex h-13 w-full sm:w-auto items-center justify-center gap-2 rounded-[16px] bg-[#2FD08A] px-8 text-base font-bold text-[#0B1F3A] transition-all hover:bg-[#26b878] hover:shadow-lg"
                >
                  <Search className="h-5 w-5" />
                  <span>Find parking</span>
                </Link>

                <Link
                  href="/owner/list-space"
                  className="flex h-13 w-full sm:w-auto items-center justify-center gap-2 rounded-[16px] border border-white/30 bg-white/10 px-8 text-base font-bold text-white transition-all hover:bg-white/20"
                >
                  <IndianRupee className="h-5 w-5 text-[#FFC93C]" />
                  <span>List your space</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
