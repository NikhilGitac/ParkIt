-- Allow anonymous & authenticated users to read active parking spaces, availability windows, and reviews
DROP POLICY IF EXISTS "Active spaces are viewable by everyone" ON public.parking_spaces;
CREATE POLICY "Active spaces are viewable by everyone"
  ON public.parking_spaces FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Availability is viewable by everyone" ON public.space_availability;
CREATE POLICY "Availability is viewable by everyone"
  ON public.space_availability FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);
