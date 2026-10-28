-- ==============================================================================
-- Migration: Enforce Strict RLS for ParKit
-- 1. Profiles:
--    - Anyone authenticated can read profiles (needed to see host info & driver info)
--    - Users can insert and update only their own profile
-- 2. Parking Spaces:
--    - Anyone can read active spaces (and owners can read their inactive spaces)
--    - Owners can insert, update, delete only their own parking spaces
-- 3. Bookings:
--    - Drivers see only their own bookings
--    - Owners see bookings only for spaces they own
--    - Drivers can insert bookings only for themselves (auth.uid() = driver_id)
--    - Driver or space owner can update bookings (status transitions, payment, verification)
-- 4. Reviews:
--    - Anyone can read reviews
--    - Authenticated users can insert reviews only for themselves (auth.uid() = driver_id)
-- ==============================================================================

-- 1. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can read only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update only their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. PARKING SPACES
ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active spaces are viewable by everyone" ON public.parking_spaces;
DROP POLICY IF EXISTS "Authenticated users can read parking spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can insert their spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can insert only their own parking spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can update their own spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can update only their own parking spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can delete their own spaces" ON public.parking_spaces;
DROP POLICY IF EXISTS "Owners can delete only their own parking spaces" ON public.parking_spaces;

CREATE POLICY "Active spaces are viewable by everyone"
  ON public.parking_spaces FOR SELECT
  USING (is_active = true OR auth.uid() = owner_id);

CREATE POLICY "Owners can insert only their own parking spaces"
  ON public.parking_spaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update only their own parking spaces"
  ON public.parking_spaces FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete only their own parking spaces"
  ON public.parking_spaces FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- 3. BOOKINGS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant bookings" ON public.bookings;
DROP POLICY IF EXISTS "Drivers can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Drivers can create bookings only for themselves" ON public.bookings;
DROP POLICY IF EXISTS "Drivers can read their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Owners can read bookings for their own spaces" ON public.bookings;
DROP POLICY IF EXISTS "Driver or owner can update their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Parties can update their bookings" ON public.bookings;

CREATE POLICY "Drivers can create bookings only for themselves"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can read their own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Owners can read bookings for their own spaces"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parking_spaces
      WHERE id = bookings.space_id AND owner_id = auth.uid()
    )
  );

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

-- 4. REVIEWS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Drivers can insert reviews for themselves" ON public.reviews;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Drivers can insert reviews for themselves"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

-- 5. SPACE AVAILABILITY
ALTER TABLE public.space_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Availability is viewable by everyone" ON public.space_availability;
DROP POLICY IF EXISTS "Owners can manage space availability" ON public.space_availability;

CREATE POLICY "Availability is viewable by everyone"
  ON public.space_availability FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage space availability"
  ON public.space_availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parking_spaces
      WHERE id = space_availability.space_id AND owner_id = auth.uid()
    )
  );
