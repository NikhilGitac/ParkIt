-- ==============================================================================
-- Migration: Auth & Specific Row Level Security (RLS) Policies
-- Enforces:
-- 1. Users can read and update only their own profile.
-- 2. Authenticated users can read parking spaces.
-- 3. Owners can insert, update, and delete only their own parking spaces.
-- 4. Drivers can create bookings only for themselves.
-- 5. Owners can read bookings for their own spaces.
-- ==============================================================================

-- 1. PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can read only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Users can read only their own profile
CREATE POLICY "Users can read only their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users can update only their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (used during onboarding/signup)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. PARKING SPACES RLS
ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active spaces are viewable by everyone" ON public.parking_spaces;
DROP POLICY IF EXISTS "Authenticated users can read parking spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can insert their spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can insert only their own parking spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can update their own spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can update only their own parking spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can delete their own spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can delete only their own parking spaces" ON public.parking_spaces;

-- Authenticated users can read parking spaces
CREATE POLICY "Authenticated users can read parking spaces"
  ON public.parking_spaces FOR SELECT
  TO authenticated
  USING (true);

-- Owners can insert only their own parking spaces
CREATE POLICY "Owners can insert only their own parking spaces"
  ON public.parking_spaces FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Owners can update only their own parking spaces
CREATE POLICY "Owners can update only their own parking spaces"
  ON public.parking_spaces FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete only their own parking spaces
CREATE POLICY "Owners can delete only their own parking spaces"
  ON public.parking_spaces FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- 3. BOOKINGS RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant bookings" ON public.bookings;
DROP POLICY IF EXISTS "Drivers can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Drivers can create bookings only for themselves" ON public.bookings;
DROP POLICY IF EXISTS "Drivers can read their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Owners can read bookings for their own spaces" ON public.bookings;
DROP POLICY IF EXISTS "Parties can update their bookings" ON public.bookings;

-- Drivers can create bookings only for themselves
CREATE POLICY "Drivers can create bookings only for themselves"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = driver_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'driver'
    )
  );

-- Drivers can read their own bookings
CREATE POLICY "Drivers can read their own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

-- Owners can read bookings for their own spaces
CREATE POLICY "Owners can read bookings for their own spaces"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parking_spaces
      WHERE id = bookings.space_id AND owner_id = auth.uid()
    )
  );

-- Both driver and owner can update bookings (e.g. status transition)
CREATE POLICY "Driver or owner can update their bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM public.parking_spaces
      WHERE id = bookings.space_id AND owner_id = auth.uid()
    )
  );
