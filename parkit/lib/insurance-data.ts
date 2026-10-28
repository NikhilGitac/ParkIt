export interface InsurancePlan {
  id: string;
  provider: string;
  plan_name: string;
  plan_type: "platform" | "third_party";
  premium_flat: number;
  premium_per_hour: number;
  coverage_limit: number;
  deductible: number;
  covers: string[];
  exclusions: string[];
  claim_window_hours: number;
  is_active: boolean;
  sort_order: number;
}

export interface InsuranceClaim {
  id: string;
  claim_number?: string;
  booking_id: string;
  plan_id: string;
  claimant_id: string;
  damage_type: "mirror" | "bumper" | "scratch_dent" | "windshield" | "lights" | "engine_part" | "other";
  description: string;
  incident_at: string;
  estimated_amount: number;
  evidence_files: string[];
  status: "submitted" | "under_review" | "approved" | "rejected";
  approved_amount?: number | null;
  resolution_note?: string | null;
  created_at: string;
  updated_at: string;
  insurance_plans?: InsurancePlan;
}

export const FALLBACK_INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: "p0000000-0000-0000-0000-000000000001",
    provider: "ParkIt",
    plan_name: "ParkIt Protect Basic",
    plan_type: "platform",
    premium_flat: 0,
    premium_per_hour: 0,
    coverage_limit: 10000,
    deductible: 1000,
    covers: ["mirror", "bumper", "scratch_dent"],
    exclusions: ["pre-existing damage", "wear and tear", "theft"],
    claim_window_hours: 24,
    is_active: true,
    sort_order: 1,
  },
  {
    id: "p0000000-0000-0000-0000-000000000002",
    provider: "ParkIt",
    plan_name: "ParkIt Protect Plus",
    plan_type: "platform",
    premium_flat: 29,
    premium_per_hour: 0,
    coverage_limit: 50000,
    deductible: 500,
    covers: ["mirror", "bumper", "scratch_dent", "windshield", "lights", "engine_part"],
    exclusions: ["mechanical failure", "wear and tear", "pre-existing damage"],
    claim_window_hours: 48,
    is_active: true,
    sort_order: 2,
  },
  {
    id: "p0000000-0000-0000-0000-000000000003",
    provider: "ParkIt",
    plan_name: "ParkIt Protect Max",
    plan_type: "platform",
    premium_flat: 79,
    premium_per_hour: 0,
    coverage_limit: 200000,
    deductible: 0,
    covers: ["mirror", "bumper", "scratch_dent", "windshield", "lights", "engine_part", "fire", "flooding", "stolen_parts"],
    exclusions: ["wear and tear", "pre-existing damage", "negligence"],
    claim_window_hours: 72,
    is_active: true,
    sort_order: 3,
  },
  {
    id: "p0000000-0000-0000-0000-000000000004",
    provider: "HDFC ERGO",
    plan_name: "Short-Stay Motor Cover",
    plan_type: "third_party",
    premium_flat: 49,
    premium_per_hour: 0,
    coverage_limit: 100000,
    deductible: 750,
    covers: ["mirror", "bumper", "scratch_dent", "windshield"],
    exclusions: ["pre-existing damage", "internal electrical", "mechanical failure"],
    claim_window_hours: 48,
    is_active: true,
    sort_order: 4,
  },
  {
    id: "p0000000-0000-0000-0000-000000000005",
    provider: "ICICI Lombard",
    plan_name: "Park and Protect",
    plan_type: "third_party",
    premium_flat: 59,
    premium_per_hour: 0,
    coverage_limit: 150000,
    deductible: 500,
    covers: ["mirror", "bumper", "scratch_dent", "windshield", "lights"],
    exclusions: ["wear and tear", "pre-existing scratches", "engine failure"],
    claim_window_hours: 48,
    is_active: true,
    sort_order: 5,
  },
  {
    id: "p0000000-0000-0000-0000-000000000006",
    provider: "Bajaj Allianz",
    plan_name: "Vehicle Safe Stay",
    plan_type: "third_party",
    premium_flat: 39,
    premium_per_hour: 0,
    coverage_limit: 75000,
    deductible: 1000,
    covers: ["mirror", "bumper", "scratch_dent", "lights"],
    exclusions: ["pre-existing defects", "windshield cracks", "theft"],
    claim_window_hours: 48,
    is_active: true,
    sort_order: 6,
  },
  {
    id: "p0000000-0000-0000-0000-000000000007",
    provider: "Tata AIG",
    plan_name: "Motor Parking Shield",
    plan_type: "third_party",
    premium_flat: 69,
    premium_per_hour: 0,
    coverage_limit: 200000,
    deductible: 500,
    covers: ["mirror", "bumper", "scratch_dent", "windshield", "lights", "engine_part"],
    exclusions: ["pre-existing damage", "wear and tear", "intentional damage"],
    claim_window_hours: 72,
    is_active: true,
    sort_order: 7,
  },
  {
    id: "p0000000-0000-0000-0000-000000000008",
    provider: "Digit",
    plan_name: "Instant Parking Cover",
    plan_type: "third_party",
    premium_flat: 35,
    premium_per_hour: 0,
    coverage_limit: 50000,
    deductible: 1000,
    covers: ["mirror", "bumper", "scratch_dent"],
    exclusions: ["wear and tear", "mechanical fault", "pre-existing damage"],
    claim_window_hours: 24,
    is_active: true,
    sort_order: 8,
  },
];

export const DAMAGE_TYPE_LABELS: Record<string, string> = {
  mirror: "Side Mirror",
  bumper: "Bumper Damage",
  scratch_dent: "Scratches or Dents",
  windshield: "Windshield Glass",
  lights: "Headlights / Taillights",
  engine_part: "Engine Parts / Underbody",
  other: "Other Incident Damage",
};

export function getProviderLogoInitial(provider: string): string {
  switch (provider.toLowerCase()) {
    case "parkit":
      return "PK";
    case "hdfc ergo":
      return "HE";
    case "icici lombard":
      return "IL";
    case "bajaj allianz":
      return "BA";
    case "tata aig":
      return "TA";
    case "digit":
      return "DG";
    default:
      return provider.slice(0, 2).toUpperCase();
  }
}

export function generatePolicyNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "";
  for (let i = 0; i < 6; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PK-2026-${randomCode}`;
}

export function generateClaimNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "";
  for (let i = 0; i < 6; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CLM-2026-${randomCode}`;
}

export function getMinPlatformCoverageLimit(
  plans: InsurancePlan[] = FALLBACK_INSURANCE_PLANS
): number {
  const platformPlans = plans.filter(
    (p) => p.plan_type === "platform" && p.is_active
  );
  if (platformPlans.length === 0) return 10000;
  return Math.min(...platformPlans.map((p) => p.coverage_limit));
}

