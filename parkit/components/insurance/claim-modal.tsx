"use client";

import { useState, useMemo, useRef } from "react";
import {
  X,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Upload,
  Calendar,
  Clock,
  Trash2,
  FileText,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import {
  DAMAGE_TYPE_LABELS,
  InsurancePlan,
} from "@/lib/insurance-data";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    space_title?: string;
    start_time: string;
    end_time: string;
    policy_number?: string;
    insurance_plan?: InsurancePlan | null;
  };
  onClaimSubmitted?: () => void;
}

export function ClaimModal({
  isOpen,
  onClose,
  booking,
  onClaimSubmitted,
}: ClaimModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plan = booking.insurance_plan || {
    id: "basic",
    provider: "ParkIt",
    plan_name: "ParkIt Protect Basic",
    plan_type: "platform" as const,
    premium_flat: 0,
    premium_per_hour: 0,
    coverage_limit: 10000,
    deductible: 1000,
    covers: ["mirror", "bumper", "scratch_dent"],
    exclusions: ["pre-existing damage", "wear and tear", "theft"],
    claim_window_hours: 24,
    is_active: true,
    sort_order: 1,
  };

  const defaultIncidentTime = useMemo(() => {
    // Default to end time or current time within booking window
    try {
      const d = new Date(booking.start_time);
      return d.toISOString().slice(0, 16);
    } catch {
      return new Date().toISOString().slice(0, 16);
    }
  }, [booking.start_time]);

  // Form states
  const [damageType, setDamageType] = useState<string>("mirror");
  const [description, setDescription] = useState("");
  const [incidentAt, setIncidentAt] = useState(defaultIncidentTime);
  const [estimatedCost, setEstimatedCost] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  // Submission & Timeline states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedClaim, setSubmittedClaim] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<"submitted" | "under_review" | "approved" | "rejected">("submitted");

  // Live Payout Calculation
  const numericEstimate = parseFloat(estimatedCost) || 0;
  const deductible = plan.deductible || 0;
  const coverageLimit = plan.coverage_limit || 10000;
  const estimatedPayout = Math.min(
    Math.max(numericEstimate - deductible, 0),
    coverageLimit
  );

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const names: string[] = [];
    for (let i = 0; i < files.length; i++) {
      if (evidenceFiles.length + names.length < 5) {
        names.push(files[i].name);
      }
    }

    setEvidenceFiles((prev) => [...prev, ...names].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!description.trim()) {
      setErrorMessage("Please describe what happened in detail.");
      return;
    }

    if (numericEstimate <= 0) {
      setErrorMessage("Please enter an estimated repair cost greater than 0.");
      return;
    }

    if (!confirmationChecked) {
      setErrorMessage(
        "Please confirm the declaration that the incident occurred during the parking reservation."
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/insurance/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          damage_type: damageType,
          description: description.trim(),
          incident_at: incidentAt,
          estimated_amount: numericEstimate,
          evidence_files: evidenceFiles,
          confirmation_checked: confirmationChecked,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to submit claim.");
        setSubmitting(false);
        return;
      }

      setSubmittedClaim(data);
      setCurrentStatus("submitted");
      setSubmitting(false);

      if (onClaimSubmitted) {
        onClaimSubmitted();
      }

      // Automatically simulate status transition to 'under_review' after 5 seconds in UI
      setTimeout(() => {
        setCurrentStatus("under_review");
      }, 5200);
    } catch {
      setErrorMessage("Network error while submitting claim. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-[#0B1F3A] text-white p-5 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2FD08A]" />
              <span>{plan.plan_name}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black">
            {submittedClaim ? "Claim Status & Reference" : "File Damage Claim"}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {booking.space_title ? `Reservation at ${booking.space_title}` : "Vehicle damage resolution"} • Policy {booking.policy_number || "PK-2026-ACTIVE"}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {submittedClaim ? (
            /* Success & Status Timeline View */
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <p className="font-extrabold text-sm text-[#0B1F3A]">
                    Claim Reference: {submittedClaim.claim_number}
                  </p>
                  <p className="mt-1">
                    Your claim has been recorded and attached to policy <strong>{booking.policy_number}</strong>.
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-[#0B1F3A] uppercase tracking-wider">
                  Claim Status Timeline
                </h4>

                <div className="space-y-3 pt-1">
                  {/* Step 1: Submitted */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0B1F3A]">Submitted</p>
                      <p className="text-[11px] text-slate-500">
                        Damage details and incident photos received.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Under Review */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        currentStatus === "under_review" || currentStatus === "approved" || currentStatus === "rejected"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {currentStatus === "under_review" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : currentStatus === "approved" ? (
                        "✓"
                      ) : (
                        "2"
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0B1F3A]">
                        Under Review{" "}
                        {currentStatus === "under_review" && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold ml-1.5 animate-pulse">
                            Active
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Assessors evaluating repair quote against policy limits.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Approved / Resolution */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0B1F3A]">Approved / Resolution</p>
                      <p className="text-[11px] text-slate-500">
                        Resolution notice & direct payout dispatched.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement Summary Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Damage Category:</span>
                  <strong className="text-[#0B1F3A]">
                    {DAMAGE_TYPE_LABELS[damageType] || damageType}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Repair Cost:</span>
                  <span className="font-bold text-[#0B1F3A]">₹{numericEstimate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Policy Deductible:</span>
                  <span className="font-semibold text-slate-700">₹{deductible}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="font-bold text-[#0B1F3A]">Estimated Payout:</span>
                  <span className="font-extrabold text-sm text-emerald-700">
                    ₹{estimatedPayout}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-extrabold py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Done & Return to Profile
              </button>
            </div>
          ) : (
            /* Submission Form View */
            <form onSubmit={handleSubmitClaim} className="space-y-4">
              {/* Coverage Info Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-[#0B1F3A] block">
                    {plan.plan_name}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Limit: ₹{coverageLimit.toLocaleString("en-IN")} • Deductible: ₹{deductible}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                  Window: {plan.claim_window_hours}h
                </span>
              </div>

              {/* Damage Type Selector */}
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Damage Type
                </label>
                <select
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40 cursor-pointer"
                >
                  <option value="mirror">Side Mirror</option>
                  <option value="bumper">Bumper Damage</option>
                  <option value="scratch_dent">Scratches or Dents</option>
                  <option value="windshield">Windshield Glass</option>
                  <option value="lights">Headlights / Taillights</option>
                  <option value="engine_part">Engine Parts / Mechanical Impact</option>
                  <option value="other">Other Incident Damage</option>
                </select>
              </div>

              {/* Incident Date / Time */}
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Incident Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={incidentAt}
                  onChange={(e) => setIncidentAt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                />
              </div>

              {/* What happened textarea */}
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  What Happened (Description)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe how the damage occurred while vehicle was parked in the space..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                />
              </div>

              {/* Estimated Repair Cost */}
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Estimated Repair Cost (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="e.g. 4500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-bold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#2FD08A]/40"
                  />
                </div>
              </div>

              {/* Live Estimated Payout Calculation Card */}
              {numericEstimate > 0 && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Repair:</span>
                    <span>₹{numericEstimate}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Deductible:</span>
                    <span>-₹{deductible}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-900 pt-1 border-t border-emerald-200">
                    <span>Estimated Payout (up to limit ₹{coverageLimit.toLocaleString("en-IN")}):</span>
                    <span className="text-sm font-extrabold text-emerald-700">₹{estimatedPayout}</span>
                  </div>
                </div>
              )}

              {/* Evidence Photos Upload (up to 5, store file names) */}
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-1 uppercase tracking-wider">
                  Evidence Photos ({evidenceFiles.length}/5)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-3 text-center cursor-pointer hover:border-[#2FD08A] bg-slate-50/60 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-[#0B1F3A]">
                    Click to add incident photos
                  </p>
                  <p className="text-[10px] text-slate-400">
                    JPG, PNG images up to 5 photos
                  </p>
                </div>

                {evidenceFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {evidenceFiles.map((fn, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                      >
                        <span className="truncate max-w-[140px]">{fn}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Declaration Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmationChecked}
                  onChange={(e) => setConfirmationChecked(e.target.checked)}
                  className="mt-0.5 rounded text-[#2FD08A] focus:ring-[#2FD08A] w-4 h-4"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  I confirm that this damage incident took place while my vehicle was parked at the booked space during the reserved booking window.
                </span>
              </label>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#0B1F3A] hover:bg-[#163359] text-white text-xs font-extrabold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-[#2FD08A]" />
                  )}
                  <span>Submit Damage Claim</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
