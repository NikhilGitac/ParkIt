"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  redirectUrl?: string;
  onSuccess?: (user: any) => void;
}

export function AuthModal({
  isOpen,
  onClose,
  title = "Sign in to reserve your parking",
  subtitle = "Log in or create a quick driver account to confirm your spot and receive your gate entry OTP.",
  redirectUrl,
  onSuccess,
}: AuthModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFinishAuth = (userData: any) => {
    if (onSuccess) {
      onSuccess(userData);
    }
    if (redirectUrl) {
      router.push(redirectUrl);
    } else {
      router.refresh();
      onClose();
    }
  };

  // 1. Email/Password Login
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (!email.trim() || !password) {
        throw new Error("Please enter your email and password.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        setSuccessNotice("Logged in successfully! Redirecting to booking...");
        setTimeout(() => {
          handleFinishAuth(data.user);
        }, 300);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Email/Password Sign Up
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (!fullName.trim()) throw new Error("Please enter your full name.");
      if (!email.trim()) throw new Error("Please enter a valid email address.");
      if (password.length < 6) throw new Error("Password must be at least 6 characters.");

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            role: "driver",
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Upsert into profiles
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            role: "driver",
            updated_at: new Date().toISOString(),
          });
        } catch {
          // ignore profile sync error if handled by trigger
        }

        if (data.session) {
          setSuccessNotice("Account created! Redirecting to booking...");
          setTimeout(() => {
            handleFinishAuth(data.user);
          }, 300);
        } else {
          setSuccessNotice(
            "Account created! Please check your email inbox to confirm your account."
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Quick Demo Login for instant testing
  const handleQuickDemoLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    const demoEmail = "demo.driver.rohan@parkit.internal";
    const demoPassword = "DemoPassword123!";

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error) {
        // If password login fails, set email & password in inputs for manual submission
        setEmail(demoEmail);
        setPassword(demoPassword);
        throw new Error(
          "Demo driver account password was not accepted. You can also sign up with your email."
        );
      }

      if (data.user) {
        setSuccessNotice("Signed in as Demo Driver (Rohan Malhotra)!");
        setTimeout(() => {
          handleFinishAuth(data.user);
        }, 400);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in with demo credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative bg-gradient-to-br from-[#0B1F3A] to-[#163359] text-white p-6 pb-7">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 bg-[#2FD08A]/20 text-[#2FD08A] px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2.5 border border-[#2FD08A]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Driver Authentication</span>
          </div>

          <h3 className="text-xl font-extrabold text-white">{title}</h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{subtitle}</p>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 bg-white/10 p-1 rounded-xl mt-5 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-white text-[#0B1F3A] shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-white text-[#0B1F3A] shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Quick Demo Login Pill Button */}
          {mode === "login" && (
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-between transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 fill-amber-400 group-hover:scale-110 transition-transform" />
                <span>1-Click Demo Driver Sign In</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 underline">
                Rohan (Verified Driver)
              </span>
            </button>
          )}

          {/* 1. Log In Form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40 focus:border-[#2FD08A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40 focus:border-[#2FD08A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#2FD08A] hover:bg-[#26b878] active:scale-[0.99] text-[#0B1F3A] font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In & Continue Booking</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. Sign Up Form */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40 focus:border-[#2FD08A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40 focus:border-[#2FD08A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40 focus:border-[#2FD08A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40 focus:border-[#2FD08A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#2FD08A] hover:bg-[#26b878] active:scale-[0.99] text-[#0B1F3A] font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
