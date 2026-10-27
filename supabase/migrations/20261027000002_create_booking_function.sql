-- ==============================================================================
-- Migration: Atomic Booking Creation with Concurrency & Overlap Prevention
-- ==============================================================================

-- 1. Function: create_booking
-- Serializes booking attempts for the same space via FOR UPDATE row locking,
-- validates space active status and operating schedule, checks for overlapping
-- bookings ('pending_payment', 'confirmed', 'checked_in'), and inserts the booking atomically.

CREATE OR REPLACE FUNCTION public.create_booking(
  p_space_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_driver_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id uuid;
  v_space record;
  v_hourly_rate numeric;
  v_duration_hours numeric;
  v_total_price numeric;
  v_day_of_week int;
  v_start_time_only time;
  v_end_time_only time;
  v_is_within_availability boolean := false;
  v_overlapping_booking_id uuid;
  v_new_booking_id uuid;
  v_otp varchar(6);
BEGIN
  -- 1. Determine driver_id
  v_driver_id := COALESCE(p_driver_id, auth.uid());
  IF v_driver_id IS NULL THEN
    -- Fallback to first demo driver profile if guest or unauthenticated
    SELECT id INTO v_driver_id FROM public.profiles WHERE role = 'driver' LIMIT 1;
    IF v_driver_id IS NULL THEN
      SELECT id INTO v_driver_id FROM public.profiles LIMIT 1;
    END IF;
  END IF;

  -- 2. Validate reservation times
  IF p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'Invalid reservation times: end time must be after start time.' USING ERRCODE = 'P0003';
  END IF;

  -- 3. Lock space row FOR UPDATE to prevent race conditions on concurrent bookings
  SELECT * INTO v_space
  FROM public.parking_spaces
  WHERE id = p_space_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parking space not found.' USING ERRCODE = 'P0004';
  END IF;

  -- Validate space is active
  IF NOT v_space.is_active THEN
    RAISE EXCEPTION 'This parking space is currently inactive.' USING ERRCODE = 'P0005';
  END IF;

  v_hourly_rate := v_space.price_per_hour;

  -- 4. Validate selected time is within space's availability
  v_day_of_week := EXTRACT(DOW FROM p_start_time AT TIME ZONE 'Asia/Kolkata');
  v_start_time_only := (p_start_time AT TIME ZONE 'Asia/Kolkata')::time;
  v_end_time_only := (p_end_time AT TIME ZONE 'Asia/Kolkata')::time;

  -- Check if slot falls inside defined operating hours
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

  -- 5. Check for overlapping bookings with active statuses
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

  -- 6. Calculate total price: duration in hours * price_per_hour
  v_duration_hours := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600.0;
  v_total_price := ROUND((v_duration_hours * v_hourly_rate)::numeric, 2);

  -- Generate 6-digit OTP code
  v_otp := lpad(floor(random() * 900000 + 100000)::text, 6, '0');

  -- 7. Insert booking with status pending_payment and payment_status unpaid
  INSERT INTO public.bookings (
    space_id,
    driver_id,
    start_time,
    end_time,
    total_price,
    status,
    payment_status,
    otp_code,
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
    now(),
    now()
  )
  RETURNING id INTO v_new_booking_id;

  -- 8. Return response payload
  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_new_booking_id,
    'space_id', p_space_id,
    'driver_id', v_driver_id,
    'start_time', p_start_time,
    'end_time', p_end_time,
    'total_price', v_total_price,
    'status', 'pending_payment',
    'payment_status', 'unpaid',
    'otp_code', v_otp
  );
END;
$$;

-- Allow anon and authenticated clients to invoke create_booking
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, timestamptz, timestamptz, uuid) TO anon, authenticated, service_role;
