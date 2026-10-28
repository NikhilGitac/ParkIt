-- ==============================================================================
-- ParKit — Demo Seed Data: Greater Noida, Uttar Pradesh, India
-- Target City: Greater Noida, Uttar Pradesh, India
-- ==============================================================================
-- Description:
--   Seeds 18 realistic parking spaces distributed across prominent hubs
--   and residential/commercial sectors in Greater Noida, UP.
--   Includes:
--   - 5 Demo Owner profiles
--   - 6 Demo Driver profiles
--   - 18 Realistic Parking Spaces with INR pricing (₹20 to ₹80/hr)
--   - Realistic weekly availability windows
--   - Completed demo bookings and 2–4 authentic reviews (ratings 4-5) per space
--
-- Safety features:
--   - Scoped strictly to demo records using deterministic demo UUID prefixes:
--       Owners:   a0000000-*
--       Drivers:  d0000000-*
--       Spaces:   b0000000-*
--       Slots:    c0000000-*
--       Bookings: e0000000-*
--       Reviews:  f0000000-*
--       Emails:   demo.*@parkit.internal
--   - Does NOT touch or delete real user accounts, spaces, or bookings.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. DEMO AUTH USERS (Supabase auth.users)
-- ------------------------------------------------------------------------------
-- Password for all demo accounts: DemoPassword123!
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'demo.owner.rajesh@parkit.internal', crypt('DemoPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rajesh Sharma","role":"owner","phone":"+91 98100 12001"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'demo.owner.sunita@parkit.internal', crypt('DemoPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sunita Verma","role":"owner","phone":"+91 98100 12002"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'demo.owner.amit@parkit.internal', crypt('DemoPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Amit Goel","role":"owner","phone":"+91 98100 12003"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'demo.owner.priya@parkit.internal', crypt('DemoPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Bhasin","role":"owner","phone":"+91 98100 12004"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'demo.owner.pradeep@parkit.internal', crypt('DemoPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Pradeep Chaudhary","role":"owner","phone":"+91 98100 12005"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'demo.driver.rohan@parkit.internal', crypt('DemoPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rohan Malhotra","role":"driver","phone":"+91 99100 34001"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'demo.driver.neha@parkit.internal', crypt('DemoPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Neha Gupta","role":"driver","phone":"+91 99100 34002"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'demo.driver.kunal@parkit.internal', crypt('DemoPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kunal Saxena","role":"driver","phone":"+91 99100 34003"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'demo.driver.deepa@parkit.internal', crypt('DemoPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Deepa Ranganathan","role":"driver","phone":"+91 99100 34004"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'demo.driver.vikram@parkit.internal', crypt('DemoPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vikramaditya Yadav","role":"driver","phone":"+91 99100 34005"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'demo.driver.shweta@parkit.internal', crypt('DemoPassword123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Shweta Agarwal","role":"driver","phone":"+91 99100 34006"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000099', 'authenticated', 'authenticated', 'demo.host@parkit.test', crypt('DemoHost123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Host (Verified)","role":"owner","phone":"+91 98100 12001"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000099', 'authenticated', 'authenticated', 'demo.driver@parkit.test', crypt('DemoDriver123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Driver (Verified)","role":"driver","phone":"+91 99100 34001"}', now(), now(), '', '')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- ------------------------------------------------------------------------------
-- 2. PUBLIC PROFILES
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (id, full_name, phone, role, avatar_url)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Rajesh Sharma', '+91 98100 12001', 'owner', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'),
  ('a0000000-0000-0000-0000-000000000002', 'Sunita Verma', '+91 98100 12002', 'owner', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'),
  ('a0000000-0000-0000-0000-000000000003', 'Amit Goel', '+91 98100 12003', 'owner', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'),
  ('a0000000-0000-0000-0000-000000000004', 'Priya Bhasin', '+91 98100 12004', 'owner', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'),
  ('a0000000-0000-0000-0000-000000000005', 'Pradeep Chaudhary', '+91 98100 12005', 'owner', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80'),
  ('d0000000-0000-0000-0000-000000000001', 'Rohan Malhotra', '+91 99100 34001', 'driver', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'),
  ('d0000000-0000-0000-0000-000000000002', 'Neha Gupta', '+91 99100 34002', 'driver', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80'),
  ('d0000000-0000-0000-0000-000000000003', 'Kunal Saxena', '+91 99100 34003', 'driver', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80'),
  ('d0000000-0000-0000-0000-000000000004', 'Deepa Ranganathan', '+91 99100 34004', 'driver', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'),
  ('d0000000-0000-0000-0000-000000000005', 'Vikramaditya Yadav', '+91 99100 34005', 'driver', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'),
  ('d0000000-0000-0000-0000-000000000006', 'Shweta Agarwal', '+91 99100 34006', 'driver', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'),
  ('a0000000-0000-0000-0000-000000000099', 'Demo Host (Verified)', '+91 98100 12001', 'owner', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'),
  ('d0000000-0000-0000-0000-000000000099', 'Demo Driver (Verified)', '+91 99100 34001', 'driver', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = now();

-- ------------------------------------------------------------------------------
-- 3. PARKING SPACES (18 Realistic Spots in Greater Noida, UP)
-- ------------------------------------------------------------------------------
INSERT INTO public.parking_spaces (
  id,
  owner_id,
  title,
  description,
  address,
  latitude,
  longitude,
  price_per_hour,
  photo_url,
  is_active
)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000099', 'Pari Chowk Metro Plaza Covered Bay', 'Weatherproof, well-lit parking bay situated right beside Pari Chowk Metro Station Exit 2. CCTV monitored 24/7 with wide turning radius suitable for SUVs and sedans.', 'Ground Level Bay 4, Near Pari Chowk Metro Station Exit 2, Greater Noida, UP 201310', 28.47440, 77.50390, 45.00, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'India Expo Mart Premier Visitor Bay', 'Spacious private paved parking slot directly facing India Expo Centre Gate 3. Avoid exhibition congestion with guaranteed access and security guard on duty.', 'Plot 23-27, Knowledge Park II, Opp. India Expo Centre Gate 3, Greater Noida, UP 201306', 28.46230, 77.49750, 60.00, 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Knowledge Park III Campus Driveway', 'Secure, gated driveway parking in Knowledge Park III. Walking distance to leading college campuses, GL Bajaj, and Galgotias. Perfect for visitors and faculties.', 'Sector KP-III, Institutional Belt, Near GL Bajaj Institute, Greater Noida, UP 201306', 28.46780, 77.49120, 30.00, 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Alpha 1 Commercial Complex Parking', 'Paved parking space right at Alpha 1 commercial hub. Safe corner with boom barrier and shaded afternoon canopy, 2 minutes from banks and restaurants.', 'Pocket A, Near Commercial Belt & Senior Citizen Park, Sector Alpha 1, Greater Noida, UP 201308', 28.48310, 77.51350, 35.00, 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Beta 1 Jagat Farm Market Corner', 'Skip the heavy Jagat Farm market rush. Reserved private spot behind the retail avenue, easily accessible from main ring road with CCTV monitoring.', 'Shopping Centre Perimeter, Jagat Farm Market, Sector Gamma 1 / Beta 1, Greater Noida, UP 201308', 28.47950, 77.51800, 40.00, 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000099', 'Jaypee Greens Pavilion Shaded Carport', 'Premium covered carport in high-security Jaypee Greens township. Includes EV trickle-charging port, manicured driveway, and 24-hour manned gate.', 'Gated Villa Enclave, Jaypee Greens Golf Course Road, Greater Noida, UP 201310', 28.48620, 77.52400, 80.00, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'Knowledge Park II Sharda Link Spot', 'Convenient parking spot across Sharda University & Hospital. Fully paved, accessible 24/7 with night floodlights and street surveillance.', 'Institutional Area, Opp. Sharda Hospital Gate 2, Knowledge Park II, Greater Noida, UP 201306', 28.47210, 77.48800, 30.00, 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'Beta 2 Institutional & School Zone Bay', 'Quiet, tree-shaded driveway in Sector Beta II. Stress-free parking for school pick-up, local appointments, and metro commuters.', 'Block B, Near Ryan International School & Beta 2 Metro, Greater Noida, UP 201308', 28.47150, 77.52850, 25.00, 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000004', 'Gamma 2 Shopping Plaza Reserved Bay', 'Open asphalt parking slot directly adjacent to Sector Gamma 2 commercial stores. Hassle-free entry with quick highway exit.', 'Commercial Belt Block G, Near Gamma Shopping Complex, Greater Noida, UP 201308', 28.48700, 77.50900, 35.00, 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000005', 'Delta 1 Metro Connector Private Driveway', 'Dedicated private driveway just a 2-minute stroll to the Aqua Line Delta 1 Metro Station. Park securely and beat expressway rush hour traffic.', 'Pocket C, 200m from Delta 1 Metro Station, Sector Delta 1, Greater Noida, UP 201308', 28.49550, 77.51400, 40.00, 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000099', 'Gaur City Mall Covered Basement Slot', 'Reserved private parking slot in Gaur City hub. Weatherproof, barrier-controlled entry with direct elevator access to retail and corporate towers.', 'Basement Level B1, Gaur City Mall, Sector 4, Greater Noida West, UP 201009', 28.60800, 77.43050, 50.00, 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'TechZone 4 IT Park Express Spot', 'Paved open parking bay right inside TechZone 4 tech corridor. Ideal for IT professionals and corporate visitors near Ek Murti roundabout.', 'Plot 12, TechZone 4, Near Ek Murti Chowk, Greater Noida West, UP 201306', 28.59920, 77.44200, 40.00, 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000003', 'Omicron 1 Residential Secure Carport', 'Covered residential carport with locked side gate. Clean, safe, and protected from summer sun. Readily accommodates large SUVs.', 'Sector Omicron 1, Near Eldeco Enclave, Greater Noida, UP 201310', 28.50300, 77.53100, 30.00, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000004', 'Gautam Buddha University Perimeter Bay', 'Wide concrete parking space near Gautam Buddha University campus main entrance. Ideal for conference attendees, parents, and academic delegates.', 'Yamuna Expressway Service Lane, Near GBU Gate 1, Sector Chi 4, Greater Noida, UP 201312', 28.43200, 77.52700, 25.00, 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000005', 'Shaheed Vijay Singh Pathik Sports Bay', 'Direct stadium access parking spot. Avoid event day gridlock during cricket matches, sports championships, and indoor training sessions.', 'Recreational Green Area, Opp. Greater Noida Cricket Stadium, Sector Chi, Greater Noida, UP 201310', 28.46450, 77.52550, 50.00, 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000099', 'Surajpur District Court & Collectorate Bay', 'Designated private slot next to Surajpur Administrative Complex. Quick in-and-out access for advocates, litigants, and official administrative visits.', 'Surajpur - Kasna Road, Near District Sessions Court, Greater Noida, UP 201306', 28.52850, 77.49200, 35.00, 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000002', 'Omaxe Connaught Place Plaza Bay', 'VIP open parking space 50 meters from Omaxe CP Mall entrance. 24/7 CCTV surveillance, quick valet-style ease for weekend diners and shoppers.', 'Block Beta 2 Peripheral Lane, Adjacent to Omaxe CP Mall, Greater Noida, UP 201308', 28.47350, 77.51450, 60.00, 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80', true),
  ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000003', 'Zeta 1 Premium Driveway Bay', 'Gated and secure driveway inside residential society perimeter. Friendly host with instant messaging and 24-hour security intercom.', 'AVJ Heights Enclave Road, Sector Zeta 1, Greater Noida, UP 201306', 28.51200, 77.50200, 35.00, 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80', true)
ON CONFLICT (id) DO UPDATE SET
  owner_id = EXCLUDED.owner_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  price_per_hour = EXCLUDED.price_per_hour,
  photo_url = EXCLUDED.photo_url,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ------------------------------------------------------------------------------
-- 4. SPACE AVAILABILITY WINDOWS
-- ------------------------------------------------------------------------------
INSERT INTO public.space_availability (id, space_id, day_of_week, start_time, end_time)
VALUES
  ('c0000000-0000-0000-0000-000001000001', 'b0000000-0000-0000-0000-000000000001', 1, '06:00', '23:00'),
  ('c0000000-0000-0000-0000-000001000002', 'b0000000-0000-0000-0000-000000000001', 2, '06:00', '23:00'),
  ('c0000000-0000-0000-0000-000001000003', 'b0000000-0000-0000-0000-000000000001', 3, '06:00', '23:00'),
  ('c0000000-0000-0000-0000-000001000004', 'b0000000-0000-0000-0000-000000000001', 4, '06:00', '23:00'),
  ('c0000000-0000-0000-0000-000001000005', 'b0000000-0000-0000-0000-000000000001', 5, '06:00', '23:00'),
  ('c0000000-0000-0000-0000-000001000006', 'b0000000-0000-0000-0000-000000000001', 6, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000001000007', 'b0000000-0000-0000-0000-000000000001', 0, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000002000001', 'b0000000-0000-0000-0000-000000000002', 1, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000002000002', 'b0000000-0000-0000-0000-000000000002', 2, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000002000003', 'b0000000-0000-0000-0000-000000000002', 3, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000002000004', 'b0000000-0000-0000-0000-000000000002', 4, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000002000005', 'b0000000-0000-0000-0000-000000000002', 5, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000002000006', 'b0000000-0000-0000-0000-000000000002', 6, '08:00', '21:00'),
  ('c0000000-0000-0000-0000-000002000007', 'b0000000-0000-0000-0000-000000000002', 0, '08:00', '21:00'),
  ('c0000000-0000-0000-0000-000003000001', 'b0000000-0000-0000-0000-000000000003', 1, '08:00', '20:00'),
  ('c0000000-0000-0000-0000-000003000002', 'b0000000-0000-0000-0000-000000000003', 2, '08:00', '20:00'),
  ('c0000000-0000-0000-0000-000003000003', 'b0000000-0000-0000-0000-000000000003', 3, '08:00', '20:00'),
  ('c0000000-0000-0000-0000-000003000004', 'b0000000-0000-0000-0000-000000000003', 4, '08:00', '20:00'),
  ('c0000000-0000-0000-0000-000003000005', 'b0000000-0000-0000-0000-000000000003', 5, '08:00', '20:00'),
  ('c0000000-0000-0000-0000-000003000006', 'b0000000-0000-0000-0000-000000000003', 6, '08:00', '18:00'),
  ('c0000000-0000-0000-0000-000004000001', 'b0000000-0000-0000-0000-000000000004', 1, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000004000002', 'b0000000-0000-0000-0000-000000000004', 2, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000004000003', 'b0000000-0000-0000-0000-000000000004', 3, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000004000004', 'b0000000-0000-0000-0000-000000000004', 4, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000004000005', 'b0000000-0000-0000-0000-000000000004', 5, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000004000006', 'b0000000-0000-0000-0000-000000000004', 6, '09:00', '23:00'),
  ('c0000000-0000-0000-0000-000004000007', 'b0000000-0000-0000-0000-000000000004', 0, '09:00', '23:00'),
  ('c0000000-0000-0000-0000-000005000001', 'b0000000-0000-0000-0000-000000000005', 1, '10:00', '22:30'),
  ('c0000000-0000-0000-0000-000005000002', 'b0000000-0000-0000-0000-000000000005', 2, '10:00', '22:30'),
  ('c0000000-0000-0000-0000-000005000003', 'b0000000-0000-0000-0000-000000000005', 3, '10:00', '22:30'),
  ('c0000000-0000-0000-0000-000005000004', 'b0000000-0000-0000-0000-000000000005', 4, '10:00', '22:30'),
  ('c0000000-0000-0000-0000-000005000005', 'b0000000-0000-0000-0000-000000000005', 5, '10:00', '22:30'),
  ('c0000000-0000-0000-0000-000005000006', 'b0000000-0000-0000-0000-000000000005', 6, '10:00', '23:00'),
  ('c0000000-0000-0000-0000-000005000007', 'b0000000-0000-0000-0000-000000000005', 0, '10:00', '23:00'),
  ('c0000000-0000-0000-0000-000006000001', 'b0000000-0000-0000-0000-000000000006', 1, '00:00', '23:59'),
  ('c0000000-0000-0000-0000-000006000002', 'b0000000-0000-0000-0000-000000000006', 2, '00:00', '23:59'),
  ('c0000000-0000-0000-0000-000006000003', 'b0000000-0000-0000-0000-000000000006', 3, '00:00', '23:59'),
  ('c0000000-0000-0000-0000-000006000004', 'b0000000-0000-0000-0000-000000000006', 4, '00:00', '23:59'),
  ('c0000000-0000-0000-0000-000006000005', 'b0000000-0000-0000-0000-000000000006', 5, '00:00', '23:59'),
  ('c0000000-0000-0000-0000-000006000006', 'b0000000-0000-0000-0000-000000000006', 6, '00:00', '23:59'),
  ('c0000000-0000-0000-0000-000006000007', 'b0000000-0000-0000-0000-000000000006', 0, '00:00', '23:59'),
  ('c0000000-0000-0000-0000-000007000001', 'b0000000-0000-0000-0000-000000000007', 1, '07:30', '20:30'),
  ('c0000000-0000-0000-0000-000007000002', 'b0000000-0000-0000-0000-000000000007', 2, '07:30', '20:30'),
  ('c0000000-0000-0000-0000-000007000003', 'b0000000-0000-0000-0000-000000000007', 3, '07:30', '20:30'),
  ('c0000000-0000-0000-0000-000007000004', 'b0000000-0000-0000-0000-000000000007', 4, '07:30', '20:30'),
  ('c0000000-0000-0000-0000-000007000005', 'b0000000-0000-0000-0000-000000000007', 5, '07:30', '20:30'),
  ('c0000000-0000-0000-0000-000007000006', 'b0000000-0000-0000-0000-000000000007', 6, '08:00', '19:00'),
  ('c0000000-0000-0000-0000-000008000001', 'b0000000-0000-0000-0000-000000000008', 1, '07:00', '18:00'),
  ('c0000000-0000-0000-0000-000008000002', 'b0000000-0000-0000-0000-000000000008', 2, '07:00', '18:00'),
  ('c0000000-0000-0000-0000-000008000003', 'b0000000-0000-0000-0000-000000000008', 3, '07:00', '18:00'),
  ('c0000000-0000-0000-0000-000008000004', 'b0000000-0000-0000-0000-000000000008', 4, '07:00', '18:00'),
  ('c0000000-0000-0000-0000-000008000005', 'b0000000-0000-0000-0000-000000000008', 5, '07:00', '18:00'),
  ('c0000000-0000-0000-0000-000009000001', 'b0000000-0000-0000-0000-000000000009', 1, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000009000002', 'b0000000-0000-0000-0000-000000000009', 2, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000009000003', 'b0000000-0000-0000-0000-000000000009', 3, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000009000004', 'b0000000-0000-0000-0000-000000000009', 4, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000009000005', 'b0000000-0000-0000-0000-000000000009', 5, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000009000006', 'b0000000-0000-0000-0000-000000000009', 6, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000009000007', 'b0000000-0000-0000-0000-000000000009', 0, '09:00', '22:00'),
  ('c0000000-0000-0000-0000-000010000001', 'b0000000-0000-0000-0000-000000000010', 1, '06:00', '23:00'),
  ('c0000000-0000-0000-0000-000010000002', 'b0000000-0000-0000-0000-000000000010', 2, '06:00', '23:00'),
  ('c0000000-0000-0000-0000-000010000003', 'b0000000-0000-0000-0000-000000000010', 3, '06:00', '23:00'),
  ('c0000000-0000-0000-0000-000010000004', 'b0000000-0000-0000-0000-000000000010', 4, '06:00', '23:00'),
  ('c0000000-0000-0000-0000-000010000005', 'b0000000-0000-0000-0000-000000000010', 5, '06:00', '23:00'),
  ('c0000000-0000-0000-0000-000010000006', 'b0000000-0000-0000-0000-000000000010', 6, '06:30', '22:30'),
  ('c0000000-0000-0000-0000-000010000007', 'b0000000-0000-0000-0000-000000000010', 0, '06:30', '22:30'),
  ('c0000000-0000-0000-0000-000011000001', 'b0000000-0000-0000-0000-000000000011', 1, '09:00', '23:30'),
  ('c0000000-0000-0000-0000-000011000002', 'b0000000-0000-0000-0000-000000000011', 2, '09:00', '23:30'),
  ('c0000000-0000-0000-0000-000011000003', 'b0000000-0000-0000-0000-000000000011', 3, '09:00', '23:30'),
  ('c0000000-0000-0000-0000-000011000004', 'b0000000-0000-0000-0000-000000000011', 4, '09:00', '23:30'),
  ('c0000000-0000-0000-0000-000011000005', 'b0000000-0000-0000-0000-000000000011', 5, '09:00', '23:30'),
  ('c0000000-0000-0000-0000-000011000006', 'b0000000-0000-0000-0000-000000000011', 6, '09:00', '23:59'),
  ('c0000000-0000-0000-0000-000011000007', 'b0000000-0000-0000-0000-000000000011', 0, '09:00', '23:59'),
  ('c0000000-0000-0000-0000-000012000001', 'b0000000-0000-0000-0000-000000000012', 1, '08:00', '21:00'),
  ('c0000000-0000-0000-0000-000012000002', 'b0000000-0000-0000-0000-000000000012', 2, '08:00', '21:00'),
  ('c0000000-0000-0000-0000-000012000003', 'b0000000-0000-0000-0000-000000000012', 3, '08:00', '21:00'),
  ('c0000000-0000-0000-0000-000012000004', 'b0000000-0000-0000-0000-000000000012', 4, '08:00', '21:00'),
  ('c0000000-0000-0000-0000-000012000005', 'b0000000-0000-0000-0000-000000000012', 5, '08:00', '21:00'),
  ('c0000000-0000-0000-0000-000013000001', 'b0000000-0000-0000-0000-000000000013', 1, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000013000002', 'b0000000-0000-0000-0000-000000000013', 2, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000013000003', 'b0000000-0000-0000-0000-000000000013', 3, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000013000004', 'b0000000-0000-0000-0000-000000000013', 4, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000013000005', 'b0000000-0000-0000-0000-000000000013', 5, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000013000006', 'b0000000-0000-0000-0000-000000000013', 6, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000013000007', 'b0000000-0000-0000-0000-000000000013', 0, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000014000001', 'b0000000-0000-0000-0000-000000000014', 1, '08:00', '20:00'),
  ('c0000000-0000-0000-0000-000014000002', 'b0000000-0000-0000-0000-000000000014', 2, '08:00', '20:00'),
  ('c0000000-0000-0000-0000-000014000003', 'b0000000-0000-0000-0000-000000000014', 3, '08:00', '20:00'),
  ('c0000000-0000-0000-0000-000014000004', 'b0000000-0000-0000-0000-000000000014', 4, '08:00', '20:00'),
  ('c0000000-0000-0000-0000-000014000005', 'b0000000-0000-0000-0000-000000000014', 5, '08:00', '20:00'),
  ('c0000000-0000-0000-0000-000014000006', 'b0000000-0000-0000-0000-000000000014', 6, '08:00', '18:00'),
  ('c0000000-0000-0000-0000-000015000001', 'b0000000-0000-0000-0000-000000000015', 1, '06:00', '21:00'),
  ('c0000000-0000-0000-0000-000015000002', 'b0000000-0000-0000-0000-000000000015', 2, '06:00', '21:00'),
  ('c0000000-0000-0000-0000-000015000003', 'b0000000-0000-0000-0000-000000000015', 3, '06:00', '21:00'),
  ('c0000000-0000-0000-0000-000015000004', 'b0000000-0000-0000-0000-000000000015', 4, '06:00', '21:00'),
  ('c0000000-0000-0000-0000-000015000005', 'b0000000-0000-0000-0000-000000000015', 5, '06:00', '21:00'),
  ('c0000000-0000-0000-0000-000015000006', 'b0000000-0000-0000-0000-000000000015', 6, '06:00', '21:00'),
  ('c0000000-0000-0000-0000-000015000007', 'b0000000-0000-0000-0000-000000000015', 0, '06:00', '21:00'),
  ('c0000000-0000-0000-0000-000016000001', 'b0000000-0000-0000-0000-000000000016', 1, '08:30', '18:30'),
  ('c0000000-0000-0000-0000-000016000002', 'b0000000-0000-0000-0000-000000000016', 2, '08:30', '18:30'),
  ('c0000000-0000-0000-0000-000016000003', 'b0000000-0000-0000-0000-000000000016', 3, '08:30', '18:30'),
  ('c0000000-0000-0000-0000-000016000004', 'b0000000-0000-0000-0000-000000000016', 4, '08:30', '18:30'),
  ('c0000000-0000-0000-0000-000016000005', 'b0000000-0000-0000-0000-000000000016', 5, '08:30', '18:30'),
  ('c0000000-0000-0000-0000-000017000001', 'b0000000-0000-0000-0000-000000000017', 1, '10:00', '23:00'),
  ('c0000000-0000-0000-0000-000017000002', 'b0000000-0000-0000-0000-000000000017', 2, '10:00', '23:00'),
  ('c0000000-0000-0000-0000-000017000003', 'b0000000-0000-0000-0000-000000000017', 3, '10:00', '23:00'),
  ('c0000000-0000-0000-0000-000017000004', 'b0000000-0000-0000-0000-000000000017', 4, '10:00', '23:00'),
  ('c0000000-0000-0000-0000-000017000005', 'b0000000-0000-0000-0000-000000000017', 5, '10:00', '23:00'),
  ('c0000000-0000-0000-0000-000017000006', 'b0000000-0000-0000-0000-000000000017', 6, '10:00', '23:30'),
  ('c0000000-0000-0000-0000-000017000007', 'b0000000-0000-0000-0000-000000000017', 0, '10:00', '23:30'),
  ('c0000000-0000-0000-0000-000018000001', 'b0000000-0000-0000-0000-000000000018', 1, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000018000002', 'b0000000-0000-0000-0000-000000000018', 2, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000018000003', 'b0000000-0000-0000-0000-000000000018', 3, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000018000004', 'b0000000-0000-0000-0000-000000000018', 4, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000018000005', 'b0000000-0000-0000-0000-000000000018', 5, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000018000006', 'b0000000-0000-0000-0000-000000000018', 6, '07:00', '22:00'),
  ('c0000000-0000-0000-0000-000018000007', 'b0000000-0000-0000-0000-000000000018', 0, '07:00', '22:00')
ON CONFLICT (id) DO UPDATE SET
  day_of_week = EXCLUDED.day_of_week,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time;

-- ------------------------------------------------------------------------------
-- 5. COMPLETED BOOKINGS
-- ------------------------------------------------------------------------------
INSERT INTO public.bookings (
  id,
  space_id,
  driver_id,
  start_time,
  end_time,
  total_price,
  status,
  payment_status,
  otp_code,
  created_at
)
VALUES
  ('e0000000-0000-0000-0000-000001000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', now() - interval '6 days', now() - interval '6 days' + interval '3 hours', 135.00, 'completed', 'paid', '491203', now() - interval '6 days'),
  ('e0000000-0000-0000-0000-000001000002', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', now() - interval '4 days', now() - interval '4 days' + interval '2 hours', 90.00, 'completed', 'paid', '814920', now() - interval '4 days'),
  ('e0000000-0000-0000-0000-000001000003', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', now() - interval '2 days', now() - interval '2 days' + interval '4 hours', 180.00, 'completed', 'paid', '193852', now() - interval '2 days'),
  ('e0000000-0000-0000-0000-000001000098', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000099', now() - interval '1 hour', now() + interval '2 hours', 135.00, 'confirmed', 'paid', '4821', now() - interval '1 hour'),
  ('e0000000-0000-0000-0000-000001000099', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000099', now() - interval '1 day', now() - interval '1 day' + interval '2 hours', 90.00, 'completed', 'paid', '1934', now() - interval '1 day'),
  ('e0000000-0000-0000-0000-000002000001', 'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', now() - interval '10 days', now() - interval '10 days' + interval '6 hours', 360.00, 'completed', 'paid', '502914', now() - interval '10 days'),
  ('e0000000-0000-0000-0000-000002000002', 'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', now() - interval '7 days', now() - interval '7 days' + interval '5 hours', 300.00, 'completed', 'paid', '381940', now() - interval '7 days'),
  ('e0000000-0000-0000-0000-000002000003', 'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006', now() - interval '3 days', now() - interval '3 days' + interval '4 hours', 240.00, 'completed', 'paid', '749102', now() - interval '3 days'),
  ('e0000000-0000-0000-0000-000003000001', 'b0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', now() - interval '12 days', now() - interval '12 days' + interval '4 hours', 120.00, 'completed', 'paid', '639104', now() - interval '12 days'),
  ('e0000000-0000-0000-0000-000003000002', 'b0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', now() - interval '5 days', now() - interval '5 days' + interval '3 hours', 90.00, 'completed', 'paid', '284719', now() - interval '5 days'),
  ('e0000000-0000-0000-0000-000003000003', 'b0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', now() - interval '1 days', now() - interval '1 days' + interval '5 hours', 150.00, 'completed', 'paid', '830184', now() - interval '1 days'),
  ('e0000000-0000-0000-0000-000004000001', 'b0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', now() - interval '8 days', now() - interval '8 days' + interval '2 hours', 70.00, 'completed', 'paid', '174829', now() - interval '8 days'),
  ('e0000000-0000-0000-0000-000004000002', 'b0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005', now() - interval '3 days', now() - interval '3 days' + interval '3 hours', 105.00, 'completed', 'paid', '928471', now() - interval '3 days'),
  ('e0000000-0000-0000-0000-000005000001', 'b0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000006', now() - interval '9 days', now() - interval '9 days' + interval '2 hours', 80.00, 'completed', 'paid', '374820', now() - interval '9 days'),
  ('e0000000-0000-0000-0000-000005000002', 'b0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', now() - interval '4 days', now() - interval '4 days' + interval '3 hours', 120.00, 'completed', 'paid', '491823', now() - interval '4 days'),
  ('e0000000-0000-0000-0000-000005000003', 'b0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', now() - interval '2 days', now() - interval '2 days' + interval '2 hours', 80.00, 'completed', 'paid', '619284', now() - interval '2 days'),
  ('e0000000-0000-0000-0000-000006000001', 'b0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', now() - interval '14 days', now() - interval '14 days' + interval '4 hours', 320.00, 'completed', 'paid', '284910', now() - interval '14 days'),
  ('e0000000-0000-0000-0000-000006000002', 'b0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000004', now() - interval '6 days', now() - interval '6 days' + interval '5 hours', 400.00, 'completed', 'paid', '749103', now() - interval '6 days'),
  ('e0000000-0000-0000-0000-000007000001', 'b0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000005', now() - interval '11 days', now() - interval '11 days' + interval '3 hours', 90.00, 'completed', 'paid', '928410', now() - interval '11 days'),
  ('e0000000-0000-0000-0000-000007000002', 'b0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000006', now() - interval '4 days', now() - interval '4 days' + interval '4 hours', 120.00, 'completed', 'paid', '581920', now() - interval '4 days'),
  ('e0000000-0000-0000-0000-000007000003', 'b0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', now() - interval '1 days', now() - interval '1 days' + interval '2 hours', 60.00, 'completed', 'paid', '319482', now() - interval '1 days'),
  ('e0000000-0000-0000-0000-000008000001', 'b0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000002', now() - interval '13 days', now() - interval '13 days' + interval '2 hours', 50.00, 'completed', 'paid', '849102', now() - interval '13 days'),
  ('e0000000-0000-0000-0000-000008000002', 'b0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', now() - interval '6 days', now() - interval '6 days' + interval '3 hours', 75.00, 'completed', 'paid', '491029', now() - interval '6 days'),
  ('e0000000-0000-0000-0000-000009000001', 'b0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000004', now() - interval '15 days', now() - interval '15 days' + interval '2 hours', 70.00, 'completed', 'paid', '619284', now() - interval '15 days'),
  ('e0000000-0000-0000-0000-000009000002', 'b0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000005', now() - interval '7 days', now() - interval '7 days' + interval '3 hours', 105.00, 'completed', 'paid', '384910', now() - interval '7 days'),
  ('e0000000-0000-0000-0000-000010000001', 'b0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000006', now() - interval '8 days', now() - interval '8 days' + interval '8 hours', 320.00, 'completed', 'paid', '749102', now() - interval '8 days'),
  ('e0000000-0000-0000-0000-000010000002', 'b0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000001', now() - interval '3 days', now() - interval '3 days' + interval '6 hours', 240.00, 'completed', 'paid', '839201', now() - interval '3 days'),
  ('e0000000-0000-0000-0000-000010000003', 'b0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000002', now() - interval '1 days', now() - interval '1 days' + interval '4 hours', 160.00, 'completed', 'paid', '294819', now() - interval '1 days'),
  ('e0000000-0000-0000-0000-000011000001', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000003', now() - interval '12 days', now() - interval '12 days' + interval '4 hours', 200.00, 'completed', 'paid', '591024', now() - interval '12 days'),
  ('e0000000-0000-0000-0000-000011000002', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000004', now() - interval '5 days', now() - interval '5 days' + interval '3 hours', 150.00, 'completed', 'paid', '749201', now() - interval '5 days'),
  ('e0000000-0000-0000-0000-000011000003', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000005', now() - interval '2 days', now() - interval '2 days' + interval '5 hours', 250.00, 'completed', 'paid', '830194', now() - interval '2 days'),
  ('e0000000-0000-0000-0000-000012000001', 'b0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000006', now() - interval '9 days', now() - interval '9 days' + interval '9 hours', 360.00, 'completed', 'paid', '491028', now() - interval '9 days'),
  ('e0000000-0000-0000-0000-000012000002', 'b0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000001', now() - interval '4 days', now() - interval '4 days' + interval '8 hours', 320.00, 'completed', 'paid', '920184', now() - interval '4 days'),
  ('e0000000-0000-0000-0000-000013000001', 'b0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000002', now() - interval '16 days', now() - interval '16 days' + interval '4 hours', 120.00, 'completed', 'paid', '284910', now() - interval '16 days'),
  ('e0000000-0000-0000-0000-000013000002', 'b0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000003', now() - interval '6 days', now() - interval '6 days' + interval '3 hours', 90.00, 'completed', 'paid', '619204', now() - interval '6 days'),
  ('e0000000-0000-0000-0000-000014000001', 'b0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000004', now() - interval '11 days', now() - interval '11 days' + interval '5 hours', 125.00, 'completed', 'paid', '749182', now() - interval '11 days'),
  ('e0000000-0000-0000-0000-000014000002', 'b0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000005', now() - interval '3 days', now() - interval '3 days' + interval '6 hours', 150.00, 'completed', 'paid', '839201', now() - interval '3 days'),
  ('e0000000-0000-0000-0000-000015000001', 'b0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000006', now() - interval '10 days', now() - interval '10 days' + interval '3 hours', 150.00, 'completed', 'paid', '591024', now() - interval '10 days'),
  ('e0000000-0000-0000-0000-000015000002', 'b0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000001', now() - interval '2 days', now() - interval '2 days' + interval '4 hours', 200.00, 'completed', 'paid', '729481', now() - interval '2 days'),
  ('e0000000-0000-0000-0000-000016000001', 'b0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000002', now() - interval '8 days', now() - interval '8 days' + interval '3 hours', 105.00, 'completed', 'paid', '391029', now() - interval '8 days'),
  ('e0000000-0000-0000-0000-000016000002', 'b0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000003', now() - interval '4 days', now() - interval '4 days' + interval '2 hours', 70.00, 'completed', 'paid', '481920', now() - interval '4 days'),
  ('e0000000-0000-0000-0000-000017000001', 'b0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000004', now() - interval '14 days', now() - interval '14 days' + interval '3 hours', 180.00, 'completed', 'paid', '849102', now() - interval '14 days'),
  ('e0000000-0000-0000-0000-000017000002', 'b0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000005', now() - interval '7 days', now() - interval '7 days' + interval '4 hours', 240.00, 'completed', 'paid', '194820', now() - interval '7 days'),
  ('e0000000-0000-0000-0000-000017000003', 'b0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000006', now() - interval '1 days', now() - interval '1 days' + interval '2 hours', 120.00, 'completed', 'paid', '591028', now() - interval '1 days'),
  ('e0000000-0000-0000-0000-000018000001', 'b0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000001', now() - interval '9 days', now() - interval '9 days' + interval '3 hours', 105.00, 'completed', 'paid', '749102', now() - interval '9 days'),
  ('e0000000-0000-0000-0000-000018000002', 'b0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000002', now() - interval '3 days', now() - interval '3 days' + interval '4 hours', 140.00, 'completed', 'paid', '384910', now() - interval '3 days')
ON CONFLICT (id) DO UPDATE SET
  total_price = EXCLUDED.total_price,
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status;

-- ------------------------------------------------------------------------------
-- 6. REVIEWS (Ratings 4-5)
-- ------------------------------------------------------------------------------
INSERT INTO public.reviews (
  id,
  booking_id,
  space_id,
  driver_id,
  rating,
  comment,
  created_at
)
VALUES
  ('f0000000-0000-0000-0000-000001000001', 'e0000000-0000-0000-0000-000001000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 5, 'Super convenient right next to Pari Chowk Metro. Shaded bay kept the car cool despite the afternoon heat. Host was very communicative.', now() - interval '6 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000001000002', 'e0000000-0000-0000-0000-000001000002', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 5, 'Great security cameras and clear markings. Parked my Honda City without any hassle. Will definitely book again when taking the metro.', now() - interval '4 days' + interval '2 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000001000003', 'e0000000-0000-0000-0000-000001000003', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 4, 'Clean, paved surface and easy check-in via OTP. Saved me 20 minutes circling near the chowk during peak morning traffic.', now() - interval '2 days' + interval '4 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000002000001', 'e0000000-0000-0000-0000-000002000001', 'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 5, 'Attended Elecrama at India Expo Centre. Having this spot pre-booked saved immense frustration. Walked straight in through Gate 3!', now() - interval '10 days' + interval '6 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000002000002', 'e0000000-0000-0000-0000-000002000002', 'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 5, 'Security guard on duty was attentive and checked my ParKit booking code immediately. Broad bay made parking my Safari effortless.', now() - interval '7 days' + interval '5 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000002000003', 'e0000000-0000-0000-0000-000002000003', 'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006', 4, 'Very close to Expo Mart halls. Reasonable ₹60/hr price compared to event valet chaos. Seamless exit.', now() - interval '3 days' + interval '4 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000003000001', 'e0000000-0000-0000-0000-000003000001', 'b0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 5, 'Visited GL Bajaj for an academic conference. Highly safe driveway inside a quiet residential boundary. Friendly owner.', now() - interval '12 days' + interval '4 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000003000002', 'e0000000-0000-0000-0000-000003000002', 'b0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 4, 'Excellent spot in Knowledge Park III. Affordable ₹30/hr rate for students and parents on campus visits.', now() - interval '5 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000003000003', 'e0000000-0000-0000-0000-000003000003', 'b0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 5, 'Host Amit guided me to the exact gate. Clean paved surface, no debris or low branches.', now() - interval '1 days' + interval '5 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000004000001', 'e0000000-0000-0000-0000-000004000001', 'b0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 5, 'Alpha 1 market parking is usually a headache on weekdays. This spot was reserved and waiting for me. 5 stars!', now() - interval '8 days' + interval '2 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000004000002', 'e0000000-0000-0000-0000-000004000002', 'b0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005', 4, 'Easy to locate via Google Maps. Safe neighborhood with plenty of street lighting in the evening.', now() - interval '3 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000005000001', 'e0000000-0000-0000-0000-000005000001', 'b0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000006', 5, 'Anyone who shops at Jagat Farm knows parking is almost impossible on weekends. This spot is a lifesaver!', now() - interval '9 days' + interval '2 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000005000002', 'e0000000-0000-0000-0000-000005000002', 'b0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 4, 'Well managed by the host. Quick QR scan and I was on my way into the market.', now() - interval '4 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000005000003', 'e0000000-0000-0000-0000-000005000003', 'b0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 5, 'Peace of mind knowing my car was parked behind a secure perimeter instead of congested curbside.', now() - interval '2 days' + interval '2 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000006000001', 'e0000000-0000-0000-0000-000006000001', 'b0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 5, 'Exceptional facility. Covered canopy shielded my car completely. The EV trickle charging plug worked perfectly.', now() - interval '14 days' + interval '4 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000006000002', 'e0000000-0000-0000-0000-000006000002', 'b0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000004', 5, 'Top-notch security at Jaypee Greens gate. Guard verified my ParKit reservation immediately. Worth every rupee.', now() - interval '6 days' + interval '5 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000007000001', 'e0000000-0000-0000-0000-000007000001', 'b0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000005', 5, 'Had a medical consultation at Sharda Hospital. This spot is right opposite Gate 2. Hassle-free and polite owner.', now() - interval '11 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000007000002', 'e0000000-0000-0000-0000-000007000002', 'b0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000006', 4, 'Spacious enough for an SUV. Good street illumination after dark. Will use again.', now() - interval '4 days' + interval '4 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000007000003', 'e0000000-0000-0000-0000-000007000003', 'b0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', 5, 'Quick booking confirmation and accurate GPS directions on the map.', now() - interval '1 days' + interval '2 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000008000001', 'e0000000-0000-0000-0000-000008000001', 'b0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000002', 5, 'Parked here during school annual day at Ryan International. Completely avoided the chaotic roadside rush.', now() - interval '13 days' + interval '2 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000008000002', 'e0000000-0000-0000-0000-000008000002', 'b0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', 4, 'Only ₹25/hr in Sector Beta 2! Peaceful residential road with ample turning room.', now() - interval '6 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000009000001', 'e0000000-0000-0000-0000-000009000001', 'b0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000004', 4, 'Convenient slot right by the commercial block in Gamma 2. Host Priya was very helpful.', now() - interval '15 days' + interval '2 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000009000002', 'e0000000-0000-0000-0000-000009000002', 'b0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000005', 5, 'Clean asphalt and easy drive-in access. Much safer than leaving the car on the main highway.', now() - interval '7 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000010000001', 'e0000000-0000-0000-0000-000010000001', 'b0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000006', 5, 'I park here daily before boarding the Aqua Line to Sector 51 Noida. Secure, reliable, and minutes from the turnstile.', now() - interval '8 days' + interval '8 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000010000002', 'e0000000-0000-0000-0000-000010000002', 'b0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000001', 5, 'Gated driveway with an attentive family host. Zero worries leaving my car for the entire workday.', now() - interval '3 days' + interval '6 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000010000003', 'e0000000-0000-0000-0000-000010000003', 'b0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000002', 4, 'Very close to Delta 1 metro station. Clear entrance and friendly communication.', now() - interval '1 days' + interval '4 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000011000001', 'e0000000-0000-0000-0000-000011000001', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000003', 5, 'Weekend parking at Gaur City Mall is usually jammed. Having a guaranteed basement slot made our family dinner stress-free.', now() - interval '12 days' + interval '4 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000011000002', 'e0000000-0000-0000-0000-000011000002', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000004', 4, 'Easy elevator connectivity up into the mall shops and cinema. Clean and well illuminated.', now() - interval '5 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000011000003', 'e0000000-0000-0000-0000-000011000003', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000005', 5, 'Smooth barrier entry with instant QR validation. A must for Greater Noida West residents!', now() - interval '2 days' + interval '5 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000012000001', 'e0000000-0000-0000-0000-000012000001', 'b0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000006', 5, 'Ideal for meetings in TechZone 4 near Ek Murti. Guard directed me straight into the reserved bay.', now() - interval '9 days' + interval '9 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000012000002', 'e0000000-0000-0000-0000-000012000002', 'b0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000001', 4, 'Fair rate of ₹40/hr for the tech park belt. Paved ground with clear stall borders.', now() - interval '4 days' + interval '8 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000013000001', 'e0000000-0000-0000-0000-000013000001', 'b0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000002', 5, 'Parked here while visiting family in Eldeco. Fully covered and protected from dusty winds.', now() - interval '16 days' + interval '4 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000013000002', 'e0000000-0000-0000-0000-000013000002', 'b0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000003', 4, 'Quiet and peaceful residential street. Host Amit was polite and responsive on chat.', now() - interval '6 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000014000001', 'e0000000-0000-0000-0000-000014000001', 'b0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000004', 5, 'Great spot right by Gautam Buddha University main gate. Saved me plenty of walking in the heat.', now() - interval '11 days' + interval '5 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000014000002', 'e0000000-0000-0000-0000-000014000002', 'b0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000005', 4, 'Smooth entry from the Yamuna Expressway service road. Reasonable ₹25/hr rate.', now() - interval '3 days' + interval '6 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000015000001', 'e0000000-0000-0000-0000-000015000001', 'b0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000006', 5, 'Attended an interstate tournament at the stadium. This spot saved us an hour of stadium traffic jam.', now() - interval '10 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000015000002', 'e0000000-0000-0000-0000-000015000002', 'b0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000001', 4, 'Spot is clearly marked with ParKit sign. Quick check-in and easy departure onto the ring road.', now() - interval '2 days' + interval '4 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000016000001', 'e0000000-0000-0000-0000-000016000001', 'b0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000002', 5, 'Court complex parking is notoriously crowded. Having this private bay right across the street was invaluable.', now() - interval '8 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000016000002', 'e0000000-0000-0000-0000-000016000002', 'b0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000003', 4, 'Clean, gated area with quick access back onto Surajpur Kasna road.', now() - interval '4 days' + interval '2 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000017000001', 'e0000000-0000-0000-0000-000017000001', 'b0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000004', 5, 'Walked right into Omaxe CP mall within 1 minute of stepping out of the car. Unbeatable location!', now() - interval '14 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000017000002', 'e0000000-0000-0000-0000-000017000002', 'b0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000005', 5, 'Very secure with dedicated CCTV camera trained on the bay. Worth every rupee for weekend dining.', now() - interval '7 days' + interval '4 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000017000003', 'e0000000-0000-0000-0000-000017000003', 'b0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000006', 4, 'Paved and neat. Host Sunita sent clear photo directions before arrival.', now() - interval '1 days' + interval '2 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000018000001', 'e0000000-0000-0000-0000-000018000001', 'b0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000001', 5, 'Quiet society enclave in Sector Zeta 1. Very secure guard at the boom barrier.', now() - interval '9 days' + interval '3 hours 15 minutes'),
  ('f0000000-0000-0000-0000-000018000002', 'e0000000-0000-0000-0000-000018000002', 'b0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000002', 4, 'Good shaded spot in the evening. Straightforward booking experience.', now() - interval '3 days' + interval '4 hours 15 minutes')
ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment;

COMMIT;
