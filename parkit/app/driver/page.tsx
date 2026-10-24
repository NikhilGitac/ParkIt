import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  Search,
  MapPin,
  Clock,
  Filter,
  Car,
  Star,
  ShieldCheck,
  ArrowLeft,
  Navigation,
  Compass,
} from "lucide-react";

const placeholderSpots = [
  {
    id: "spot-1",
    name: "Central Metro Garage - Level 2",
    address: "240 Market Street, Financial District",
    price: "$6.50",
    unit: "/hr",
    distance: "0.2 miles away",
    rating: 4.9,
    reviews: 142,
    badge: "Available Now",
    badgeColor: "bg-[#2FD08A]/20 text-[#0B1F3A]",
    type: "Covered & Monitored",
  },
  {
    id: "spot-2",
    name: "Oakridge Residential Driveway",
    address: "1482 Elmwood Ave, Midtown",
    price: "$4.00",
    unit: "/hr",
    distance: "0.4 miles away",
    rating: 4.8,
    reviews: 67,
    badge: "EV Charging Available",
    badgeColor: "bg-[#FFC93C]/25 text-[#0B1F3A]",
    type: "Private Driveway",
  },
  {
    id: "spot-3",
    name: "Skyline Tower Secure Parking",
    address: "710 Grand Ave, Downtown",
    price: "$8.00",
    unit: "/hr",
    distance: "0.6 miles away",
    rating: 5.0,
    reviews: 218,
    badge: "Covered Bay",
    badgeColor: "bg-[#0B1F3A]/10 text-[#0B1F3A]",
    type: "24/7 Security",
  },
];

export default function DriverPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1 pb-16">
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
                <span className="inline-block rounded-full bg-[#2FD08A]/20 px-3 py-1 text-xs font-bold text-[#2FD08A] mb-2">
                  Driver Portal
                </span>
                <h1 className="text-3xl font-extrabold sm:text-4xl">
                  Find & Reserve Parking
                </h1>
                <p className="mt-1 text-sm text-slate-300 max-w-xl">
                  Discover verified nearby parking spots, check hourly rates, and reserve your bay.
                </p>
              </div>

              {/* Status info */}
              <div className="rounded-[16px] bg-white/10 border border-white/10 p-4 text-xs text-slate-300 max-w-xs">
                <span className="font-semibold text-white block mb-1">
                  Route Status: Phase 1 Placeholder
                </span>
                Full Leaflet interactive map, realtime slot availability, and booking flows will be connected here.
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar / Filter Controls */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="rounded-[16px] bg-white p-4 shadow-soft border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                <MapPin className="h-5 w-5 text-[#2FD08A] shrink-0" />
                <div className="w-full">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Where are you heading?
                  </label>
                  <input
                    type="text"
                    defaultValue="Downtown Metro, City Center"
                    className="w-full bg-transparent text-sm font-semibold text-[#0B1F3A] outline-none"
                    placeholder="Enter street, landmark, or city"
                    readOnly
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                <Clock className="h-5 w-5 text-[#0B1F3A] shrink-0" />
                <div className="w-full">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Duration
                  </label>
                  <p className="text-sm font-semibold text-[#0B1F3A]">2 Hours (Estimated)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                <Filter className="h-5 w-5 text-[#FFC93C] shrink-0" />
                <div className="w-full">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Filters
                  </label>
                  <p className="text-sm font-semibold text-[#0B1F3A]">Covered, EV, Instant</p>
                </div>
              </div>

              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#2FD08A] px-5 py-3 text-sm font-bold text-[#0B1F3A] transition-all hover:bg-[#26b878] shadow-soft"
              >
                <Search className="h-4 w-4" />
                <span>Search Spots</span>
              </button>
            </div>
          </div>
        </section>

        {/* Spot listings placeholder */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#0B1F3A]">
              Recommended Spots Near You
            </h2>
            <span className="text-xs text-slate-500">Showing 3 verified mock locations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {placeholderSpots.map((spot) => (
              <div
                key={spot.id}
                className="rounded-[16px] bg-white p-6 shadow-soft border border-slate-200/80 transition-all hover:shadow-soft-lg hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${spot.badgeColor}`}>
                    {spot.badge}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                    <Star className="h-3.5 w-3.5 fill-[#FFC93C] text-[#FFC93C]" />
                    <span>{spot.rating}</span>
                    <span className="text-slate-400">({spot.reviews})</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[#0B1F3A] mb-1">{spot.name}</h3>
                <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {spot.address}
                </p>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-[#0B1F3A]">{spot.price}</span>
                    <span className="text-xs text-slate-500">{spot.unit}</span>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F3A] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#163359]"
                  >
                    <Navigation className="h-3.5 w-3.5 text-[#2FD08A]" />
                    <span>View Spot</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Development roadmap callout */}
          <div className="mt-10 rounded-[16px] border border-dashed border-[#2FD08A] bg-[#2FD08A]/5 p-6 text-center">
            <h4 className="text-base font-bold text-[#0B1F3A]">
              🗺️ Map Engine & Instant Booking Under Construction
            </h4>
            <p className="mt-1 text-xs text-slate-600 max-w-xl mx-auto">
              Per specifications, interactive Leaflet map layers, dynamic reservation checkouts, and Supabase live slot syncing will be activated in upcoming phases.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
