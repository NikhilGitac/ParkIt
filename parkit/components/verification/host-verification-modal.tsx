"use client";

import { useState, useRef } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  X,
  Phone,
  KeyRound,
  FileText,
  Camera,
  MapPin,
  Car,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Upload,
  Video,
  Shield,
  Lock,
  UserCheck,
  Trash2,
} from "lucide-react";

export interface HostVerificationSecurityDetails {
  has_cctv: boolean;
  cctv_coverage: "Entrance" | "Full area" | "Entrance + full area" | null;
  has_guard: boolean;
  guard_hours: "24/7" | "Day only" | "Night only" | null;
  has_entry_control: boolean;
  entry_control_type: "Gate" | "Boom barrier" | "Smart lock" | "Other" | null;
  manual_checkin: boolean;
  manual_checkin_by: "Host" | "Guard" | "Either" | null;
  security_score: number;
  ownership_proof_name: string;
}

interface HostVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (data: {
    verified: boolean;
    maxVehicleType: string;
    securityDetails?: HostVerificationSecurityDetails;
  }) => void;
  initialPhone?: string;
  initialName?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  photoCount: number;
  currentMaxVehicleType?: string;
}

export function HostVerificationModal({
  isOpen,
  onClose,
  onVerified,
  initialPhone = "",
  initialName = "",
  pincode = "201310",
  latitude,
  longitude,
  photoCount,
  currentMaxVehicleType = "suv",
}: HostVerificationModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Phone + OTP
  const [phone, setPhone] = useState(initialPhone || "9810012001");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Step 2: Identity
  const [name, setName] = useState(initialName || "Rajesh Sharma");
  const [idType, setIdType] = useState("Aadhaar Card");
  const [idLast4, setIdLast4] = useState("4321");
  const [digiLockerLoading, setDigiLockerLoading] = useState(false);
  const [digiLockerVerified, setDigiLockerVerified] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);

  // Step 3: Ownership & Security
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ownershipFile, setOwnershipFile] = useState<{
    name: string;
    size: number;
  } | null>({
    name: "electricity_bill_latest.pdf",
    size: 1420000,
  });
  const [fileError, setFileError] = useState<string | null>(null);
  const [permissionChecked, setPermissionChecked] = useState(true);
  const [ownershipError, setOwnershipError] = useState<string | null>(null);

  // Security Toggles
  const [hasCctv, setHasCctv] = useState<boolean>(true);
  const [cctvCoverage, setCctvCoverage] = useState<
    "Entrance" | "Full area" | "Entrance + full area"
  >("Entrance + full area");

  const [hasGuard, setHasGuard] = useState<boolean>(false);
  const [guardHours, setGuardHours] = useState<"24/7" | "Day only" | "Night only">(
    "24/7"
  );

  const [hasEntryControl, setHasEntryControl] = useState<boolean>(true);
  const [entryControlType, setEntryControlType] = useState<
    "Gate" | "Boom barrier" | "Smart lock" | "Other"
  >("Gate");

  const [manualCheckin, setManualCheckin] = useState<boolean>(false);
  const [manualCheckinBy, setManualCheckinBy] = useState<
    "Host" | "Guard" | "Either"
  >("Host");

  // Track which security questions have been answered
  const [answeredSecurity, setAnsweredSecurity] = useState<{
    cctv: boolean;
    guard: boolean;
    entryControl: boolean;
    manualCheckin: boolean;
  }>({
    cctv: true,
    guard: true,
    entryControl: true,
    manualCheckin: true,
  });

  // Step 4: Space Check
  const [maxVehicleType, setMaxVehicleType] = useState(
    currentMaxVehicleType || "suv"
  );
  const [consent, setConsent] = useState(true);
  const [spaceCheckError, setSpaceCheckError] = useState<string | null>(null);

  // Step 5: Verification submission & animation
  const [verifying, setVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Security Score: 0 to 4 enabled features
  const securityScore = [
    hasCctv,
    hasGuard,
    hasEntryControl,
    manualCheckin,
  ].filter(Boolean).length;

  const getSecurityScoreBadge = (score: number) => {
    switch (score) {
      case 4:
        return {
          label: "Premium",
          color: "bg-emerald-100 text-emerald-800 border-emerald-300",
          barColor: "bg-emerald-500",
        };
      case 3:
        return {
          label: "Strong",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          barColor: "bg-emerald-500",
        };
      case 2:
        return {
          label: "Good",
          color: "bg-blue-50 text-blue-700 border-blue-200",
          barColor: "bg-blue-500",
        };
      case 1:
      case 0:
      default:
        return {
          label: "Basic",
          color: "bg-slate-100 text-slate-700 border-slate-300",
          barColor: "bg-slate-400",
        };
    }
  };

  const scoreInfo = getSecurityScoreBadge(securityScore);

  if (!isOpen) return null;

  // File Validation Helper
  const handleFileSelection = (file: File) => {
    setFileError(null);
    setOwnershipError(null);

    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) =>
      fileNameLower.endsWith(ext)
    );
    const hasValidType = file.type ? allowedTypes.includes(file.type) : true;

    if (!hasValidExt || !hasValidType) {
      setFileError(
        "Invalid file format. Only PDF, JPG, or PNG files are accepted."
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setFileError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(
          1
        )} MB). Maximum allowed size is 5 MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setOwnershipFile({
      name: file.name,
      size: file.size,
    });
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOwnershipFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
      setOtpCode("123456"); // Auto-populate hint for demo convenience
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
      setOtpVerified(true);
      setStep(2);
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // 2. Mock DigiLocker
  const handleDigiLocker = () => {
    setDigiLockerLoading(true);
    setTimeout(() => {
      setIdType("Aadhaar Card");
      setIdLast4("8821");
      setDigiLockerVerified(true);
      setDigiLockerLoading(false);
    }, 900);
  };

  // 2. Identity Next
  const handleIdentityNext = () => {
    setIdentityError(null);
    if (!name.trim()) {
      setIdentityError("Please enter your full legal name.");
      return;
    }
    if (!/^[0-9]{4}$/.test(idLast4.trim())) {
      setIdentityError("Please enter exactly the last 4 digits of your ID.");
      return;
    }
    setStep(3);
  };

  // 3. Ownership & Security Next
  const isOwnershipProofValid = Boolean(ownershipFile || permissionChecked);
  const isAtLeastOneSecurityAnswered = Object.values(answeredSecurity).some(Boolean);
  const canContinueStep3 = isOwnershipProofValid && isAtLeastOneSecurityAnswered;

  const handleOwnershipNext = () => {
    setOwnershipError(null);
    if (!isOwnershipProofValid) {
      setOwnershipError(
        "Please provide an ownership document or check the permission confirmation box."
      );
      return;
    }
    if (!isAtLeastOneSecurityAnswered) {
      setOwnershipError("Please answer at least one security question below.");
      return;
    }
    setStep(4);
  };

  // 4. Submit Verification
  const handleFinalVerification = async () => {
    setSpaceCheckError(null);
    if (!consent) {
      setSpaceCheckError("You must give consent to complete verification.");
      return;
    }

    setStep(5);
    setVerifying(true);
    setSubmitError(null);

    const proofName = ownershipFile
      ? ownershipFile.name
      : permissionChecked
      ? "Permission Confirmed (Self Declaration)"
      : "Verified Ownership";

    try {
      const payload = {
        name: name.trim(),
        idType,
        idLast4: idLast4.trim(),
        ownershipProofName: proofName,
        permissionChecked,
        consent: true,
        photoCount: Math.max(photoCount, 1),
        pincode,
        lat: latitude,
        lng: longitude,
        maxVehicleType,
        // Security & Access fields
        hasCctv,
        cctvCoverage: hasCctv ? cctvCoverage : null,
        hasGuard,
        guardHours: hasGuard ? guardHours : null,
        hasEntryControl,
        entryControlType: hasEntryControl ? entryControlType : null,
        manualCheckin,
        manualCheckinBy: manualCheckin ? manualCheckinBy : null,
        securityScore,
      };

      const res = await fetch("/api/verify/host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Host verification failed.");
        setVerifying(false);
        return;
      }

      setVerifying(false);
      setVerifiedSuccess(true);

      const securityDetails: HostVerificationSecurityDetails = {
        has_cctv: hasCctv,
        cctv_coverage: hasCctv ? cctvCoverage : null,
        has_guard: hasGuard,
        guard_hours: hasGuard ? guardHours : null,
        has_entry_control: hasEntryControl,
        entry_control_type: hasEntryControl ? entryControlType : null,
        manual_checkin: manualCheckin,
        manual_checkin_by: manualCheckin ? manualCheckinBy : null,
        security_score: securityScore,
        ownership_proof_name: proofName,
      };

      onVerified({ verified: true, maxVehicleType, securityDetails });
    } catch {
      setSubmitError("Network error while connecting to verification server.");
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-[#0B1F3A] text-white p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2FD08A]/20 px-3 py-1 text-xs font-bold text-[#2FD08A]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Host Verification • Demo Mode</span>
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
            Verify Your Host Profile
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Build trust with vetted drivers. Demo mode: mock KYC, no real identity stored.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/10 text-xs">
            {[
              { num: 1, label: "Phone" },
              { num: 2, label: "Identity" },
              { num: 3, label: "Ownership & Security" },
              { num: 4, label: "Space" },
              { num: 5, label: "Verify" },
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
                <span className="text-[10px] text-slate-300 font-semibold hidden sm:inline text-center">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* STEP 1: Phone + OTP */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
                <Phone className="w-4 h-4 text-[#2FD08A] shrink-0" />
                <span>
                  <strong>Demo mode:</strong> Use any 10-digit Indian number. Code hint is <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">123456</code>.
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
                    placeholder="9810012001"
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

          {/* STEP 2: Identity */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                <div>
                  <p className="font-bold text-[#0B1F3A]">Quick Demo Autofill</p>
                  <p className="text-slate-500 text-[11px]">Simulate Instant KYC</p>
                </div>
                <button
                  type="button"
                  onClick={handleDigiLocker}
                  disabled={digiLockerLoading}
                  className="bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                >
                  {digiLockerLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#FFC93C]" />
                  )}
                  <span>Verify with DigiLocker</span>
                </button>
              </div>

              {digiLockerVerified && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#2FD08A]" />
                  <span>DigiLocker credentials simulated! (Aadhaar ending in 8821)</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                    ID Document Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                    Last 4 Digits Only
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={idLast4}
                    onChange={(e) => setIdLast4(e.target.value.replace(/\D/g, ""))}
                    placeholder="4321"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                🔒 Privacy guarantee: ParKit only preserves the last 4 digits for identity masking.
              </p>

              {identityError && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{identityError}</span>
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
                  onClick={handleIdentityNext}
                  className="flex-1 bg-[#0B1F3A] hover:bg-[#163359] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Ownership & Security</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Ownership & Security */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* SECTION 1: Ownership Proof */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A]">
                  <FileText className="w-4 h-4 text-[#2FD08A]" />
                  <span>Proof of Ownership or Rental Authorization</span>
                </div>
                <p className="text-xs text-slate-500">
                  Upload an electricity bill, property registry, or lease agreement (PDF, JPG, PNG up to 5 MB). Upload is <strong>optional</strong> if the authorization declaration below is ticked.
                </p>

                {/* Clickable & Keyboard-accessible Drop Area */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) handleFileSelection(dropped);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#2FD08A] ${
                    isDragging
                      ? "border-[#2FD08A] bg-emerald-50/50 scale-[0.99]"
                      : "border-slate-300 bg-slate-50/60 hover:border-[#2FD08A] hover:bg-white"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelection(f);
                    }}
                  />

                  {ownershipFile ? (
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0 text-left">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2FD08A] flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0B1F3A] truncate">
                            {ownershipFile.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {formatFileSize(ownershipFile.size)} • Valid format
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors ml-2 shrink-0"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-[#0B1F3A]">
                        Click or drag document here to upload
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Accepts PDF, JPG, or PNG (Max 5 MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Inline File Format/Size Error */}
                {fileError && (
                  <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}

                {/* Permission Checkbox Option */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={permissionChecked}
                    onChange={(e) => {
                      setPermissionChecked(e.target.checked);
                      if (e.target.checked) setOwnershipError(null);
                    }}
                    className="mt-0.5 rounded text-[#2FD08A] focus:ring-[#2FD08A] w-4 h-4"
                  />
                  <span className="text-xs text-slate-700 leading-snug">
                    <strong>Permission Declaration:</strong> I have legal authorization, landlord approval, or outright property title for this parking bay.
                  </span>
                </label>
              </div>

              {/* SECTION 2: Security & Access (4 Toggle Cards) */}
              <div className="pt-2 border-t border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A]">
                    <Shield className="w-4 h-4 text-[#2FD08A]" />
                    <span>Security & Access Features</span>
                  </div>

                  {/* Security Score Meter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400">
                      Score:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${scoreInfo.color}`}
                    >
                      <span>{scoreInfo.label}</span>
                      <span>({securityScore}/4)</span>
                    </span>
                  </div>
                </div>

                {/* Live Progress Bar Meter */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex gap-1 p-0.5">
                  {[1, 2, 3, 4].map((barIdx) => (
                    <div
                      key={barIdx}
                      className={`flex-1 h-full rounded-full transition-all duration-300 ${
                        securityScore >= barIdx
                          ? scoreInfo.barColor
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>

                {/* Toggle Card 1: CCTV Camera */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-[#2FD08A] shrink-0">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0B1F3A]">
                          Security Camera (CCTV)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Active CCTV surveillance monitoring parking area
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setHasCctv(true);
                          setAnsweredSecurity((prev) => ({ ...prev, cctv: true }));
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          hasCctv
                            ? "bg-[#2FD08A] text-[#0B1F3A] shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasCctv(false);
                          setAnsweredSecurity((prev) => ({ ...prev, cctv: true }));
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          !hasCctv
                            ? "bg-[#0B1F3A] text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {hasCctv && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <label className="font-bold text-slate-700">
                        Coverage Area:
                      </label>
                      <select
                        value={cctvCoverage}
                        onChange={(e) =>
                          setCctvCoverage(
                            e.target.value as
                              | "Entrance"
                              | "Full area"
                              | "Entrance + full area"
                          )
                        }
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                      >
                        <option value="Entrance">Entrance</option>
                        <option value="Full area">Full area</option>
                        <option value="Entrance + full area">
                          Entrance + full area
                        </option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Toggle Card 2: Security Guard */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-[#2FD08A] shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0B1F3A]">
                          Security Guard
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Dedicated security personnel on duty at premises
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setHasGuard(true);
                          setAnsweredSecurity((prev) => ({ ...prev, guard: true }));
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          hasGuard
                            ? "bg-[#2FD08A] text-[#0B1F3A] shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasGuard(false);
                          setAnsweredSecurity((prev) => ({ ...prev, guard: true }));
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          !hasGuard
                            ? "bg-[#0B1F3A] text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {hasGuard && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <label className="font-bold text-slate-700">
                        Guard Hours:
                      </label>
                      <select
                        value={guardHours}
                        onChange={(e) =>
                          setGuardHours(
                            e.target.value as "24/7" | "Day only" | "Night only"
                          )
                        }
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                      >
                        <option value="24/7">24/7</option>
                        <option value="Day only">Day only</option>
                        <option value="Night only">Night only</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Toggle Card 3: Entry Control */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-[#2FD08A] shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0B1F3A]">
                          Valid Entry Control
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Gate, boom barrier, lock, or ID/OTP check at entry
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setHasEntryControl(true);
                          setAnsweredSecurity((prev) => ({
                            ...prev,
                            entryControl: true,
                          }));
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          hasEntryControl
                            ? "bg-[#2FD08A] text-[#0B1F3A] shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasEntryControl(false);
                          setAnsweredSecurity((prev) => ({
                            ...prev,
                            entryControl: true,
                          }));
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          !hasEntryControl
                            ? "bg-[#0B1F3A] text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {hasEntryControl && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <label className="font-bold text-slate-700">
                        Control Type:
                      </label>
                      <select
                        value={entryControlType}
                        onChange={(e) =>
                          setEntryControlType(
                            e.target.value as
                              | "Gate"
                              | "Boom barrier"
                              | "Smart lock"
                              | "Other"
                          )
                        }
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                      >
                        <option value="Gate">Gate</option>
                        <option value="Boom barrier">Boom barrier</option>
                        <option value="Smart lock">Smart lock</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Toggle Card 4: Manual Check-in */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-[#2FD08A] shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0B1F3A]">
                          Manual Check-in
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Host or guard verifies the driver and plate in person at arrival, in addition to OTP
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setManualCheckin(true);
                          setAnsweredSecurity((prev) => ({
                            ...prev,
                            manualCheckin: true,
                          }));
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          manualCheckin
                            ? "bg-[#2FD08A] text-[#0B1F3A] shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManualCheckin(false);
                          setAnsweredSecurity((prev) => ({
                            ...prev,
                            manualCheckin: true,
                          }));
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          !manualCheckin
                            ? "bg-[#0B1F3A] text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {manualCheckin && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <label className="font-bold text-slate-700">
                        Check-in Verified By:
                      </label>
                      <select
                        value={manualCheckinBy}
                        onChange={(e) =>
                          setManualCheckinBy(
                            e.target.value as "Host" | "Guard" | "Either"
                          )
                        }
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                      >
                        <option value="Host">Host</option>
                        <option value="Guard">Guard</option>
                        <option value="Either">Either</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {ownershipError && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ownershipError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleOwnershipNext}
                  disabled={!canContinueStep3}
                  className="flex-1 bg-[#0B1F3A] hover:bg-[#163359] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Continue to Space Check</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Space Check */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Space Photo & Location Confirmation */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0B1F3A] flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#2FD08A]" /> Photo Verification
                  </span>
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2FD08A]" />
                    {Math.max(photoCount, 1)} Photo ready
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="font-bold text-[#0B1F3A] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#2FD08A]" /> Delhi NCR Geofence
                  </span>
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2FD08A]" />
                    Inside NCR ({latitude.toFixed(2)}, {longitude.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Max Vehicle Type Specification */}
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Maximum Vehicle Size Allowed
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "bike", label: "Bike", icon: "🏍️" },
                    { id: "hatchback", label: "Hatchback", icon: "🚗" },
                    { id: "sedan", label: "Sedan", icon: "🚙" },
                    { id: "suv", label: "Full SUV", icon: "🚐" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setMaxVehicleType(v.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        maxVehicleType === v.id
                          ? "bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-sm font-bold"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 text-xs font-semibold"
                      }`}
                    >
                      <span className="text-base block mb-0.5">{v.icon}</span>
                      <span className="text-[11px]">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded text-[#2FD08A] focus:ring-[#2FD08A]"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  I agree to ParKit host terms, guarantee safe vehicle clearances, and confirm the details submitted are accurate.
                </span>
              </label>

              {spaceCheckError && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{spaceCheckError}</span>
                </div>
              )}

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
                  onClick={handleFinalVerification}
                  className="flex-1 bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Submit & Verify Host Badge</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Verifying Spinner / Success Screen */}
          {step === 5 && (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              {verifying ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin mx-auto" />
                  <div>
                    <h3 className="text-base font-extrabold text-[#0B1F3A]">
                      Verifying Host Identity & Bay Clearance...
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Running mock KYC, DigiLocker hash check, and geofence verification
                    </p>
                  </div>
                </div>
              ) : verifiedSuccess ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#2FD08A]/20 text-[#2FD08A] flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 text-xs font-black uppercase tracking-wider mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Verified Host Badge Active
                    </span>
                    <h3 className="text-xl font-black text-[#0B1F3A]">
                      Your space is now verified!
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Congratulations! Your listing has been verified with security score <strong>{securityScore}/4 ({scoreInfo.label})</strong>. Drivers will see your trust badges on search and map listings.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-left space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Host Name:</span>
                      <strong className="text-[#0B1F3A]">{name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Document:</span>
                      <span className="font-semibold text-[#0B1F3A]">{idType} (ending in {idLast4})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Security Score:</span>
                      <span className="font-bold text-emerald-700">{scoreInfo.label} ({securityScore}/4)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Vehicle Clearance:</span>
                      <span className="font-bold uppercase text-[#26b878]">{maxVehicleType}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-[#0B1F3A] hover:bg-[#163359] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md"
                  >
                    Done & Return to Listing
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-rose-700">
                      Verification Not Approved
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {submitError || "Check information and try again."}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl text-slate-700"
                    >
                      Edit Security Details
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalVerification}
                      className="px-4 py-2 bg-[#0B1F3A] text-white text-xs font-bold rounded-xl"
                    >
                      Retry Verification
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
