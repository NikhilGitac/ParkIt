import { Suspense } from "react";
import Link from "next/link";
import { Car } from "lucide-react";
import { NavbarAuth } from "./navbar-auth";
import { NavbarAuthSkeleton } from "./navbar-auth-skeleton";
import { HeaderMobileDrawer } from "./header-mobile-drawer";

export function Header() {
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
            href="/owner/list-space"
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

        {/* Auth Buttons / User Profile wrapped in Suspense for non-blocking PPR */}
        <Suspense fallback={<NavbarAuthSkeleton />}>
          <NavbarAuth />
        </Suspense>

        {/* Mobile menu drawer */}
        <HeaderMobileDrawer
          authSlot={
            <Suspense fallback={<NavbarAuthSkeleton mobile />}>
              <NavbarAuth mobile />
            </Suspense>
          }
        />
      </div>
    </header>
  );
}
