"use client";

import {
  ShieldCheck,
  Printer,
  X,
  Calendar,
  Check,
  AlertCircle,
  FileText,
  MapPin,
  Car,
} from "lucide-react";
import {
  InsurancePlan,
  DAMAGE_TYPE_LABELS,
  FALLBACK_INSURANCE_PLANS,
} from "@/lib/insurance-data";

interface PolicySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyNumber: string;
  plan?: InsurancePlan | null;
  spaceTitle?: string;
  spaceAddress?: string;
  driverName?: string;
  startTime?: string;
  endTime?: string;
  totalPrice?: number;
  premium?: number;
}

export function PolicySummaryModal({
  isOpen,
  onClose,
  policyNumber,
  plan = FALLBACK_INSURANCE_PLANS[0],
  spaceTitle = "Verified Parking Bay",
  spaceAddress = "Greater Noida, UP",
  driverName = "Verified Driver",
  startTime,
  endTime,
  totalPrice,
  premium,
}: PolicySummaryModalProps) {
  if (!isOpen) return null;

  const currentPlan = plan || FALLBACK_INSURANCE_PLANS[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden print:m-0 print:p-0 print:shadow-none print:max-w-none print:border-none">
        {/* Top Header */}
        <div className="bg-[#0B1F3A] text-white p-6 print:bg-white print:text-black print:border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#2FD08A] text-[#0B1F3A] flex items-center justify-center font-black text-sm">
                PK
              </div>
              <div>
                <h3 className="font-black text-lg">ParKit Certificate of Insurance</h3>
                <p className="text-xs text-slate-300 print:text-slate-600">
                  Short-Stay Parking Protection Policy
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Certificate Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible text-xs text-[#0B1F3A]">
          {/* Key Certificate Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Policy Number
              </span>
              <p className="font-mono font-black text-sm text-[#0B1F3A] mt-0.5">
                {policyNumber}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Coverage Plan
              </span>
              <p className="font-extrabold text-[#0B1F3A] mt-0.5">
                {currentPlan.plan_name}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Coverage Limit
              </span>
              <p className="font-extrabold text-emerald-700 mt-0.5">
                ₹{currentPlan.coverage_limit.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Deductible
              </span>
              <p className="font-bold text-[#0B1F3A] mt-0.5">
                {currentPlan.deductible === 0
                  ? "Zero Deductible"
                  : `₹${currentPlan.deductible.toLocaleString("en-IN")}`}
              </p>
            </div>
          </div>

          {/* Insured Location & Party */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Insured Parking Facility
              </span>
              <p className="font-bold text-sm text-[#0B1F3A]">{spaceTitle}</p>
              <p className="text-slate-500 text-xs flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{spaceAddress}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Underwriting Insurer & Window
              </span>
              <p className="font-bold text-sm text-[#0B1F3A]">{currentPlan.provider}</p>
              <p className="text-slate-500 text-xs">
                Notice Period: Within {currentPlan.claim_window_hours} hours of reservation end.
              </p>
            </div>
          </div>

          {/* Covered Damages and Exclusions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
              <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                Covered Perils & Parts
              </span>
              <ul className="space-y-1.5 text-slate-700">
                {currentPlan.covers.map((c) => (
                  <li key={c} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{DAMAGE_TYPE_LABELS[c] || c.replace("_", " ")}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                Standard Exclusions
              </span>
              <ul className="space-y-1.5 text-slate-600">
                {currentPlan.exclusions.map((exc) => (
                  <li key={exc} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Claim Instructions */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="font-extrabold text-[#0B1F3A] block">
              How to File a Claim
            </span>
            <p className="text-slate-600 leading-relaxed">
              If an incident occurs while parked, open the ParKit app, navigate to <strong>Driver Activity</strong> in your Profile, and click <strong>Report damage</strong> on this booking. Upload incident photographs and repair estimate within {currentPlan.claim_window_hours} hours.
            </p>
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
            ParKit Safe Stay Vehicle Protection Program • Policy valid during reserved parking hours and designated claim window.
          </div>
        </div>
      </div>
    </div>
  );
}
