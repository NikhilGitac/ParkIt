-- ==============================================================================
-- Migration: Add Demo-Only Verification Flow (profiles, vehicles, parking_spaces)
-- 1. Adds host_status, driver_status, phone, id_type, id_last4 to profiles
-- 2. Creates vehicles table with RLS (owner_id = auth.uid()) and unique(owner_id, plate)
-- 3. Adds max_vehicle_type and verified_host to parking_spaces
-- 4. Reloads PostgREST schema cache
-- ==============================================================================

-- 1. PROFILES TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'driver',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS host_status text DEFAULT 'unverified' CHECK (host_status IN ('unverified', 'pending', 'verified'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_status text DEFAULT 'unverified' CHECK (driver_status IN ('unverified', 'pending', 'verified'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_last4 varchar(4);

-- Safe backfill for existing profiles if null
UPDATE public.profiles
SET 
  host_status = COALESCE(host_status, 'unverified'),
  driver_status = COALESCE(driver_status, 'unverified')
WHERE host_status IS NULL OR driver_status IS NULL;

-- 2. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plate text NOT NULL,
  type text NOT NULL CHECK (type IN ('bike', 'hatchback', 'sedan', 'suv')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_owner_plate UNIQUE (owner_id, plate)
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read only their own vehicles" ON public.vehicles;
CREATE POLICY "Users can read only their own vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own vehicles" ON public.vehicles;
CREATE POLICY "Users can insert their own vehicles"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own vehicles" ON public.vehicles;
CREATE POLICY "Users can update their own vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own vehicles" ON public.vehicles;
CREATE POLICY "Users can delete their own vehicles"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- 3. PARKING SPACES EXTENSIONS
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS max_vehicle_type text DEFAULT 'suv' CHECK (max_vehicle_type IN ('bike', 'hatchback', 'sedan', 'suv'));
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS verified_host boolean DEFAULT false;

-- Safe backfill for existing spaces
UPDATE public.parking_spaces
SET 
  max_vehicle_type = COALESCE(max_vehicle_type, 'suv'),
  verified_host = COALESCE(verified_host, false)
WHERE max_vehicle_type IS NULL OR verified_host IS NULL;

-- 4. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
