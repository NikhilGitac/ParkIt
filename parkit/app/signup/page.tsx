"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Car,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<"driver" | "owner">("driver");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (!fullName.trim()) {
        throw new Error("Please enter your full name.");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      // Supabase Auth Sign Up
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            role,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Check if user session was immediately established or email confirmation is pending
      if (data.user) {
        // Upsert into profiles to ensure immediate consistency
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            role,
            updated_at: new Date().toISOString(),
          });
        } catch {
          // If trigger already handled it or RLS waiting for email confirmation
        }

        if (data.session) {
          // User is logged in immediately
          router.refresh();
          if (role === "owner") {
            router.push("/owner");
          } else {
            router.push("/driver");
          }
          return;
        } else {
          // Email confirmation link was sent
          setEmailConfirmationRequired(true);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed. Please try again.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      {/* Back to Home link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0B1F3A] transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to ParKit Home
      </Link>

      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B1F3A] text-[#2FD08A] shadow-sm">
              <Car className="h-6 w-6 stroke-[2.2]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
              Par<span className="text-[#2FD08A]">Kit</span>
            </span>
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold text-[#0B1F3A]">
            Create your account
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Sign up to reserve parking bays or monetize your private space
          </p>
        </div>

        {/* Card Form */}
        <Card className="rounded-[16px] bg-white p-6 sm:p-8 shadow-soft border-slate-200">
          <CardHeader className="p-0 pb-5">
            <CardTitle className="text-base font-bold text-[#0B1F3A]">Sign Up with Email</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your details and select your account role below
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {emailConfirmationRequired ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-[#2FD08A] mb-2" />
                <h3 className="text-sm font-bold text-[#0B1F3A]">Verify your email</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  We&apos;ve sent a verification link to <strong className="text-[#0B1F3A]">{email}</strong>.
                  Please click the link in your email to confirm your account and get started!
                </p>
                <div className="mt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A] hover:text-[#2FD08A]"
                  >
                    Proceed to Login <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Role selection tab */}
                <div>
                  <Label className="block text-xs font-bold text-[#0B1F3A] mb-1.5 uppercase tracking-wider">
                    I want to join as:
                  </Label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
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
                      <span>Driver</span>
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
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <Label htmlFor="signup-name" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="h-10 rounded-xl border-slate-200 pl-10 text-sm focus-visible:ring-[#2FD08A]"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <Label htmlFor="signup-phone" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    Phone (Optional)
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="h-10 rounded-xl border-slate-200 pl-10 text-sm focus-visible:ring-[#2FD08A]"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="h-10 rounded-xl border-slate-200 pl-10 text-sm focus-visible:ring-[#2FD08A]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="h-10 rounded-xl border-slate-200 pl-10 text-sm focus-visible:ring-[#2FD08A]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2FD08A] text-sm font-bold text-[#0B1F3A] shadow-soft transition-all hover:bg-[#26b878]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#0B1F3A]" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign up as {role === "owner" ? "Space Owner" : "Driver"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer link to login */}
        <p className="mt-5 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#0B1F3A] hover:text-[#2FD08A] transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
