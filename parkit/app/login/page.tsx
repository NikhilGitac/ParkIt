"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Car, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const authError = searchParams.get("error");

  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    authError === "auth_failed" ? "Authentication link expired or invalid. Please log in." : null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Fetch user profile role to determine portal redirect
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        router.refresh();

        if (!profile || !profile.role) {
          router.push("/onboarding");
          return;
        }

        // If a specific next path was requested and matches the role
        if (nextPath) {
          if (profile.role === "driver" && nextPath.startsWith("/driver")) {
            router.push(nextPath);
            return;
          }
          if (profile.role === "owner" && nextPath.startsWith("/owner")) {
            router.push(nextPath);
            return;
          }
        }

        // Standard role-based redirect
        if (profile.role === "owner") {
          router.push("/owner");
        } else {
          router.push("/driver");
        }
      }
    } catch (err: unknown) {
      let msg = "Invalid email or password. Please try again.";
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes("fetch")) {
          msg = "Could not connect to Supabase. Please check your actual NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.";
        } else {
          msg = err.message;
        }
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-[16px] bg-white p-6 sm:p-8 shadow-soft border-slate-200">
      <CardHeader className="p-0 pb-5">
        <CardTitle className="text-base font-bold text-[#0B1F3A]">Sign In</CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Enter your credentials to continue to your dashboard
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {errorMsg && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="login-email" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@example.com"
                className="h-10 rounded-xl border-slate-200 pl-10 text-sm focus-visible:ring-[#2FD08A]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                Password
              </Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-10 rounded-xl border-slate-200 pl-10 text-sm focus-visible:ring-[#2FD08A]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] text-sm font-bold text-white shadow-soft transition-all hover:bg-[#163359]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#2FD08A]" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 text-[#2FD08A]" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
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
            Welcome back
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Sign in to access your bookings or parking space management
          </p>
        </div>

        {/* Suspense boundary for useSearchParams */}
        <Suspense
          fallback={
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#2FD08A]" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Footer link to sign up */}
        <p className="mt-5 text-center text-xs text-slate-500">
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="font-bold text-[#0B1F3A] hover:text-[#2FD08A] transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
