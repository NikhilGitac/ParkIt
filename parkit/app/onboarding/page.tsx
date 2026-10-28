"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Car, Building2, Phone, User, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<"driver" | "owner">("driver");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check existing profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.phone) setPhone(profile.phone);
        if (profile.role) setRole(profile.role as "driver" | "owner");

        // If profile already fully configured, redirect directly
        if (profile.role) {
          router.replace(profile.role === "owner" ? "/owner" : "/driver");
          return;
        }
      } else if (user.user_metadata) {
        if (user.user_metadata.full_name) setFullName(user.user_metadata.full_name);
        if (user.user_metadata.phone) setPhone(user.user_metadata.phone);
        if (user.user_metadata.role) setRole(user.user_metadata.role);
      }

      setInitialLoading(false);
    }

    loadUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Save full_name, phone, and role in profiles table
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        role,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      // Redirect drivers to /driver and owners to /owner
      router.refresh();
      if (role === "owner") {
        router.push("/owner");
      } else {
        router.push("/driver");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile. Please try again.";
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#0B1F3A]">
          <Loader2 className="h-5 w-5 animate-spin text-[#2FD08A]" />
          <span>Setting up your ParKit workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B1F3A] text-[#2FD08A] shadow-sm">
              <Car className="h-6 w-6 stroke-[2.2]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
              Par<span className="text-[#2FD08A]">Kit</span>
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-[#0B1F3A]">
            Choose your role on ParKit
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tell us how you plan to use ParKit so we can tailor your experience
          </p>
        </div>

        <Card className="rounded-[16px] bg-white p-6 sm:p-8 shadow-soft border-slate-200">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-lg font-bold text-[#0B1F3A]">Account Setup</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Select whether you are parking vehicles or hosting a driveway
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {errorMsg && (
              <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection Cards */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                  Select your primary role
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Driver Option */}
                  <div
                    onClick={() => setRole("driver")}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      role === "driver"
                        ? "border-[#2FD08A] bg-[#2FD08A]/10 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        role === "driver" ? "bg-[#2FD08A] text-[#0B1F3A]" : "bg-slate-200 text-slate-600"
                      }`}>
                        <Car className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0B1F3A]">I&apos;m a Driver</p>
                        <p className="text-[11px] text-slate-500">Find & reserve spots</p>
                      </div>
                    </div>
                  </div>

                  {/* Owner Option */}
                  <div
                    onClick={() => setRole("owner")}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      role === "owner"
                        ? "border-[#FFC93C] bg-[#FFC93C]/15 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        role === "owner" ? "bg-[#FFC93C] text-[#0B1F3A]" : "bg-slate-200 text-slate-600"
                      }`}>
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0B1F3A]">Space Owner</p>
                        <p className="text-[11px] text-slate-500">List space & earn ₹₹₹</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="h-11 rounded-xl border-slate-200 pl-10 text-sm focus-visible:ring-[#2FD08A]"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="h-11 rounded-xl border-slate-200 pl-10 text-sm focus-visible:ring-[#2FD08A]"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Used for booking verification codes and spot arrival notifications.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] text-sm font-bold text-white shadow-soft transition-all hover:bg-[#163359]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#2FD08A]" />
                    <span>Saving your profile...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to {role === "owner" ? "Host Portal" : "Driver Portal"}</span>
                    <ArrowRight className="h-4 w-4 text-[#2FD08A]" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
