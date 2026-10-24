-- ==============================================================================
-- Migration: ParKit Initial Schema
-- Tables: profiles, parking_spaces, space_availability, bookings, reviews
-- Enums: user_role, booking_status, payment_status
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('driver', 'owner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending_payment',
    'confirmed',
    'checked_in',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'unpaid',
    'paid',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  role user_role NOT NULL DEFAULT 'driver',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. PARKING SPACES TABLE
CREATE TABLE IF NOT EXISTS public.parking_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  address text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  price_per_hour numeric(10, 2) NOT NULL CHECK (price_per_hour >= 0),
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_coordinates CHECK (
    latitude >= -90 AND latitude <= 90 AND
    longitude >= -180 AND longitude <= 180
  )
);

-- 5. SPACE AVAILABILITY TABLE
-- day_of_week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
CREATE TABLE IF NOT EXISTS public.space_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.parking_spaces(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_window CHECK (end_time > start_time)
);

-- 6. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.parking_spaces(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  total_price numeric(10, 2) NOT NULL CHECK (total_price >= 0),
  status booking_status NOT NULL DEFAULT 'pending_payment',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  otp_code varchar(6),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_booking_duration CHECK (end_time > start_time)
);

-- 7. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  space_id uuid NOT NULL REFERENCES public.parking_spaces(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Parking spaces (owner, active status, geo coordinates)
CREATE INDEX IF NOT EXISTS idx_parking_spaces_owner ON public.parking_spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_parking_spaces_active_geo ON public.parking_spaces(is_active, latitude, longitude);

-- Space availability
CREATE INDEX IF NOT EXISTS idx_space_availability_lookup ON public.space_availability(space_id, day_of_week);

-- Bookings (space_id, driver_id, time ranges, and status)
CREATE INDEX IF NOT EXISTS idx_bookings_space_id ON public.bookings(space_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON public.bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_space_times ON public.bookings(space_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_space_id ON public.reviews(space_id);
CREATE INDEX IF NOT EXISTS idx_reviews_driver_id ON public.reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Anyone can view profile names and avatars (e.g. for space listings & reviews)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can only insert or update their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- PARKING SPACES POLICIES
-- Active spaces can be viewed by anyone; owners can view all their own spaces
CREATE POLICY "Active spaces are viewable by everyone"
  ON public.parking_spaces FOR SELECT
  USING (is_active = true OR auth.uid() = owner_id);

-- Only authenticated owners can create spaces
CREATE POLICY "Owners can insert their spaces"
  ON public.parking_spaces FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Owners can update their own spaces
CREATE POLICY "Owners can update their own spaces"
  ON public.parking_spaces FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete their own spaces
CREATE POLICY "Owners can delete their own spaces"
  ON public.parking_spaces FOR DELETE
  USING (auth.uid() = owner_id);

-- SPACE AVAILABILITY POLICIES
-- Availability is viewable if space is viewable
CREATE POLICY "Space availability is viewable by everyone"
  ON public.space_availability FOR SELECT
  USING (true);

-- Owners can manage availability for their spaces
CREATE POLICY "Owners can insert availability"
  ON public.space_availability FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parking_spaces
      WHERE id = space_availability.space_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update availability"
  ON public.space_availability FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.parking_spaces
      WHERE id = space_availability.space_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete availability"
  ON public.space_availability FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.parking_spaces
      WHERE id = space_availability.space_id AND owner_id = auth.uid()
    )
  );

-- BOOKINGS POLICIES
-- Drivers can view their own bookings; Space Owners can view bookings on their spaces
CREATE POLICY "Users can view relevant bookings"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM public.parking_spaces
      WHERE id = bookings.space_id AND owner_id = auth.uid()
    )
  );

-- Drivers can create bookings
CREATE POLICY "Drivers can insert bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- Drivers and owners can update their bookings (status updates, cancellation, etc.)
CREATE POLICY "Parties can update their bookings"
  ON public.bookings FOR UPDATE
  USING (
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM public.parking_spaces
      WHERE id = bookings.space_id AND owner_id = auth.uid()
    )
  );

-- REVIEWS POLICIES
-- Reviews are publicly viewable
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

-- Drivers can add a review for their own booking
CREATE POLICY "Drivers can create reviews for their bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = driver_id AND
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = reviews.booking_id
        AND driver_id = auth.uid()
        AND status = 'completed'
    )
  );

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'ParKit Member'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'driver'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on every new user registration in Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
