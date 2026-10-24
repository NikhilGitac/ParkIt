"use client";

import Link from "next/link";
import { Car, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      {/* Back to Home link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0B1F3A] transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to ParKit Home
      </Link>

      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B1F3A] text-[#2FD08A] shadow-sm">
              <Car className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
              Par<span className="text-[#2FD08A]">Kit</span>
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-extrabold text-[#0B1F3A]">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage your bookings or space listings
          </p>
        </div>

        {/* 16px Rounded Card with Soft Shadow */}
        <div className="rounded-[16px] bg-white p-8 shadow-soft border border-slate-200/80">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-bold text-[#0B1F3A] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="driver@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-[#0B1F3A] outline-none transition-all focus:border-[#2FD08A] focus:bg-white focus:ring-2 focus:ring-[#2FD08A]/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                  Password
                </label>
                <a href="#" className="text-xs font-semibold text-slate-400 hover:text-[#0B1F3A]">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-[#0B1F3A] outline-none transition-all focus:border-[#2FD08A] focus:bg-white focus:ring-2 focus:ring-[#2FD08A]/20"
                />
              </div>
            </div>

            <button
              type="button"
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] text-sm font-bold text-white shadow-soft transition-all hover:bg-[#163359]"
            >
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4 text-[#2FD08A]" />
            </button>
          </form>

          {/* Development roadmap badge */}
          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">
              🔒 Auth placeholder: Supabase Auth will be wired here in the next step.
            </p>
          </div>
        </div>

        {/* Footer link to sign up */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-bold text-[#0B1F3A] hover:text-[#2FD08A] transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
