"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Mail, Lock, User, ArrowRight, ArrowLeft, Building2 } from "lucide-react";

export default function SignupPage() {
  const [role, setRole] = useState<"driver" | "owner">("driver");

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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Join ParKit to reserve spots or monetize your parking space
          </p>
        </div>

        {/* 16px Rounded Card with Soft Shadow */}
        <div className="rounded-[16px] bg-white p-8 shadow-soft border border-slate-200/80">
          {/* Role selector tab */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole("driver")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                role === "driver"
                  ? "bg-white text-[#0B1F3A] shadow-sm"
                  : "text-slate-500 hover:text-[#0B1F3A]"
              }`}
            >
              <Car className="h-3.5 w-3.5 text-[#2FD08A]" />
              <span>I&apos;m a Driver</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("owner")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                role === "owner"
                  ? "bg-white text-[#0B1F3A] shadow-sm"
                  : "text-slate-500 hover:text-[#0B1F3A]"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-[#FFC93C]" />
              <span>Space Owner</span>
            </button>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-bold text-[#0B1F3A] mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Alex Morgan"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-[#0B1F3A] outline-none transition-all focus:border-[#2FD08A] focus:bg-white focus:ring-2 focus:ring-[#2FD08A]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1F3A] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="alex@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-[#0B1F3A] outline-none transition-all focus:border-[#2FD08A] focus:bg-white focus:ring-2 focus:ring-[#2FD08A]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1F3A] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Create a secure password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-[#0B1F3A] outline-none transition-all focus:border-[#2FD08A] focus:bg-white focus:ring-2 focus:ring-[#2FD08A]/20"
                />
              </div>
            </div>

            <button
              type="button"
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2FD08A] text-sm font-bold text-[#0B1F3A] shadow-soft transition-all hover:bg-[#26b878]"
            >
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Development roadmap badge */}
          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">
              🔒 Auth placeholder: Account registration and database profiles will be hooked up in the next phase.
            </p>
          </div>
        </div>

        {/* Footer link to login */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#0B1F3A] hover:text-[#2FD08A] transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
