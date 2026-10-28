-- ==============================================================================
-- Migration: Parking Insurance Plans, Booking Policies, and Claims
-- ==============================================================================

-- 1. Create insurance_plans table
CREATE TABLE IF NOT EXISTS public.insurance_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  plan_name text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('platform', 'third_party')),
  premium_flat numeric NOT NULL DEFAULT 0,
  premium_per_hour numeric NOT NULL DEFAULT 0,
  coverage_limit numeric NOT NULL,
  deductible numeric NOT NULL DEFAULT 0,
  covers text[] NOT NULL,
  exclusions text[] NOT NULL,
  claim_window_hours int NOT NULL DEFAULT 48,
  is_active bool NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_insurance_provider_plan UNIQUE (provider, plan_name)
);

-- Enable RLS on insurance_plans
ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;

-- Allow public and authenticated read access for browsing available plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'insurance_plans' AND policyname = 'insurance_plans_select_all'
  ) THEN
    CREATE POLICY "insurance_plans_select_all"
      ON public.insurance_plans
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- 2. Extend bookings with insurance policy attributes
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS insurance_plan_id uuid REFERENCES public.insurance_plans(id),
  ADD COLUMN IF NOT EXISTS insurance_premium numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS policy_number text,
  ADD COLUMN IF NOT EXISTS insurance_status text DEFAULT 'active';

-- 3. Create insurance_claims table
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number text,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.insurance_plans(id),
  claimant_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  damage_type text NOT NULL CHECK (damage_type IN ('mirror', 'bumper', 'scratch_dent', 'windshield', 'lights', 'engine_part', 'other')),
  description text NOT NULL,
  incident_at timestamptz NOT NULL,
  estimated_amount numeric NOT NULL CHECK (estimated_amount > 0),
  evidence_files text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected')),
  approved_amount numeric,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate active claims for same damage type on same booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_claim_per_booking_damage 
  ON public.insurance_claims (booking_id, damage_type)
  WHERE status IN ('submitted', 'under_review', 'approved');

CREATE INDEX IF NOT EXISTS idx_insurance_claims_booking ON public.insurance_claims(booking_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_claimant ON public.insurance_claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON public.insurance_claims(status);

-- Enable RLS on insurance_claims
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Driver insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'insurance_claims' AND policyname = 'claims_driver_insert'
  ) THEN
    CREATE POLICY "claims_driver_insert"
      ON public.insurance_claims
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = claimant_id
        AND EXISTS (
          SELECT 1 FROM public.bookings b
          WHERE b.id = booking_id
            AND b.driver_id = auth.uid()
            AND b.payment_status = 'paid'
            AND b.status IN ('confirmed', 'checked_in', 'completed')
        )
      );
  END IF;

  -- Driver select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'insurance_claims' AND policyname = 'claims_driver_select'
  ) THEN
    CREATE POLICY "claims_driver_select"
      ON public.insurance_claims
      FOR SELECT
      TO authenticated
      USING (
        claimant_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.bookings b
          WHERE b.id = insurance_claims.booking_id
            AND b.driver_id = auth.uid()
        )
      );
  END IF;

  -- Owner select policy (read-only for host of the space)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'insurance_claims' AND policyname = 'claims_owner_select'
  ) THEN
    CREATE POLICY "claims_owner_select"
      ON public.insurance_claims
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.bookings b
          JOIN public.parking_spaces s ON b.space_id = s.id
          WHERE b.id = insurance_claims.booking_id
            AND s.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 4. Seed Insurance Plans (upsert by provider + plan_name)
INSERT INTO public.insurance_plans (
  provider, plan_name, plan_type, premium_flat, premium_per_hour, coverage_limit, deductible, covers, exclusions, claim_window_hours, is_active, sort_order
)
VALUES
  (
    'ParkIt',
    'ParkIt Protect Basic',
    'platform',
    0,
    0,
    10000,
    1000,
    ARRAY['mirror', 'bumper', 'scratch_dent'],
    ARRAY['pre-existing damage', 'wear and tear', 'theft'],
    24,
    true,
    1
  ),
  (
    'ParkIt',
    'ParkIt Protect Plus',
    'platform',
    29,
    0,
    50000,
    500,
    ARRAY['mirror', 'bumper', 'scratch_dent', 'windshield', 'lights', 'engine_part'],
    ARRAY['mechanical failure', 'wear and tear', 'pre-existing damage'],
    48,
    true,
    2
  ),
  (
    'ParkIt',
    'ParkIt Protect Max',
    'platform',
    79,
    0,
    200000,
    0,
    ARRAY['mirror', 'bumper', 'scratch_dent', 'windshield', 'lights', 'engine_part', 'fire', 'flooding', 'stolen_parts'],
    ARRAY['wear and tear', 'pre-existing damage', 'negligence'],
    72,
    true,
    3
  ),
  (
    'HDFC ERGO',
    'Short-Stay Motor Cover',
    'third_party',
    49,
    0,
    100000,
    750,
    ARRAY['mirror', 'bumper', 'scratch_dent', 'windshield'],
    ARRAY['pre-existing damage', 'internal electrical', 'mechanical failure'],
    48,
    true,
    4
  ),
  (
    'ICICI Lombard',
    'Park and Protect',
    'third_party',
    59,
    0,
    150000,
    500,
    ARRAY['mirror', 'bumper', 'scratch_dent', 'windshield', 'lights'],
    ARRAY['wear and tear', 'pre-existing scratches', 'engine failure'],
    48,
    true,
    5
  ),
  (
    'Bajaj Allianz',
    'Vehicle Safe Stay',
    'third_party',
    39,
    0,
    75000,
    1000,
    ARRAY['mirror', 'bumper', 'scratch_dent', 'lights'],
    ARRAY['pre-existing defects', 'windshield cracks', 'theft'],
    48,
    true,
    6
  ),
  (
    'Tata AIG',
    'Motor Parking Shield',
    'third_party',
    69,
    0,
    200000,
    500,
    ARRAY['mirror', 'bumper', 'scratch_dent', 'windshield', 'lights', 'engine_part'],
    ARRAY['pre-existing damage', 'wear and tear', 'intentional damage'],
    72,
    true,
    7
  ),
  (
    'Digit',
    'Instant Parking Cover',
    'third_party',
    35,
    0,
    50000,
    1000,
    ARRAY['mirror', 'bumper', 'scratch_dent'],
    ARRAY['wear and tear', 'mechanical fault', 'pre-existing damage'],
    24,
    true,
    8
  )
ON CONFLICT (provider, plan_name) DO UPDATE SET
  plan_type = EXCLUDED.plan_type,
  premium_flat = EXCLUDED.premium_flat,
  premium_per_hour = EXCLUDED.premium_per_hour,
  coverage_limit = EXCLUDED.coverage_limit,
  deductible = EXCLUDED.deductible,
  covers = EXCLUDED.covers,
  exclusions = EXCLUDED.exclusions,
  claim_window_hours = EXCLUDED.claim_window_hours,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- 5. Backfill existing bookings with default Basic policy if missing
DO $$
DECLARE
  v_basic_id uuid;
BEGIN
  SELECT id INTO v_basic_id FROM public.insurance_plans WHERE plan_name = 'ParkIt Protect Basic' LIMIT 1;
  IF v_basic_id IS NOT NULL THEN
    UPDATE public.bookings
    SET insurance_plan_id = v_basic_id,
        insurance_premium = 0,
        policy_number = COALESCE(policy_number, 'PK-2026-' || upper(substring(md5(id::text) from 1 for 6))),
        insurance_status = 'active'
    WHERE insurance_plan_id IS NULL;
  END IF;
END $$;

-- 6. Update create_booking RPC to support insurance_plan_id
CREATE OR REPLACE FUNCTION public.create_booking(
  p_space_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_driver_id uuid DEFAULT NULL,
  p_insurance_plan_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id uuid;
  v_space record;
  v_plan record;
  v_hourly_rate numeric;
  v_duration_hours numeric;
  v_insurance_premium numeric := 0;
  v_total_price numeric;
  v_day_of_week int;
  v_start_time_only time;
  v_end_time_only time;
  v_is_within_availability boolean := false;
  v_overlapping_booking_id uuid;
  v_new_booking_id uuid;
  v_otp varchar(6);
  v_policy_num text;
  v_target_plan_id uuid;
BEGIN
  -- 1. Determine driver_id
  v_driver_id := COALESCE(p_driver_id, auth.uid());
  IF v_driver_id IS NULL THEN
    SELECT id INTO v_driver_id FROM public.profiles WHERE role = 'driver' LIMIT 1;
    IF v_driver_id IS NULL THEN
      SELECT id INTO v_driver_id FROM public.profiles LIMIT 1;
    END IF;
  END IF;

  -- 2. Validate reservation times
  IF p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'Invalid reservation times: end time must be after start time.' USING ERRCODE = 'P0003';
  END IF;

  -- 3. Lock space row FOR UPDATE
  SELECT * INTO v_space
  FROM public.parking_spaces
  WHERE id = p_space_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parking space not found.' USING ERRCODE = 'P0004';
  END IF;

  IF NOT v_space.is_active THEN
    RAISE EXCEPTION 'This parking space is currently inactive.' USING ERRCODE = 'P0005';
  END IF;

  v_hourly_rate := v_space.price_per_hour;

  -- 4. Validate selected time is within availability
  v_day_of_week := EXTRACT(DOW FROM p_start_time AT TIME ZONE 'Asia/Kolkata');
  v_start_time_only := (p_start_time AT TIME ZONE 'Asia/Kolkata')::time;
  v_end_time_only := (p_end_time AT TIME ZONE 'Asia/Kolkata')::time;

  SELECT EXISTS (
    SELECT 1 FROM public.space_availability
    WHERE space_id = p_space_id
      AND day_of_week = v_day_of_week
      AND start_time <= v_start_time_only
      AND end_time >= v_end_time_only
  ) INTO v_is_within_availability;

  IF EXISTS (SELECT 1 FROM public.space_availability WHERE space_id = p_space_id) AND NOT v_is_within_availability THEN
    RAISE EXCEPTION 'The selected time is outside the space operating hours.' USING ERRCODE = 'P0006';
  END IF;

  -- 5. Check overlapping active bookings
  SELECT id INTO v_overlapping_booking_id
  FROM public.bookings
  WHERE space_id = p_space_id
    AND status IN ('pending_payment', 'confirmed', 'checked_in')
    AND start_time < p_end_time
    AND end_time > p_start_time
  LIMIT 1;

  IF v_overlapping_booking_id IS NOT NULL THEN
    RAISE EXCEPTION 'This slot is no longer available.' USING ERRCODE = 'P0001';
  END IF;

  -- 6. Calculate durations and insurance premium
  v_duration_hours := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600.0;
  v_target_plan_id := p_insurance_plan_id;

  IF v_target_plan_id IS NULL THEN
    SELECT id INTO v_target_plan_id FROM public.insurance_plans WHERE plan_name = 'ParkIt Protect Basic' LIMIT 1;
  END IF;

  IF v_target_plan_id IS NOT NULL THEN
    SELECT * INTO v_plan FROM public.insurance_plans WHERE id = v_target_plan_id;
    IF FOUND THEN
      v_insurance_premium := v_plan.premium_flat + ROUND((v_duration_hours * v_plan.premium_per_hour)::numeric, 2);
    END IF;
  END IF;

  v_total_price := ROUND((v_duration_hours * v_hourly_rate)::numeric + v_insurance_premium, 2);
  v_otp := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
  v_policy_num := 'PK-2026-' || upper(substring(md5(random()::text) from 1 for 6));

  -- 7. Insert booking
  INSERT INTO public.bookings (
    space_id,
    driver_id,
    start_time,
    end_time,
    total_price,
    status,
    payment_status,
    otp_code,
    insurance_plan_id,
    insurance_premium,
    policy_number,
    insurance_status,
    created_at,
    updated_at
  )
  VALUES (
    p_space_id,
    v_driver_id,
    p_start_time,
    p_end_time,
    v_total_price,
    'pending_payment',
    'unpaid',
    v_otp,
    v_target_plan_id,
    v_insurance_premium,
    v_policy_num,
    'active',
    now(),
    now()
  )
  RETURNING id INTO v_new_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_new_booking_id,
    'space_id', p_space_id,
    'driver_id', v_driver_id,
    'start_time', p_start_time,
    'end_time', p_end_time,
    'total_price', v_total_price,
    'insurance_premium', v_insurance_premium,
    'policy_number', v_policy_num,
    'insurance_plan_id', v_target_plan_id,
    'status', 'pending_payment',
    'payment_status', 'unpaid',
    'otp_code', v_otp
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking(uuid, timestamptz, timestamptz, uuid, uuid) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
