"use client";

import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Check,
  X as CloseIcon,
  Info,
} from "lucide-react";
import {
  InsurancePlan,
  DAMAGE_TYPE_LABELS,
  getProviderLogoInitial,
} from "@/lib/insurance-data";

interface ProtectCarSectionProps {
  plans: InsurancePlan[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  durationHours: number;
}

export function ProtectCarSection({
  plans,
  selectedPlanId,
  onSelectPlan,
  durationHours,
}: ProtectCarSectionProps) {
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const parkitPlans = plans.filter((p) => p.plan_type === "platform");
  const partnerPlans = plans.filter((p) => p.plan_type === "third_party");

  const toggleExpand = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPlanId((prev) => (prev === planId ? null : planId));
  };

  const renderPlanCard = (plan: InsurancePlan) => {
    const isSelected = plan.id === selectedPlanId;
    const isExpanded = expandedPlanId === plan.id;
    const initial = getProviderLogoInitial(plan.provider);

    const priceText =
      plan.premium_flat === 0
        ? "Included"
        : `+₹${plan.premium_flat + durationHours * plan.premium_per_hour}`;

    const keyCovers = plan.covers.slice(0, 3);

    return (
      <div
        key={plan.id}
        onClick={() => onSelectPlan(plan.id)}
        className={`rounded-2xl border transition-all cursor-pointer p-4 relative ${
          isSelected
            ? "border-[#2FD08A] bg-emerald-50/40 shadow-sm ring-1 ring-[#2FD08A]/40"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Provider Logo Initial */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                plan.plan_type === "platform"
                  ? "bg-[#0B1F3A] text-[#2FD08A]"
                  : "bg-slate-100 text-slate-800 border border-slate-200"
              }`}
            >
              {initial}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-xs sm:text-sm text-[#0B1F3A]">
                  {plan.plan_name}
                </h4>
                {plan.plan_type === "platform" && plan.premium_flat === 0 && (
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Up to ₹{plan.coverage_limit.toLocaleString("en-IN")} •{" "}
                {plan.deductible === 0
                  ? "Zero deductible"
                  : `₹${plan.deductible.toLocaleString("en-IN")} deductible`}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span
              className={`text-xs sm:text-sm font-extrabold block ${
                plan.premium_flat === 0 ? "text-emerald-700" : "text-[#0B1F3A]"
              }`}
            >
              {priceText}
            </span>
            <div className="mt-1 flex justify-end">
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected
                    ? "border-[#2FD08A] bg-[#2FD08A]"
                    : "border-slate-300 bg-white"
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5 text-[#0B1F3A] stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Key Coverage Chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {keyCovers.map((coverKey) => (
            <span
              key={coverKey}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80"
            >
              {DAMAGE_TYPE_LABELS[coverKey] || coverKey.replace("_", " ")}
            </span>
          ))}
          {plan.covers.length > 3 && (
            <span className="text-[10px] text-slate-400 font-semibold self-center">
              +{plan.covers.length - 3} more
            </span>
          )}
        </div>

        {/* Expandable What's covered / not covered toggle */}
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={(e) => toggleExpand(plan.id, e)}
            className="text-[11px] font-bold text-slate-600 hover:text-[#0B1F3A] flex items-center gap-1 transition-colors"
          >
            <span>{isExpanded ? "Hide coverage details" : "What's covered / not covered"}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs animate-in fade-in duration-150">
              <div>
                <span className="font-extrabold text-emerald-800 flex items-center gap-1 text-[11px] mb-1">
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  Covered Damages:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700">
                  {plan.covers.map((c) => (
                    <li key={c} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span>{DAMAGE_TYPE_LABELS[c] || c.replace("_", " ")}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-extrabold text-rose-800 flex items-center gap-1 text-[11px] mb-1">
                  <CloseIcon className="w-3 h-3 text-rose-600 stroke-[3]" />
                  Exclusions:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600">
                  {plan.exclusions.map((exc) => (
                    <li key={exc} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-rose-400" />
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                Notice window: Report within {plan.claim_window_hours} hours of booking end.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-extrabold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#2FD08A]" />
            <span>Protect your car</span>
          </label>
        </div>
        <p className="text-xs text-slate-500">
          Covers damage to your vehicle while parked at this space.
        </p>
      </div>

      {/* Group 1: ParkIt plans */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2FD08A]" />
          <span>ParkIt plans</span>
        </div>
        <div className="space-y-2">{parkitPlans.map(renderPlanCard)}</div>
      </div>

      {/* Group 2: Partner insurers */}
      {partnerPlans.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Partner insurers</span>
          </div>
          <div className="space-y-2">{partnerPlans.map(renderPlanCard)}</div>
        </div>
      )}
    </div>
  );
}
