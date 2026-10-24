"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Menu, X, ArrowRight, ShieldCheck } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <a
            href="#how-it-works"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-[#0B1F3A]"
          >
            How It Works
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-[#0B1F3A]"
          >
            Features
          </a>
        </nav>

        {/* Auth Buttons */}
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
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
            >
              Features
            </a>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
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
          </div>
        </div>
      )}
    </header>
  );
}
