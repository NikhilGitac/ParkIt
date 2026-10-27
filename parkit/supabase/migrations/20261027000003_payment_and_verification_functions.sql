-- ==============================================================================
-- Migration: Payment Confirmation & Owner OTP Check-In Functions
-- ==============================================================================

-- 1. Confirm payment and lock in OTP
CREATE OR REPLACE FUNCTION public.confirm_booking_payment(
  p_booking_id uuid,
  p_otp_code varchar DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking record;
  v_otp varchar(6);
  v_updated record;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0004';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot pay for a cancelled booking.' USING ERRCODE = 'P0005';
  END IF;

  -- Ensure valid 6-digit OTP
  v_otp := COALESCE(p_otp_code, v_booking.otp_code);
  IF v_otp IS NULL OR length(v_otp) != 6 THEN
    v_otp := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
  END IF;

  UPDATE public.bookings
  SET
    status = 'confirmed',
    payment_status = 'paid',
    otp_code = v_otp,
    updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_updated;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_updated.id,
    'space_id', v_updated.space_id,
    'driver_id', v_updated.driver_id,
    'start_time', v_updated.start_time,
    'end_time', v_updated.end_time,
    'total_price', v_updated.total_price,
    'status', v_updated.status,
    'payment_status', v_updated.payment_status,
    'otp_code', v_updated.otp_code
  );
END;
$$;

-- 2. Owner OTP Check-in Verification Function
CREATE OR REPLACE FUNCTION public.verify_booking_checkin(
  p_booking_id uuid,
  p_otp_code varchar
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking record;
  v_updated record;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0004';
  END IF;

  IF v_booking.status = 'checked_in' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_checked_in', true,
      'status', 'checked_in',
      'message', 'Booking has already been checked in.'
    );
  END IF;

  IF v_booking.payment_status != 'paid' THEN
    RAISE EXCEPTION 'Cannot check in: Booking has not been paid yet.' USING ERRCODE = 'P0007';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot check in: Booking was cancelled.' USING ERRCODE = 'P0008';
  END IF;

  IF v_booking.status = 'completed' THEN
    RAISE EXCEPTION 'Cannot check in: Booking has already completed.' USING ERRCODE = 'P0009';
  END IF;

  IF trim(v_booking.otp_code) != trim(p_otp_code) THEN
    RAISE EXCEPTION 'Invalid OTP code. Please enter the correct 6-digit code provided by the driver.' USING ERRCODE = 'P0010';
  END IF;

  -- OTP matches and booking is valid: transition to checked_in
  UPDATE public.bookings
  SET
    status = 'checked_in',
    updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_updated;

  RETURN jsonb_build_object(
    'success', true,
    'already_checked_in', false,
    'status', v_updated.status,
    'payment_status', v_updated.payment_status,
    'booking_id', v_updated.id,
    'message', 'Check-in verified successfully! Gate access granted.'
  );
END;
$$;

-- Allow anon and authenticated clients to call payment confirmation & verification
GRANT EXECUTE ON FUNCTION public.confirm_booking_payment(uuid, varchar) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_booking_checkin(uuid, varchar) TO anon, authenticated, service_role;
