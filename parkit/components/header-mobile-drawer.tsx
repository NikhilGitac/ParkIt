"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

interface HeaderMobileDrawerProps {
  authSlot: React.ReactNode;
}

export function HeaderMobileDrawer({ authSlot }: HeaderMobileDrawerProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
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
              href="/owner/list-space"
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

          <div onClick={() => setMobileMenuOpen(false)}>
            {authSlot}
          </div>
        </div>
      )}
    </>
  );
}
