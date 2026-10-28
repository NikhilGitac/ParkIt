-- ==============================================================================
-- Migration: Add Space Detailed Fields and Atomic Listing Function
-- 1. Adds detailed address, space specs, slot count, instructions, and contact phone
-- 2. Preserves existing address column with safe default backfills
-- 3. Implements atomic RPC transaction: create_parking_space_with_availability
-- 4. Ensures RLS policies allow owners to insert and update their spaces
-- ==============================================================================

-- 1. ADD DETAILED COLUMNS TO parking_spaces
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS house_no text DEFAULT '';
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS building_name text DEFAULT '';
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS street text DEFAULT '';
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS landmark text DEFAULT '';
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS city text DEFAULT 'Greater Noida';
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS state text DEFAULT 'Uttar Pradesh';
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS pincode text DEFAULT '201310';
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS space_type text DEFAULT 'Home';
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS vehicle_types text[] DEFAULT '{Car}';
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS total_slots int DEFAULT 1;
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS entry_instructions text DEFAULT '';
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS contact_phone text DEFAULT '';
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}';

-- 2. SAFE BACKFILL FOR EXISTING SEEDED SPACES
UPDATE public.parking_spaces
SET 
  street = COALESCE(NULLIF(street, ''), SPLIT_PART(address, ',', 1)),
  city = COALESCE(NULLIF(city, ''), 'Greater Noida'),
  state = COALESCE(NULLIF(state, ''), 'Uttar Pradesh'),
  pincode = COALESCE(NULLIF(pincode, ''), '201310'),
  space_type = COALESCE(NULLIF(space_type, ''), 'Commercial'),
  vehicle_types = COALESCE(vehicle_types, '{Car,SUV}'),
  total_slots = COALESCE(total_slots, 1),
  contact_phone = COALESCE(NULLIF(contact_phone, ''), '+91 98100 12001')
WHERE street = '' OR city = '' OR pincode = '';

-- 3. ENSURE RLS POLICIES FOR parking_spaces AND space_availability
ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active spaces are viewable by everyone" ON public.parking_spaces;
CREATE POLICY "Active spaces are viewable by everyone"
  ON public.parking_spaces FOR SELECT
  USING (is_active = true OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can insert only their own parking spaces" ON public.parking_spaces;
CREATE POLICY "Owners can insert only their own parking spaces"
  ON public.parking_spaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update only their own parking spaces" ON public.parking_spaces;
CREATE POLICY "Owners can update only their own parking spaces"
  ON public.parking_spaces FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete only their own parking spaces" ON public.parking_spaces;
CREATE POLICY "Owners can delete only their own parking spaces"
  ON public.parking_spaces FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Space availability RLS
DROP POLICY IF EXISTS "Availability is viewable by everyone" ON public.space_availability;
CREATE POLICY "Availability is viewable by everyone"
  ON public.space_availability FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owners can manage space availability" ON public.space_availability;
CREATE POLICY "Owners can manage space availability"
  ON public.space_availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parking_spaces
      WHERE id = space_availability.space_id AND owner_id = auth.uid()
    )
  );

-- 4. ATOMIC RPC FUNCTION: create_parking_space_with_availability
CREATE OR REPLACE FUNCTION public.create_parking_space_with_availability(
  p_space jsonb,
  p_availability jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_owner_id uuid;
  v_space_id uuid;
  v_result jsonb;
  v_slot jsonb;
BEGIN
  -- Verify authenticated session
  v_owner_id := auth.uid();
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User session is missing or invalid' USING ERRCODE = '42501';
  END IF;

  -- Ensure profile exists with owner role
  INSERT INTO public.profiles (id, full_name, role, is_verified, updated_at)
  VALUES (
    v_owner_id,
    COALESCE(NULLIF(p_space->>'owner_name', ''), 'Verified Host'),
    'owner',
    true,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'owner',
    updated_at = now();

  -- Insert parking space in single transaction
  INSERT INTO public.parking_spaces (
    owner_id,
    title,
    description,
    address,
    latitude,
    longitude,
    price_per_hour,
    photo_url,
    is_active,
    house_no,
    building_name,
    street,
    landmark,
    city,
    state,
    pincode,
    space_type,
    vehicle_types,
    total_slots,
    entry_instructions,
    contact_phone,
    amenities
  )
  VALUES (
    v_owner_id,
    p_space->>'title',
    COALESCE(p_space->>'description', ''),
    p_space->>'address',
    (p_space->>'latitude')::double precision,
    (p_space->>'longitude')::double precision,
    (p_space->>'price_per_hour')::numeric,
    COALESCE(NULLIF(p_space->>'photo_url', ''), 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80'),
    true,
    COALESCE(p_space->>'house_no', ''),
    COALESCE(p_space->>'building_name', ''),
    COALESCE(p_space->>'street', ''),
    COALESCE(p_space->>'landmark', ''),
    COALESCE(NULLIF(p_space->>'city', ''), 'Greater Noida'),
    COALESCE(NULLIF(p_space->>'state', ''), 'Uttar Pradesh'),
    COALESCE(NULLIF(p_space->>'pincode', ''), '201310'),
    COALESCE(NULLIF(p_space->>'space_type', ''), 'Home'),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_space->'vehicle_types', '["Car"]'::jsonb))),
    COALESCE((p_space->>'total_slots')::int, 1),
    COALESCE(p_space->>'entry_instructions', ''),
    COALESCE(p_space->>'contact_phone', ''),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_space->'amenities', '[]'::jsonb)))
  )
  RETURNING id INTO v_space_id;

  -- Insert availability windows
  IF p_availability IS NOT NULL AND jsonb_array_length(p_availability) > 0 THEN
    FOR v_slot IN SELECT * FROM jsonb_array_elements(p_availability)
    LOOP
      INSERT INTO public.space_availability (
        space_id,
        day_of_week,
        start_time,
        end_time
      )
      VALUES (
        v_space_id,
        (v_slot->>'day_of_week')::int,
        (v_slot->>'start_time')::time,
        (v_slot->>'end_time')::time
      );
    END LOOP;
  END IF;

  SELECT to_jsonb(s) INTO v_result
  FROM public.parking_spaces s
  WHERE s.id = v_space_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_parking_space_with_availability(jsonb, jsonb) TO authenticated;

-- Reload schema cache
notify pgrst, 'reload schema';
