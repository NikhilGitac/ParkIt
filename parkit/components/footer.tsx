import Link from "next/link";
import { Car, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-[#0B1F3A] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#2FD08A]">
                <Car className="h-5 w-5" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Par<span className="text-[#2FD08A]">Kit</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Empowering urban mobility with guaranteed, stress-free parking reservations and peer-to-peer driveway sharing.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#2FD08A]">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Spots & Guaranteed Reservations</span>
            </div>
          </div>

          {/* Drivers */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-200">
              For Drivers
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/driver" className="hover:text-[#2FD08A] transition-colors">
                  Find parking
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-[#2FD08A] transition-colors">
                  How booking works
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#2FD08A] transition-colors">
                  Instant QR tickets
                </Link>
              </li>
            </ul>
          </div>

          {/* Space Owners */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-200">
              For Space Owners
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/owner/list-space" className="hover:text-[#FFC93C] transition-colors">
                  List your space
                </Link>
              </li>
              <li>
                <Link href="/owner" className="hover:text-[#FFC93C] transition-colors">
                  Earnings calculator
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#FFC93C] transition-colors">
                  Host protection
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-200">
              Account
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Log in
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-[#2FD08A] transition-colors">
                  Create account
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-[#2FD08A] animate-pulse"></span>
                  System operational
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 ParKit Inc. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            Designed with modern urban convenience in mind.
          </div>
        </div>
      </div>
    </footer>
  );
}
