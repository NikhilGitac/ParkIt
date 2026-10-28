"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  X,
  Phone,
  KeyRound,
  FileCheck,
  Car,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  Upload,
  FileText,
} from "lucide-react";
import { InsurancePlan, FALLBACK_INSURANCE_PLANS } from "@/lib/insurance-data";
import { PolicySummaryModal } from "@/components/insurance/policy-summary-modal";

interface SavedVehicle {
  id: string;
  plate: string;
  type: string;
}

interface DriverVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  spaceTitle: string;
  spaceAddress: string;
  hourlyRate: number;
  durationHours: number;
  totalPrice: number;
  selectedDate?: string;
  startTime?: string;
  initialPhone?: string;
  isAlreadyVerified?: boolean;
  selectedPlan?: InsurancePlan;
  insurancePremium?: number;
  onReservationComplete?: () => void;
}

export function DriverVerificationModal({
  isOpen,
  onClose,
  spaceId,
  spaceTitle,
  spaceAddress,
  hourlyRate,
  durationHours,
  totalPrice,
  selectedDate = new Date().toISOString().split("T")[0],
  startTime = "14:00",
  initialPhone = "",
  isAlreadyVerified = false,
  selectedPlan = FALLBACK_INSURANCE_PLANS[0],
  insurancePremium = 0,
  onReservationComplete,
}: DriverVerificationModalProps) {
  // If already verified, start directly at step 3 (Vehicle select) or 4 (Fit check)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(isAlreadyVerified ? 3 : 1);

  // Step 1: Phone + OTP
  const [phone, setPhone] = useState(initialPhone || "9810012002");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Step 2: Driving Licence
  const [dlNumber, setDlNumber] = useState("UP1620210001234");
  const [dlFileName, setDlFileName] = useState<string | null>(null);
  const [dlError, setDlError] = useState<string | null>(null);

  // Step 3: Vehicle Number & Type
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("new");
  const [plate, setPlate] = useState("UP16AB1234");
  const [vehicleType, setVehicleType] = useState<string>("sedan");
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  // Step 4: Fit Check
  const [fitChecking, setFitChecking] = useState(false);
  const [fitPassed, setFitPassed] = useState(false);
  const [fitError, setFitError] = useState<string | null>(null);
  const [spotMaxVehicle, setSpotMaxVehicle] = useState("SUV");

  // Step 5: Verification & Reservation
  const [verifying, setVerifying] = useState(false);
  const [paying, setPaying] = useState(false);
  const [reservedSuccess, setReservedSuccess] = useState(false);
  const [confirmedOtp, setConfirmedOtp] = useState<string>("482910");
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>("");
  const [policyNumber, setPolicyNumber] = useState<string>("");
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load saved verification status and vehicles on open
  useEffect(() => {
    if (!isOpen) return;

    async function loadDriverStatus() {
      try {
        const res = await fetch("/api/verify/status");
        if (res.ok) {
          const data = await res.json();
          if (data.phone) setPhone(data.phone.replace(/\D/g, "").slice(-10));
          if (data.vehicles && data.vehicles.length > 0) {
            setSavedVehicles(data.vehicles);
            setSelectedVehicleId(data.vehicles[0].id);
            setPlate(data.vehicles[0].plate);
            setVehicleType(data.vehicles[0].type);
          }
          if (data.driver_status === "verified") {
            setStep(3); // Skip phone & DL, jump directly to vehicle select & fit check
          }
        }
      } catch {
        // Ignore fallback
      }
    }
    loadDriverStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Send OTP
  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/verify/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Failed to send OTP.");
        return;
      }
      setOtpSent(true);
      setOtpCode("123456");
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // 1. Verify OTP
  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/verify/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Invalid OTP code.");
        return;
      }
      setStep(2);
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // 2. Validate Driving Licence
  const handleDlNext = () => {
    setDlError(null);
    const cleanDl = dlNumber.replace(/[\s-]/g, "").toUpperCase();
    if (!/^[A-Z]{2}[0-9]{2}[0-9]{11}$/.test(cleanDl)) {
      setDlError(
        "Invalid Driving Licence format. Expected 15 characters (e.g. UP1620210001234)."
      );
      return;
    }
    setStep(3);
  };

  // 3. Vehicle Next -> Trigger Fit Check
  const handleVehicleNext = async () => {
    setVehicleError(null);
    const cleanPlate = plate.replace(/[\s-]/g, "").toUpperCase();
    if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/.test(cleanPlate)) {
      setVehicleError(
        "Invalid vehicle plate format. Example: UP16AB1234 or DL01CA9999."
      );
      return;
    }

    setStep(4);
    await runFitCheck(vehicleType);
  };

  // 4. Run Fit Check via API
  const runFitCheck = async (typeToCheck: string) => {
    setFitChecking(true);
    setFitError(null);
    setFitPassed(false);

    try {
      const res = await fetch("/api/verify/fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId,
          vehicleType: typeToCheck,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFitError(data.error || "Vehicle does not fit this space.");
        setSpotMaxVehicle(data.maxVehicleType || "Sedan");
        setFitPassed(false);
      } else {
        setFitPassed(true);
        setSpotMaxVehicle(data.maxVehicleType || "SUV");
      }
    } catch {
      setFitError("Fit verification failed. Please try again.");
    } finally {
      setFitChecking(false);
    }
  };

  // 5. Final Step: Verify Driver & Simulate Reservation
  const handleCompleteReservation = async () => {
    setStep(5);
    setVerifying(true);
    setSubmitError(null);

    try {
      // 1. Submit driver verification
      const verifyRes = await fetch("/api/verify/driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dlNumber,
          plate: plate.replace(/[\s-]/g, "").toUpperCase(),
          vehicleType,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setSubmitError(verifyData.error || "Driver verification failed.");
        setVerifying(false);
        return;
      }

      setVerifying(false);
      setPaying(true);

      // 2. Create real booking with selected insurance coverage
      try {
        const [y, m, d] = selectedDate.split("-").map(Number);
        const [startH, startM] = startTime.split(":").map(Number);
        const startObj = new Date(y, m - 1, d, startH, startM || 0, 0);
        const endObj = new Date(startObj.getTime() + durationHours * 60 * 60 * 1000);
        const startIso = startObj.toISOString();
        const endIso = endObj.toISOString();

        const bookingRes = await fetch("/api/create_booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            space_id: spaceId,
            start_time: startIso,
            end_time: endIso,
            insurance_plan_id: selectedPlan?.id,
          }),
        });

        if (bookingRes.ok) {
          const bookingData = await bookingRes.json();
          if (bookingData.booking_id) {
            setConfirmedBookingId(bookingData.booking_id);
            if (bookingData.policy_number) {
              setPolicyNumber(bookingData.policy_number);
            }
            if (bookingData.otp_code) {
              setConfirmedOtp(bookingData.otp_code);
            }

            // Simulate instant UPI payment completion
            await fetch("/api/bookings/pay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: bookingData.booking_id,
                upiId: "driver@okhdfcbank",
              }),
            });
          }
        }
      } catch (err) {
        console.warn("Could not create DB booking, using local state:", err);
      }

      await new Promise((r) => setTimeout(r, 600));

      setPaying(false);
      setReservedSuccess(true);

      if (onReservationComplete) {
        onReservationComplete();
      }
    } catch {
      setSubmitError("Failed to complete reservation. Please try again.");
      setVerifying(false);
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-[#0B1F3A] text-white p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2FD08A]/20 px-3 py-1 text-xs font-bold text-[#2FD08A]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Driver Verification • Demo Mode</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black">
            Reserve Parking Spot
          </h2>
          <p className="text-xs text-slate-300 mt-1 truncate">
            {spaceTitle} • ₹{hourlyRate}/hr
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/10 text-xs">
            {[
              { num: 1, label: "Phone" },
              { num: 2, label: "Licence" },
              { num: 3, label: "Vehicle" },
              { num: 4, label: "Fit Check" },
              { num: 5, label: "Reserved" },
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                    step === s.num
                      ? "bg-[#2FD08A] text-[#0B1F3A] scale-110 shadow-sm"
                      : step > s.num
                      ? "bg-emerald-500 text-white"
                      : "bg-white/20 text-slate-300"
                  }`}
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span className="text-[10px] text-slate-300 font-semibold hidden sm:inline">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* STEP 1: Phone + OTP */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
                <Phone className="w-4 h-4 text-[#2FD08A] shrink-0" />
                <span>
                  <strong>Demo mode:</strong> Enter 10-digit mobile. Test OTP code is <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">123456</code>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Mobile Number (Indian 10-Digit)
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9810012002"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                  />
                  {!otpSent && (
                    <button
                      type="button"
                      disabled={otpLoading || phone.length < 10}
                      onClick={handleSendOtp}
                      className="bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-bold px-4 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {otpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                      <span>Send OTP</span>
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Enter 6-Digit OTP
                      </label>
                      <span className="text-[11px] font-bold text-[#26b878]">
                        Hint: 123456 (Demo)
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold tracking-widest text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40 text-center"
                    />
                  </div>

                  {otpError && (
                    <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={otpLoading || otpCode.length !== 6}
                    onClick={handleVerifyOtp}
                    className="w-full bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] font-extrabold text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Verify Mobile & Continue</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Driving Licence */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600">
                <span className="font-bold text-[#0B1F3A]">Demo Mode Verification:</span> Enter a standard 15-character Indian DL number (e.g. <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">UP1620210001234</code>).
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Driving Licence Number
                </label>
                <input
                  type="text"
                  value={dlNumber}
                  onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                  placeholder="UP1620210001234"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                />
              </div>

              {/* Optional Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Licence Photo (Optional in Demo)
                </label>
                <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50 hover:bg-white transition-colors cursor-pointer">
                  <label className="text-xs font-bold text-slate-600 cursor-pointer flex items-center justify-center gap-1.5">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>{dlFileName || "Click to upload licence photo / PDF"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setDlFileName(f.name);
                      }}
                    />
                  </label>
                </div>
              </div>

              {dlError && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{dlError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleDlNext}
                  className="flex-1 bg-[#0B1F3A] hover:bg-[#163359] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Vehicle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Vehicle Number & Type */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Saved Vehicles Selection if available */}
              {savedVehicles.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-[#0B1F3A] mb-1.5 uppercase tracking-wider">
                    Select From Saved Vehicles
                  </label>
                  <div className="space-y-2">
                    {savedVehicles.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVehicleId(v.id);
                          setPlate(v.plate);
                          setVehicleType(v.type);
                        }}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          selectedVehicleId === v.id
                            ? "border-[#2FD08A] bg-emerald-50/20 ring-1 ring-[#2FD08A]"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Car className="w-4 h-4 text-[#0B1F3A]" />
                          <div>
                            <span className="font-mono font-extrabold text-xs text-[#0B1F3A] block">
                              {v.plate}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">
                              {v.type}
                            </span>
                          </div>
                        </div>
                        {selectedVehicleId === v.id && (
                          <CheckCircle2 className="w-4 h-4 text-[#2FD08A]" />
                        )}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVehicleId("new");
                        setPlate("");
                      }}
                      className={`text-xs font-bold text-[#0B1F3A] hover:text-[#26b878] inline-block mt-1 ${
                        selectedVehicleId === "new" ? "text-[#26b878] underline" : ""
                      }`}
                    >
                      + Enter a different vehicle
                    </button>
                  </div>
                </div>
              )}

              {(selectedVehicleId === "new" || savedVehicles.length === 0) && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                      Vehicle Registration Plate
                    </label>
                    <input
                      type="text"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      placeholder="e.g. UP16AB1234 or DL01CA9999"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                      Vehicle Category
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "bike", label: "Bike", icon: "🏍️" },
                        { id: "hatchback", label: "Hatchback", icon: "🚗" },
                        { id: "sedan", label: "Sedan", icon: "🚙" },
                        { id: "suv", label: "SUV", icon: "🚐" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setVehicleType(t.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            vehicleType === t.id
                              ? "bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-sm font-bold"
                              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 text-xs font-semibold"
                          }`}
                        >
                          <span className="text-base block mb-0.5">{t.icon}</span>
                          <span className="text-[11px]">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {vehicleError && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{vehicleError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {!isAlreadyVerified && (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleVehicleNext}
                  className="flex-1 bg-[#0B1F3A] hover:bg-[#163359] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Check Spot Vehicle Fit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Fit Check */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Target Parking Spot:</span>
                  <strong className="text-[#0B1F3A]">{spaceTitle}</strong>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Your Vehicle:</span>
                  <span className="font-mono font-extrabold text-[#0B1F3A]">
                    {plate} ({vehicleType.toUpperCase()})
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Spot Max Clearance:</span>
                  <span className="font-bold text-[#0B1F3A] uppercase">
                    {spotMaxVehicle}
                  </span>
                </div>
              </div>

              {fitChecking ? (
                <div className="p-6 text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2FD08A] mx-auto" />
                  <p className="text-xs font-bold text-[#0B1F3A]">
                    Verifying bay dimensions & vehicle clearance...
                  </p>
                </div>
              ) : fitError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Vehicle Exceeds Bay Dimensions!</span>
                  </div>
                  <p>{fitError}</p>
                  <p className="text-[11px] text-rose-600">
                    Please switch to a smaller vehicle (e.g. Hatchback or Sedan) or pick a parking spot with Full SUV clearance.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="mt-1 text-xs font-bold text-rose-700 underline"
                  >
                    Change vehicle selection
                  </button>
                </div>
              ) : fitPassed ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-extrabold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-[#2FD08A]" />
                    <span>Fit Verified! Clearance Approved</span>
                  </div>
                  <p className="text-emerald-700">
                    Your {vehicleType.toUpperCase()} comfortably fits within this {spotMaxVehicle} designated space.
                  </p>
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={fitChecking || !fitPassed}
                  onClick={handleCompleteReservation}
                  className="flex-1 bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Verify Driver & Confirm Reservation (₹{totalPrice})</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Verifying Animation / Success Reserved Screen */}
          {step === 5 && (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              {verifying ? (
                <div className="space-y-3 py-6">
                  <div className="w-14 h-14 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin mx-auto" />
                  <h3 className="text-base font-extrabold text-[#0B1F3A]">
                    Verifying Driver Licence & Vehicle Registration...
                  </h3>
                  <p className="text-xs text-slate-400">
                    Registering verified credentials with ParKit Trust Network
                  </p>
                </div>
              ) : paying ? (
                <div className="space-y-3 py-6">
                  <div className="w-14 h-14 border-4 border-[#FFC93C] border-t-transparent rounded-full animate-spin mx-auto" />
                  <h3 className="text-base font-extrabold text-[#0B1F3A]">
                    Processing Instant UPI Reservation (₹{totalPrice})...
                  </h3>
                  <p className="text-xs text-slate-400">
                    Simulating cashless reservation lock & gate OTP generation
                  </p>
                </div>
              ) : reservedSuccess ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#2FD08A]/20 text-[#2FD08A] flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-0.5 text-xs font-black uppercase tracking-wider mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Driver Verified & Spot Locked
                    </span>
                    <h3 className="text-xl font-black text-[#0B1F3A]">
                      Your spot is reserved!
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Present your gate OTP code or scan your QR pass upon arrival at the parking location.
                    </p>
                  </div>

                  {/* Booking Summary Card */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 text-left space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <p className="font-extrabold text-[#0B1F3A] text-sm">{spaceTitle}</p>
                        <p className="text-slate-500 text-[11px] truncate max-w-[260px]">{spaceAddress}</p>
                      </div>
                      <span className="font-black text-[#0B1F3A] text-sm">₹{totalPrice}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Date & Time</span>
                        <strong className="text-[#0B1F3A]">{selectedDate} at {startTime}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Vehicle</span>
                        <strong className="text-[#0B1F3A]">{plate} ({vehicleType.toUpperCase()})</strong>
                      </div>
                    </div>

                    {/* Gate OTP & QR Pass */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Gate Entry OTP
                        </span>
                        <span className="text-xl font-black font-mono tracking-widest text-[#0B1F3A]">
                          {confirmedOtp}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A] bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                        <QrCode className="w-4 h-4 text-[#2FD08A]" />
                        <span>QR Pass Ready</span>
                      </div>
                    </div>

                    {/* Insurance Policy Summary Card */}
                    {selectedPlan && (
                      <div className="pt-2 border-t border-slate-200 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-[#2FD08A]" />
                            <span className="font-extrabold text-xs text-[#0B1F3A]">
                              {selectedPlan.plan_name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({selectedPlan.provider})
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                            Active Cover
                          </span>
                        </div>

                        {policyNumber && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Policy Number:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {policyNumber}
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowPolicyModal(true)}
                          className="w-full inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-emerald-900 border border-emerald-300 py-1.5 px-3 rounded-lg text-xs font-bold shadow-xs transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Download policy summary</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <PolicySummaryModal
                    isOpen={showPolicyModal}
                    onClose={() => setShowPolicyModal(false)}
                    policyNumber={policyNumber || `PK-2026-${Math.floor(100000 + Math.random() * 900000)}`}
                    plan={selectedPlan || FALLBACK_INSURANCE_PLANS[0]}
                    spaceTitle={spaceTitle}
                    spaceAddress={spaceAddress}
                    driverName="Verified Driver"
                    startTime={new Date().toISOString()}
                    endTime={new Date(Date.now() + durationHours * 3600000).toISOString()}
                    premium={insurancePremium}
                  />

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-[#0B1F3A] hover:bg-[#163359] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md"
                  >
                    View Reservation Details
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-rose-700">
                      Verification Failed
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {submitError || "Check information and try again."}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl text-slate-700"
                    >
                      Change Vehicle
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteReservation}
                      className="px-4 py-2 bg-[#0B1F3A] text-white text-xs font-bold rounded-xl"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
