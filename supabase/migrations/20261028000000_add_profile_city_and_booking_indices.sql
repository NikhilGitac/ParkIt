-- ==============================================================================
-- Migration: Add Profile City & Performance Indices for Bookings/Spaces
-- 1. Adds city column to profiles table if missing
-- 2. Adds index on bookings(driver_id) and bookings(space_id)
-- 3. Adds index on parking_spaces(owner_id) and vehicles(owner_id)
-- 4. Reloads PostgREST schema cache
-- ==============================================================================

-- 1. PROFILES EXTENSION
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text DEFAULT 'Greater Noida';

UPDATE public.profiles
SET city = 'Greater Noida'
WHERE city IS NULL;

-- 2. BOOKINGS INDICES
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON public.bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_space_id ON public.bookings(space_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 3. PARKING SPACES & VEHICLES INDICES
CREATE INDEX IF NOT EXISTS idx_parking_spaces_owner_id ON public.parking_spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles(owner_id);

-- 4. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
