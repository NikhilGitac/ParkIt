-- Migration: Add Ownership & Security features and Manual Check-in Flow
-- Idempotent extension to parking_spaces and bookings tables

-- 1. Extend parking_spaces with security attributes
ALTER TABLE public.parking_spaces 
  ADD COLUMN IF NOT EXISTS has_cctv boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cctv_coverage text,
  ADD COLUMN IF NOT EXISTS has_guard boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS guard_hours text,
  ADD COLUMN IF NOT EXISTS has_entry_control boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS entry_control_type text,
  ADD COLUMN IF NOT EXISTS manual_checkin boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_checkin_by text,
  ADD COLUMN IF NOT EXISTS security_score int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ownership_proof_name text;

-- Add check constraints if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_cctv_coverage'
  ) THEN
    ALTER TABLE public.parking_spaces
      ADD CONSTRAINT check_cctv_coverage 
      CHECK (cctv_coverage IS NULL OR cctv_coverage IN ('Entrance', 'Full area', 'Entrance + full area'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_guard_hours'
  ) THEN
    ALTER TABLE public.parking_spaces
      ADD CONSTRAINT check_guard_hours 
      CHECK (guard_hours IS NULL OR guard_hours IN ('24/7', 'Day only', 'Night only'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_entry_control_type'
  ) THEN
    ALTER TABLE public.parking_spaces
      ADD CONSTRAINT check_entry_control_type 
      CHECK (entry_control_type IS NULL OR entry_control_type IN ('Gate', 'Boom barrier', 'Smart lock', 'Other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_manual_checkin_by'
  ) THEN
    ALTER TABLE public.parking_spaces
      ADD CONSTRAINT check_manual_checkin_by 
      CHECK (manual_checkin_by IS NULL OR manual_checkin_by IN ('Host', 'Guard', 'Either'));
  END IF;
END $$;

-- 2. Extend bookings with manual check-in status and timestamps
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS checkin_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS checkin_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_booking_checkin_status'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT check_booking_checkin_status 
      CHECK (checkin_status IN ('pending', 'otp_verified', 'arrived_verified'));
  END IF;
END $$;

-- Set existing checked-in bookings to arrived_verified
UPDATE public.bookings 
SET checkin_status = 'arrived_verified',
    checkin_at = COALESCE(checkin_at, updated_at, now())
WHERE status = 'checked_in' AND (checkin_status IS NULL OR checkin_status = 'pending');

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
