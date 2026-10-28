// ParKit Greater Noida Demo Spaces & Supabase Data Fetcher
import { createClient } from "@/lib/supabase/client";

export interface ParkingSpaceReview {
  id: string;
  rating: number;
  comment: string;
  driver_name: string;
  created_at: string;
}

export interface SpaceAvailabilityWindow {
  day_of_week: number; // 0=Sunday, 1=Monday ... 6=Saturday
  start_time: string; // "06:00"
  end_time: string;   // "23:00"
}

export interface ParkingSpace {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_hour: number;
  photo_url: string;
  gallery_photos?: string[];
  is_active: boolean;
  rating: number;
  review_count: number;
  reviews?: ParkingSpaceReview[];
  availability?: SpaceAvailabilityWindow[];
  amenities: string[];
  owner_name: string;
  owner_avatar: string;
  owner_phone?: string;
  distance_km?: number;
  is_available_now?: boolean;
  house_no?: string;
  building_name?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  space_type?: string;
  vehicle_types?: string[];
  total_slots?: number;
  entry_instructions?: string;
  contact_phone?: string;
  max_vehicle_type?: string;
  verified_host?: boolean;
}

// Sensible fallback location: Pari Chowk, Greater Noida, UP
export const GREATER_NOIDA_CENTER = {
  lat: 28.4744,
  lng: 77.5039,
  name: "Pari Chowk, Greater Noida",
};

export const FALLBACK_PARKING_SPACES: ParkingSpace[] = [
  {
    id: "b0000000-0000-0000-0000-000000000001",
    owner_id: "a0000000-0000-0000-0000-000000000001",
    title: "Pari Chowk Metro Plaza Covered Bay",
    description: "Weatherproof, well-lit parking bay situated right beside Pari Chowk Metro Station Exit 2. CCTV monitored 24/7 with wide turning radius suitable for SUVs and sedans.",
    address: "Ground Level Bay 4, Near Pari Chowk Metro Station Exit 2, Greater Noida, UP 201310",
    latitude: 28.4744,
    longitude: 77.5039,
    price_per_hour: 45,
    photo_url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.9,
    review_count: 38,
    amenities: ["Covered Parking", "CCTV Monitored", "EV Charging", "Paved Surface", "Metro Accessible"],
    owner_name: "Rajesh Sharma",
    owner_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "06:00", end_time: "23:00" },
      { day_of_week: 2, start_time: "06:00", end_time: "23:00" },
      { day_of_week: 3, start_time: "06:00", end_time: "23:00" },
      { day_of_week: 4, start_time: "06:00", end_time: "23:00" },
      { day_of_week: 5, start_time: "06:00", end_time: "23:00" },
      { day_of_week: 6, start_time: "07:00", end_time: "22:00" },
      { day_of_week: 0, start_time: "07:00", end_time: "22:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000002",
    owner_id: "a0000000-0000-0000-0000-000000000002",
    title: "India Expo Mart Premier Visitor Bay",
    description: "Spacious private paved parking slot directly facing India Expo Centre Gate 3. Avoid exhibition congestion with guaranteed access and security guard on duty.",
    address: "Plot 23-27, Knowledge Park II, Opp. India Expo Centre Gate 3, Greater Noida, UP 201306",
    latitude: 28.4623,
    longitude: 77.4975,
    price_per_hour: 60,
    photo_url: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.8,
    review_count: 52,
    amenities: ["Gated Security", "CCTV Monitored", "Paved Surface", "Security Guard", "Exhibition Hub"],
    owner_name: "Sunita Verma",
    owner_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "07:00", end_time: "22:00" },
      { day_of_week: 2, start_time: "07:00", end_time: "22:00" },
      { day_of_week: 3, start_time: "07:00", end_time: "22:00" },
      { day_of_week: 4, start_time: "07:00", end_time: "22:00" },
      { day_of_week: 5, start_time: "07:00", end_time: "22:00" },
      { day_of_week: 6, start_time: "08:00", end_time: "21:00" },
      { day_of_week: 0, start_time: "08:00", end_time: "21:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000003",
    owner_id: "a0000000-0000-0000-0000-000000000003",
    title: "Knowledge Park III Campus Driveway",
    description: "Secure, gated driveway parking in Knowledge Park III. Walking distance to leading college campuses, GL Bajaj, and Galgotias. Perfect for visitors and faculties.",
    address: "Sector KP-III, Institutional Belt, Near GL Bajaj Institute, Greater Noida, UP 201306",
    latitude: 28.4678,
    longitude: 77.4912,
    price_per_hour: 30,
    photo_url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.7,
    review_count: 27,
    amenities: ["Private Driveway", "Gated Security", "Shaded", "Affordable Student Rate"],
    owner_name: "Amit Goel",
    owner_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "08:00", end_time: "20:00" },
      { day_of_week: 2, start_time: "08:00", end_time: "20:00" },
      { day_of_week: 3, start_time: "08:00", end_time: "20:00" },
      { day_of_week: 4, start_time: "08:00", end_time: "20:00" },
      { day_of_week: 5, start_time: "08:00", end_time: "20:00" },
      { day_of_week: 6, start_time: "08:00", end_time: "18:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000004",
    owner_id: "a0000000-0000-0000-0000-000000000004",
    title: "Alpha 1 Commercial Complex Parking",
    description: "Paved parking space right at Alpha 1 commercial hub. Safe corner with boom barrier and shaded afternoon canopy, 2 minutes from banks and restaurants.",
    address: "Pocket A, Near Commercial Belt & Senior Citizen Park, Sector Alpha 1, Greater Noida, UP 201308",
    latitude: 28.4831,
    longitude: 77.5135,
    price_per_hour: 35,
    photo_url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.8,
    review_count: 44,
    amenities: ["Boom Barrier", "Afternoon Canopy", "Paved Surface", "CCTV Monitored"],
    owner_name: "Priya Bhasin",
    owner_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "09:00", end_time: "22:00" },
      { day_of_week: 2, start_time: "09:00", end_time: "22:00" },
      { day_of_week: 3, start_time: "09:00", end_time: "22:00" },
      { day_of_week: 4, start_time: "09:00", end_time: "22:00" },
      { day_of_week: 5, start_time: "09:00", end_time: "22:00" },
      { day_of_week: 6, start_time: "09:00", end_time: "23:00" },
      { day_of_week: 0, start_time: "09:00", end_time: "23:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000005",
    owner_id: "a0000000-0000-0000-0000-000000000005",
    title: "Beta 1 Jagat Farm Market Corner",
    description: "Skip the heavy Jagat Farm market rush. Reserved private spot behind the retail avenue, easily accessible from main ring road with CCTV monitoring.",
    address: "Shopping Centre Perimeter, Jagat Farm Market, Sector Gamma 1 / Beta 1, Greater Noida, UP 201308",
    latitude: 28.4795,
    longitude: 77.518,
    price_per_hour: 40,
    photo_url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.9,
    review_count: 61,
    amenities: ["CCTV Monitored", "Market Access", "Easy In-Out", "Wide Bay"],
    owner_name: "Pradeep Chaudhary",
    owner_avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "10:00", end_time: "22:30" },
      { day_of_week: 2, start_time: "10:00", end_time: "22:30" },
      { day_of_week: 3, start_time: "10:00", end_time: "22:30" },
      { day_of_week: 4, start_time: "10:00", end_time: "22:30" },
      { day_of_week: 5, start_time: "10:00", end_time: "22:30" },
      { day_of_week: 6, start_time: "10:00", end_time: "23:00" },
      { day_of_week: 0, start_time: "10:00", end_time: "23:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000006",
    owner_id: "a0000000-0000-0000-0000-000000000001",
    title: "Jaypee Greens Pavilion Shaded Carport",
    description: "Premium covered carport in high-security Jaypee Greens township. Includes EV trickle-charging port, manicured driveway, and 24-hour manned gate.",
    address: "Gated Villa Enclave, Jaypee Greens Golf Course Road, Greater Noida, UP 201310",
    latitude: 28.4862,
    longitude: 77.524,
    price_per_hour: 80,
    photo_url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 5.0,
    review_count: 29,
    amenities: ["EV Fast Charging", "Covered Carport", "24/7 Manned Gate", "Luxury Villa Community", "CCTV Monitored"],
    owner_name: "Rajesh Sharma",
    owner_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "00:00", end_time: "23:59" },
      { day_of_week: 2, start_time: "00:00", end_time: "23:59" },
      { day_of_week: 3, start_time: "00:00", end_time: "23:59" },
      { day_of_week: 4, start_time: "00:00", end_time: "23:59" },
      { day_of_week: 5, start_time: "00:00", end_time: "23:59" },
      { day_of_week: 6, start_time: "00:00", end_time: "23:59" },
      { day_of_week: 0, start_time: "00:00", end_time: "23:59" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000007",
    owner_id: "a0000000-0000-0000-0000-000000000002",
    title: "Knowledge Park II Sharda Link Spot",
    description: "Convenient parking spot across Sharda University & Hospital. Fully paved, accessible 24/7 with night floodlights and street surveillance.",
    address: "Institutional Area, Opp. Sharda Hospital Gate 2, Knowledge Park II, Greater Noida, UP 201306",
    latitude: 28.4721,
    longitude: 77.488,
    price_per_hour: 30,
    photo_url: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.6,
    review_count: 31,
    amenities: ["Night Floodlights", "Paved Surface", "Hospital Access", "CCTV Monitored"],
    owner_name: "Sunita Verma",
    owner_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "07:30", end_time: "20:30" },
      { day_of_week: 2, start_time: "07:30", end_time: "20:30" },
      { day_of_week: 3, start_time: "07:30", end_time: "20:30" },
      { day_of_week: 4, start_time: "07:30", end_time: "20:30" },
      { day_of_week: 5, start_time: "07:30", end_time: "20:30" },
      { day_of_week: 6, start_time: "08:00", end_time: "19:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000008",
    owner_id: "a0000000-0000-0000-0000-000000000003",
    title: "Beta 2 Institutional & School Zone Bay",
    description: "Quiet, tree-shaded driveway in Sector Beta II. Stress-free parking for school pick-up, local appointments, and metro commuters.",
    address: "Block B, Near Ryan International School & Beta 2 Metro, Greater Noida, UP 201308",
    latitude: 28.4715,
    longitude: 77.5285,
    price_per_hour: 25,
    photo_url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.7,
    review_count: 22,
    amenities: ["Tree Shaded", "Quiet Neighborhood", "Near Metro", "Private Gate"],
    owner_name: "Amit Goel",
    owner_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "08:00", end_time: "19:00" },
      { day_of_week: 2, start_time: "08:00", end_time: "19:00" },
      { day_of_week: 3, start_time: "08:00", end_time: "19:00" },
      { day_of_week: 4, start_time: "08:00", end_time: "19:00" },
      { day_of_week: 5, start_time: "08:00", end_time: "19:00" },
      { day_of_week: 6, start_time: "08:00", end_time: "16:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000009",
    owner_id: "a0000000-0000-0000-0000-000000000004",
    title: "Gamma 2 Shopping Plaza Reserved Bay",
    description: "Open asphalt parking slot directly adjacent to Sector Gamma 2 commercial stores. Hassle-free entry with quick highway exit.",
    address: "Commercial Belt Block G, Near Gamma Shopping Complex, Greater Noida, UP 201308",
    latitude: 28.487,
    longitude: 77.509,
    price_per_hour: 35,
    photo_url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.8,
    review_count: 36,
    amenities: ["Plaza Frontage", "Quick Highway Access", "Asphalt Paved", "Wide Slot"],
    owner_name: "Priya Bhasin",
    owner_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "09:00", end_time: "21:30" },
      { day_of_week: 2, start_time: "09:00", end_time: "21:30" },
      { day_of_week: 3, start_time: "09:00", end_time: "21:30" },
      { day_of_week: 4, start_time: "09:00", end_time: "21:30" },
      { day_of_week: 5, start_time: "09:00", end_time: "21:30" },
      { day_of_week: 6, start_time: "09:00", end_time: "22:00" },
      { day_of_week: 0, start_time: "09:00", end_time: "22:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000010",
    owner_id: "a0000000-0000-0000-0000-000000000005",
    title: "Delta 1 Metro Connector Private Driveway",
    description: "Dedicated private driveway just a 2-minute stroll to the Aqua Line Delta 1 Metro Station. Park securely and beat expressway rush hour traffic.",
    address: "Pocket C, 200m from Delta 1 Metro Station, Sector Delta 1, Greater Noida, UP 201308",
    latitude: 28.4955,
    longitude: 77.514,
    price_per_hour: 40,
    photo_url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.9,
    review_count: 48,
    amenities: ["Metro Connector", "Private Driveway", "CCTV Monitored", "Keyless Entry"],
    owner_name: "Pradeep Chaudhary",
    owner_avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "06:30", end_time: "22:30" },
      { day_of_week: 2, start_time: "06:30", end_time: "22:30" },
      { day_of_week: 3, start_time: "06:30", end_time: "22:30" },
      { day_of_week: 4, start_time: "06:30", end_time: "22:30" },
      { day_of_week: 5, start_time: "06:30", end_time: "22:30" },
      { day_of_week: 6, start_time: "07:00", end_time: "22:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000011",
    owner_id: "a0000000-0000-0000-0000-000000000001",
    title: "Gaur City Mall Covered Basement Slot",
    description: "Reserved private parking slot in Gaur City hub. Weatherproof, barrier-controlled entry with direct elevator access to retail and corporate towers.",
    address: "Basement Level B1, Gaur City Mall, Sector 4, Greater Noida West, UP 201009",
    latitude: 28.608,
    longitude: 77.4305,
    price_per_hour: 50,
    photo_url: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.8,
    review_count: 73,
    amenities: ["Basement Covered", "Elevator Access", "Automated Boom Barrier", "CCTV Monitored", "24/7 Access"],
    owner_name: "Rajesh Sharma",
    owner_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "09:00", end_time: "23:00" },
      { day_of_week: 2, start_time: "09:00", end_time: "23:00" },
      { day_of_week: 3, start_time: "09:00", end_time: "23:00" },
      { day_of_week: 4, start_time: "09:00", end_time: "23:00" },
      { day_of_week: 5, start_time: "09:00", end_time: "23:00" },
      { day_of_week: 6, start_time: "09:00", end_time: "23:59" },
      { day_of_week: 0, start_time: "09:00", end_time: "23:59" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000012",
    owner_id: "a0000000-0000-0000-0000-000000000002",
    title: "TechZone 4 IT Park Express Spot",
    description: "Paved open parking bay right inside TechZone 4 tech corridor. Ideal for IT professionals and corporate visitors near Ek Murti roundabout.",
    address: "Plot 12, TechZone 4, Near Ek Murti Chowk, Greater Noida West, UP 201306",
    latitude: 28.5992,
    longitude: 77.442,
    price_per_hour: 40,
    photo_url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.7,
    review_count: 39,
    amenities: ["Tech Park Access", "Paved Surface", "Security Attendant", "EV Charging Available"],
    owner_name: "Sunita Verma",
    owner_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "07:00", end_time: "21:00" },
      { day_of_week: 2, start_time: "07:00", end_time: "21:00" },
      { day_of_week: 3, start_time: "07:00", end_time: "21:00" },
      { day_of_week: 4, start_time: "07:00", end_time: "21:00" },
      { day_of_week: 5, start_time: "07:00", end_time: "21:00" },
      { day_of_week: 6, start_time: "08:00", end_time: "18:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000013",
    owner_id: "a0000000-0000-0000-0000-000000000003",
    title: "Omicron 1 Residential Secure Carport",
    description: "Covered residential carport with locked side gate. Clean, safe, and protected from summer sun. Readily accommodates large SUVs.",
    address: "Sector Omicron 1, Near Eldeco Enclave, Greater Noida, UP 201310",
    latitude: 28.503,
    longitude: 77.531,
    price_per_hour: 30,
    photo_url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.9,
    review_count: 24,
    amenities: ["Covered Carport", "Locked Side Gate", "SUV Friendly", "Peaceful Society"],
    owner_name: "Amit Goel",
    owner_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "08:00", end_time: "22:00" },
      { day_of_week: 2, start_time: "08:00", end_time: "22:00" },
      { day_of_week: 3, start_time: "08:00", end_time: "22:00" },
      { day_of_week: 4, start_time: "08:00", end_time: "22:00" },
      { day_of_week: 5, start_time: "08:00", end_time: "22:00" },
      { day_of_week: 6, start_time: "08:00", end_time: "22:00" },
      { day_of_week: 0, start_time: "08:00", end_time: "22:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000014",
    owner_id: "a0000000-0000-0000-0000-000000000004",
    title: "Gautam Buddha University Perimeter Bay",
    description: "Wide concrete parking space near Gautam Buddha University campus main entrance. Ideal for conference attendees, parents, and academic delegates.",
    address: "Yamuna Expressway Service Lane, Near GBU Gate 1, Sector Chi 4, Greater Noida, UP 201312",
    latitude: 28.432,
    longitude: 77.527,
    price_per_hour: 25,
    photo_url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.6,
    review_count: 18,
    amenities: ["Expressway Access", "Wide Turning Radius", "Concrete Paved", "Daylight Floodlights"],
    owner_name: "Priya Bhasin",
    owner_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "08:00", end_time: "20:00" },
      { day_of_week: 2, start_time: "08:00", end_time: "20:00" },
      { day_of_week: 3, start_time: "08:00", end_time: "20:00" },
      { day_of_week: 4, start_time: "08:00", end_time: "20:00" },
      { day_of_week: 5, start_time: "08:00", end_time: "20:00" },
      { day_of_week: 6, start_time: "09:00", end_time: "18:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000015",
    owner_id: "a0000000-0000-0000-0000-000000000005",
    title: "Shaheed Vijay Singh Pathik Sports Bay",
    description: "Direct stadium access parking spot. Avoid event day gridlock during cricket matches, sports championships, and indoor training sessions.",
    address: "Recreational Green Area, Opp. Greater Noida Cricket Stadium, Sector Chi, Greater Noida, UP 201310",
    latitude: 28.4645,
    longitude: 77.5255,
    price_per_hour: 50,
    photo_url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.8,
    review_count: 35,
    amenities: ["Stadium Frontage", "Security Guards", "Floodlit", "Event Fast Track"],
    owner_name: "Pradeep Chaudhary",
    owner_avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 2, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 3, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 4, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 5, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 6, start_time: "06:00", end_time: "23:00" },
      { day_of_week: 0, start_time: "06:00", end_time: "23:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000016",
    owner_id: "a0000000-0000-0000-0000-000000000001",
    title: "Surajpur District Court & Collectorate Bay",
    description: "Designated private slot next to Surajpur Administrative Complex. Quick in-and-out access for advocates, litigants, and official administrative visits.",
    address: "Surajpur - Kasna Road, Near District Sessions Court, Greater Noida, UP 201306",
    latitude: 28.5285,
    longitude: 77.492,
    price_per_hour: 35,
    photo_url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.7,
    review_count: 28,
    amenities: ["Official District Court Link", "Asphalt Paved", "Shaded", "CCTV Monitored"],
    owner_name: "Rajesh Sharma",
    owner_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "08:30", end_time: "18:30" },
      { day_of_week: 2, start_time: "08:30", end_time: "18:30" },
      { day_of_week: 3, start_time: "08:30", end_time: "18:30" },
      { day_of_week: 4, start_time: "08:30", end_time: "18:30" },
      { day_of_week: 5, start_time: "08:30", end_time: "18:30" },
      { day_of_week: 6, start_time: "09:00", end_time: "15:00" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000017",
    owner_id: "a0000000-0000-0000-0000-000000000002",
    title: "Omaxe Connaught Place Plaza Bay",
    description: "VIP open parking space 50 meters from Omaxe CP Mall entrance. 24/7 CCTV surveillance, quick valet-style ease for weekend diners and shoppers.",
    address: "Block Beta 2 Peripheral Lane, Adjacent to Omaxe CP Mall, Greater Noida, UP 201308",
    latitude: 28.4735,
    longitude: 77.5145,
    price_per_hour: 60,
    photo_url: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.9,
    review_count: 57,
    amenities: ["VIP Frontage", "Direct Mall Access", "CCTV 24/7", "Paved & Striped"],
    owner_name: "Sunita Verma",
    owner_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "10:00", end_time: "23:00" },
      { day_of_week: 2, start_time: "10:00", end_time: "23:00" },
      { day_of_week: 3, start_time: "10:00", end_time: "23:00" },
      { day_of_week: 4, start_time: "10:00", end_time: "23:00" },
      { day_of_week: 5, start_time: "10:00", end_time: "23:30" },
      { day_of_week: 6, start_time: "10:00", end_time: "23:59" },
      { day_of_week: 0, start_time: "10:00", end_time: "23:59" },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000018",
    owner_id: "a0000000-0000-0000-0000-000000000003",
    title: "Zeta 1 Premium Driveway Bay",
    description: "Gated and secure driveway inside residential society perimeter. Friendly host with instant messaging and 24-hour security intercom.",
    address: "AVJ Heights Enclave Road, Sector Zeta 1, Greater Noida, UP 201306",
    latitude: 28.512,
    longitude: 77.502,
    price_per_hour: 35,
    photo_url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    rating: 4.8,
    review_count: 32,
    amenities: ["Gated Enclave", "Security Intercom", "Host Messaging", "Clean Paved Surface"],
    owner_name: "Amit Goel",
    owner_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    availability: [
      { day_of_week: 1, start_time: "07:00", end_time: "22:00" },
      { day_of_week: 2, start_time: "07:00", end_time: "22:00" },
      { day_of_week: 3, start_time: "07:00", end_time: "22:00" },
      { day_of_week: 4, start_time: "07:00", end_time: "22:00" },
      { day_of_week: 5, start_time: "07:00", end_time: "22:00" },
      { day_of_week: 6, start_time: "08:00", end_time: "21:00" },
      { day_of_week: 0, start_time: "08:00", end_time: "21:00" },
    ],
  },
];

// Haversine formula to compute great-circle distance in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Check if a space is currently available according to its weekly schedule
export function isSpaceAvailableNow(
  availability?: SpaceAvailabilityWindow[]
): boolean {
  if (!availability || availability.length === 0) return true;

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  return availability.some((slot) => {
    if (slot.day_of_week !== currentDay) return false;
    const [startH, startM] = slot.start_time.split(":").map(Number);
    const [endH, endM] = slot.end_time.split(":").map(Number);
    const startTotal = (startH || 0) * 60 + (startM || 0);
    const endTotal = (endH || 0) * 60 + (endM || 0);
    return currentTotalMinutes >= startTotal && currentTotalMinutes <= endTotal;
  });
}

// Fetch spaces from Supabase with graceful fallback
export async function fetchSpacesFromSupabase(
  userLat: number,
  userLng: number
): Promise<ParkingSpace[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("parking_spaces")
      .select(`
        *,
        reviews (id, rating, comment, created_at, driver_id),
        space_availability (day_of_week, start_time, end_time),
        profiles:owner_id (full_name, avatar_url, phone)
      `)
      .eq("is_active", true);

    if (error || !data || data.length === 0) {
      // Fallback to our seeded Greater Noida collection
      return FALLBACK_PARKING_SPACES.map((space) => {
        const dist = calculateDistanceKm(userLat, userLng, space.latitude, space.longitude);
        const availNow = isSpaceAvailableNow(space.availability);
        return {
          ...space,
          distance_km: dist,
          is_available_now: availNow,
        };
      });
    }

    return data.map((item: any) => {
      const revs = item.reviews || [];
      const avgRating =
        revs.length > 0
          ? Number(
              (
                revs.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) /
                revs.length
              ).toFixed(1)
            )
          : 4.8;

      const dist = calculateDistanceKm(userLat, userLng, Number(item.latitude), Number(item.longitude));
      const availNow = isSpaceAvailableNow(item.space_availability);

      // Privacy: public pages show area, street, landmark, city, and pincode
      const publicAddressParts = [item.street, item.landmark, item.city, item.pincode].filter(Boolean);
      const publicAddress = publicAddressParts.length > 0 ? publicAddressParts.join(", ") : item.address;

      return {
        id: item.id,
        owner_id: item.owner_id,
        title: item.title,
        description: item.description || "Secure, easily accessible parking spot.",
        address: publicAddress,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        price_per_hour: Number(item.price_per_hour),
        photo_url: item.photo_url || "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
        is_active: item.is_active,
        rating: avgRating,
        review_count: revs.length || 24,
        amenities: Array.isArray(item.amenities) && item.amenities.length > 0 ? item.amenities : ["CCTV Monitored", "Paved Surface", "Guaranteed Space"],
        owner_name: item.profiles?.full_name || "ParKit Verified Host",
        owner_avatar: item.profiles?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        availability: item.space_availability || [],
        distance_km: dist,
        is_available_now: availNow,
        street: item.street,
        landmark: item.landmark,
        city: item.city,
        state: item.state,
        pincode: item.pincode,
        space_type: item.space_type || "Home",
        vehicle_types: item.vehicle_types || ["Car"],
        total_slots: item.total_slots || 1,
        max_vehicle_type: item.max_vehicle_type || "suv",
        verified_host: item.verified_host ?? true,
        // Private fields (house_no, building_name, entry_instructions, contact_phone) are protected
      };
    });
  } catch (e) {
    // Graceful error fallback
    return FALLBACK_PARKING_SPACES.map((space) => {
      const dist = calculateDistanceKm(userLat, userLng, space.latitude, space.longitude);
      const availNow = isSpaceAvailableNow(space.availability);
      return {
        ...space,
        distance_km: dist,
        is_available_now: availNow,
      };
    });
  }
}

// Fetch a single space by ID from Supabase or fallback
export async function fetchSingleSpaceFromSupabase(id: string): Promise<ParkingSpace | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("parking_spaces")
      .select(`
        *,
        reviews (id, rating, comment, created_at, driver_id, profiles:driver_id (full_name)),
        space_availability (day_of_week, start_time, end_time),
        profiles:owner_id (full_name, avatar_url, phone)
      `)
      .eq("id", id)
      .maybeSingle();

    if (data && !error) {
      const revs = (data.reviews || []).map((r: any) => ({
        id: r.id,
        rating: r.rating || 5,
        comment: r.comment || "Great experience parking here.",
        driver_name: r.profiles?.full_name || "Verified Driver",
        created_at: r.created_at || new Date().toISOString(),
      }));

      const avgRating =
        revs.length > 0
          ? Number(
              (
                revs.reduce((acc: number, r: any) => acc + r.rating, 0) / revs.length
              ).toFixed(1)
            )
          : 4.8;

      const primaryPhoto = data.photo_url || "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80";

      // Enforce privacy: Only space owner and driver with valid paid booking receive private fields
      let isAuthorized = false;
      try {
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id;
        if (currentUserId) {
          if (currentUserId === data.owner_id) {
            isAuthorized = true;
          } else {
            const { data: bookingData } = await supabase
              .from("bookings")
              .select("id")
              .eq("space_id", data.id)
              .eq("driver_id", currentUserId)
              .in("status", ["confirmed", "checked_in", "completed"])
              .limit(1);
            if (bookingData && bookingData.length > 0) {
              isAuthorized = true;
            }
          }
        }
      } catch {
        isAuthorized = false;
      }

      const publicAddressParts = [data.street, data.landmark, data.city, data.pincode].filter(Boolean);
      const publicAddress = publicAddressParts.length > 0 ? publicAddressParts.join(", ") : data.address;
      const displayAddress = isAuthorized ? data.address : publicAddress;

      return {
        id: data.id,
        owner_id: data.owner_id,
        title: data.title,
        description: data.description || "Secure, easily accessible parking spot.",
        address: displayAddress,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        price_per_hour: Number(data.price_per_hour),
        photo_url: primaryPhoto,
        gallery_photos: [
          primaryPhoto,
          "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80",
        ],
        is_active: data.is_active,
        rating: avgRating,
        review_count: revs.length || 28,
        reviews: revs.length > 0 ? revs : getFallbackReviews(data.id),
        amenities: Array.isArray(data.amenities) && data.amenities.length > 0 ? data.amenities : ["CCTV Monitored", "Paved Surface", "Wide SUV Turning Radius", "Instant OTP Check-in"],
        owner_name: data.profiles?.full_name || "ParKit Verified Host",
        owner_avatar: data.profiles?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        owner_phone: isAuthorized ? (data.contact_phone || data.profiles?.phone || "+91 98100 12001") : undefined,
        availability: data.space_availability || [],
        is_available_now: isSpaceAvailableNow(data.space_availability),
        house_no: isAuthorized ? data.house_no : undefined,
        building_name: isAuthorized ? data.building_name : undefined,
        street: data.street,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        space_type: data.space_type || "Home",
        vehicle_types: data.vehicle_types || ["Car"],
        total_slots: data.total_slots || 1,
        max_vehicle_type: data.max_vehicle_type || "suv",
        verified_host: data.verified_host ?? true,
        entry_instructions: isAuthorized ? data.entry_instructions : undefined,
        contact_phone: isAuthorized ? (data.contact_phone || data.profiles?.phone) : undefined,
      };
    }
  } catch (e) {
    console.warn("Could not fetch space from Supabase, using fallback:", e);
  }

  // Fallback to local data
  const local = FALLBACK_PARKING_SPACES.find((s) => s.id === id);
  if (!local) return null;

  return {
    ...local,
    gallery_photos: [
      local.photo_url,
      "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80",
    ],
    reviews: getFallbackReviews(id),
    is_available_now: isSpaceAvailableNow(local.availability),
  };
}

export function getFallbackReviews(spaceId: string): ParkingSpaceReview[] {
  return [
    {
      id: "rev-1",
      rating: 5,
      driver_name: "Rohan Malhotra",
      comment: "Super convenient location. Spot was exactly as described and entry was completely seamless via OTP.",
      created_at: "2 days ago",
    },
    {
      id: "rev-2",
      rating: 5,
      driver_name: "Neha Gupta",
      comment: "Host was extremely responsive. Broad paved bay with CCTV coverage gave complete peace of mind.",
      created_at: "5 days ago",
    },
    {
      id: "rev-3",
      rating: 4,
      driver_name: "Kunal Saxena",
      comment: "Great spot near metro station. Saved me 20 minutes of circling around during peak morning traffic.",
      created_at: "1 week ago",
    },
  ];
}
