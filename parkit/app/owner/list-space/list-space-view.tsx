"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Car,
  MapPin,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  Calendar,
  IndianRupee,
  Camera,
  Image as ImageIcon,
  Check,
  Info,
  Search,
  Lock,
  Phone,
  Building,
  Navigation2,
  X,
  Compass,
} from "lucide-react";

import {
  HostVerificationModal,
  HostVerificationSecurityDetails,
} from "@/components/verification/host-verification-modal";

// Dynamic import of Leaflet map (client-side only with no SSR)
const LocationPickerMap = dynamic(
  () => import("@/components/location-picker-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] w-full items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#2FD08A]" />
          <span>Loading OpenStreetMap engine...</span>
        </div>
      </div>
    ),
  }
);

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string;
  endTime: string;
}

interface GeocodeSuggestion {
  id: string;
  label: string;
  lat: number;
  lon: number;
  houseNumber?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  // Aliases for compatibility
  latitude?: number;
  longitude?: number;
  name?: string;
  house_number?: string;
  formatted_address?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const SPACE_TYPES = [
  "Home",
  "Office",
  "Shop",
  "Banquet hall",
  "Coaching institute",
  "Other",
] as const;

const VEHICLE_OPTIONS = [
  { id: "Bike", label: "Two-Wheeler / Bike", icon: "🏍️" },
  { id: "Car", label: "Car (Hatchback / Sedan)", icon: "🚗" },
  { id: "SUV", label: "Full-Size SUV", icon: "🚙" },
];

const AMENITY_OPTIONS = [
  { id: "cctv", label: "24/7 CCTV", icon: "📹" },
  { id: "covered", label: "Covered Parking", icon: "🏠" },
  { id: "ev_charging", label: "EV Charging Bay", icon: "⚡" },
  { id: "security_guard", label: "Gated Guard", icon: "👮" },
  { id: "instant_booking", label: "Instant OTP Entry", icon: "🔑" },
  { id: "wheelchair", label: "Ground Floor Access", icon: "♿" },
];

const CURATED_PHOTO_PRESETS = [
  {
    id: "gated-driveway",
    title: "Gated Residential Driveway",
    subtitle: "Paved, secure, easy pull-in",
    url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "covered-carport",
    title: "Covered Carport / Garage",
    subtitle: "Weatherproof shade bay",
    url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "commercial-bay",
    title: "Commercial Multi-level Bay",
    subtitle: "24/7 Security & Access",
    url: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "open-paved",
    title: "Open Paved Private Bay",
    subtitle: "Quick in-and-out access",
    url: "https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function ListSpaceView() {
  const router = useRouter();
  const supabase = createClient();
  const isMountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const justSelectedRef = useRef(false);

  // Stepper State (5 Steps)
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<{
    message: string;
    code?: string;
    details?: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  // STEP 1: Location & Detailed Address
  // Initialise searchQuery strictly to "" (Fix #1)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const [isReverseLoading, setIsReverseLoading] = useState(false);

  // Map coordinates (Default to Greater Noida NCR 28.4744, 77.5039)
  const [latitude, setLatitude] = useState(28.4744);
  const [longitude, setLongitude] = useState(77.5039);

  // Detailed Address Fields (Amazon / Flipkart standard)
  const [houseNo, setHouseNo] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Greater Noida");
  const [state, setState] = useState("Uttar Pradesh");
  const [pincode, setPincode] = useState("201310");

  // STEP 2: Space Details & Rules
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [spaceType, setSpaceType] = useState<string>("Home");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(["Car"]);
  const [totalSlots, setTotalSlots] = useState<number>(1);
  const [entryInstructions, setEntryInstructions] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "cctv",
    "instant_booking",
  ]);

  // STEP 3: Pricing & Photos
  const [pricePerHour, setPricePerHour] = useState("60"); // in INR
  const [photoUrl, setPhotoUrl] = useState(CURATED_PHOTO_PRESETS[0].url);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // STEP 4: Weekly Availability Slots
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([
    { id: "slot-1", dayOfWeek: 1, startTime: "08:00", endTime: "21:00" },
    { id: "slot-2", dayOfWeek: 2, startTime: "08:00", endTime: "21:00" },
    { id: "slot-3", dayOfWeek: 3, startTime: "08:00", endTime: "21:00" },
    { id: "slot-4", dayOfWeek: 4, startTime: "08:00", endTime: "21:00" },
    { id: "slot-5", dayOfWeek: 5, startTime: "08:00", endTime: "21:00" },
    { id: "slot-6", dayOfWeek: 6, startTime: "09:00", endTime: "22:00" },
    { id: "slot-7", dayOfWeek: 0, startTime: "09:00", endTime: "22:00" },
  ]);

  // Track mount status for unmount safety
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Safe string setter for searchQuery
  const updateSearchQuery = (val: string | undefined | null) => {
    setSearchQuery(val ?? "");
    setSearchError(null);
  };

  // Demo Host Verification State
  const [hostStatus, setHostStatus] = useState<string>("unverified");
  const [verifiedMaxVehicle, setVerifiedMaxVehicle] = useState<string>("suv");
  const [verifiedSecurityDetails, setVerifiedSecurityDetails] =
    useState<HostVerificationSecurityDetails | null>(null);
  const [showHostVerifyModal, setShowHostVerifyModal] = useState<boolean>(false);

  // Check auth session on load
  useEffect(() => {
    async function checkAuth() {
      if (isSupabaseConfigured()) {
        try {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();

          if (authUser && isMountedRef.current) {
            setUser(authUser);
            if (authUser.phone && !contactPhone) {
              const raw = authUser.phone.replace(/\D/g, "").slice(-10);
              setContactPhone(raw ?? "");
            }

            // Check host verification status
            try {
              const res = await fetch("/api/verify/status");
              if (res.ok) {
                const statusData = await res.json();
                if (statusData.profile?.host_status) {
                  setHostStatus(statusData.profile.host_status);
                }
              }
            } catch (vErr) {
              console.warn("Could not fetch verification status:", vErr);
            }
          }
        } catch (err) {
          console.warn("Auth check error in ListSpace:", err);
        }
      }
    }
    checkAuth();
  }, [supabase]);

  // Handle outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // PART 2: Debounced Photon Autocomplete with AbortController and justSelected guard
  useEffect(() => {
    // If just selected a suggestion, skip re-triggering search
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    const trimmed = (searchQuery ?? "").trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    // Abort previous in-flight request on new keystroke
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      if (!isMountedRef.current) return;
      setIsSearching(true);
      setSearchError(null);

      try {
        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(trimmed)}&lat=28.4744&lon=77.5039`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (controller.signal.aborted || !isMountedRef.current) return;
          setSearchError(errData.error || "Address suggestions temporarily unavailable.");
          setSuggestions([]);
          setShowSuggestions(true);
          return;
        }

        const data = await res.json();
        if (controller.signal.aborted || !isMountedRef.current) return;

        const list = Array.isArray(data.suggestions) ? data.suggestions : [];
        setSuggestions(list);
        setShowSuggestions(true);
        setActiveSuggestionIdx(-1);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Ignore aborted requests cleanly
        }
        if (!isMountedRef.current) return;
        console.warn("[Autocomplete] Fetch error:", err);
        setSearchError("Network error loading suggestions. Enter address manually below.");
        setSuggestions([]);
        setShowSuggestions(true);
      } finally {
        if (!controller.signal.aborted && isMountedRef.current) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Keyboard navigation for address suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestionIdx((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestionIdx((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      }
    } else if (e.key === "Enter") {
      if (activeSuggestionIdx >= 0 && activeSuggestionIdx < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeSuggestionIdx]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Selecting a suggestion fills address fields and updates coordinates
  const handleSelectSuggestion = (s: GeocodeSuggestion) => {
    const lat = Number(s.lat ?? s.latitude ?? 28.4744);
    const lon = Number(s.lon ?? s.longitude ?? 77.5039);
    setLatitude(lat);
    setLongitude(lon);

    const streetVal = s.street ?? s.area ?? s.name ?? "";
    if (streetVal) {
      setStreet(streetVal);
      clearFieldError("street");
    }

    const cityVal = s.city ?? "";
    if (cityVal) {
      setCity(cityVal);
      clearFieldError("city");
    }

    const stateVal = s.state ?? "";
    if (stateVal) {
      setState(stateVal);
      clearFieldError("state");
    }

    const pinVal = s.pincode ?? "";
    if (pinVal) {
      setPincode(pinVal);
      clearFieldError("pincode");
    }

    const houseVal = s.houseNumber ?? s.house_number ?? "";
    if (houseVal && !houseNo) {
      setHouseNo(houseVal);
      clearFieldError("houseNo");
    }

    // Set justSelected flag so the useEffect doesn't immediately search again
    justSelectedRef.current = true;
    const labelStr = s.label ?? s.formatted_address ?? s.name ?? "";
    setSearchQuery(labelStr);
    setShowSuggestions(false);
    setSearchError(null);
  };

  // Reverse Geocoding when pin is dragged or map is clicked
  const handleMapLocationChange = useCallback(
    async (newLat: number, newLng: number) => {
      setLatitude(newLat);
      setLongitude(newLng);
      clearFieldError("location");
      setIsReverseLoading(true);

      try {
        const res = await fetch(
          `/api/geocode/reverse?lat=${newLat}&lon=${newLng}`
        );
        if (res.ok && isMountedRef.current) {
          const data = await res.json();
          const loc = data.result || data.address;
          if (loc) {
            const streetVal = loc.street || loc.area || data.name || "";
            if (streetVal) {
              setStreet(streetVal);
              clearFieldError("street");
            }
            if (loc.city) {
              setCity(loc.city);
              clearFieldError("city");
            }
            if (loc.state) {
              setState(loc.state);
              clearFieldError("state");
            }
            const pinVal = loc.pincode || loc.postcode || "";
            if (pinVal) {
              setPincode(pinVal);
              clearFieldError("pincode");
            }
            const houseVal = loc.houseNumber || loc.house_number || "";
            if (houseVal && !houseNo) {
              setHouseNo(houseVal);
              clearFieldError("houseNo");
            }
          }
        }
      } catch (err) {
        console.warn("[ReverseGeocode] Request failed, retaining existing address:", err);
      } finally {
        if (isMountedRef.current) {
          setIsReverseLoading(false);
        }
      }
    },
    [houseNo]
  );

  // Field error clearing helper
  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  // Image Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors((prev) => ({
          ...prev,
          photoUrl: "Image file must be under 5MB.",
        }));
        return;
      }
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string" && isMountedRef.current) {
          setPhotoUrl(reader.result);
          clearFieldError("photoUrl");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Vehicle type toggle
  const toggleVehicleType = (typeId: string) => {
    setVehicleTypes((prev) => {
      const exists = prev.includes(typeId);
      const updated = exists ? prev.filter((t) => t !== typeId) : [...prev, typeId];
      if (updated.length > 0) clearFieldError("vehicleTypes");
      return updated;
    });
  };

  // Amenity toggle
  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((a) => a !== amenityId)
        : [...prev, amenityId]
    );
  };

  // Slot management
  const addSlot = () => {
    const newId = `slot-${Date.now()}`;
    setAvailabilitySlots((prev) => [
      ...prev,
      { id: newId, dayOfWeek: 1, startTime: "08:00", endTime: "21:00" },
    ]);
  };

  const removeSlot = (id: string) => {
    setAvailabilitySlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  const updateSlot = (id: string, field: keyof AvailabilitySlot, value: any) => {
    setAvailabilitySlots((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot))
    );
  };

  const applyPreset247 = () => {
    const slots: AvailabilitySlot[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      id: `slot-247-${day}-${Date.now()}`,
      dayOfWeek: day,
      startTime: "00:00",
      endTime: "23:59",
    }));
    setAvailabilitySlots(slots);
  };

  const applyPresetWeekdays = () => {
    const slots: AvailabilitySlot[] = [1, 2, 3, 4, 5].map((day) => ({
      id: `slot-wd-${day}-${Date.now()}`,
      dayOfWeek: day,
      startTime: "08:30",
      endTime: "19:00",
    }));
    setAvailabilitySlots(slots);
  };

  const applyPresetWeekends = () => {
    const slots: AvailabilitySlot[] = [0, 6].map((day) => ({
      id: `slot-we-${day}-${Date.now()}`,
      dayOfWeek: day,
      startTime: "09:00",
      endTime: "22:00",
    }));
    setAvailabilitySlots(slots);
  };

  // Client Validation per step
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!houseNo.trim()) {
        errors.houseNo = "House / Flat / Shop / Plot number is required.";
      }
      if (!street.trim()) {
        errors.street = "Street / Area / Sector is required.";
      }
      if (!city.trim()) {
        errors.city = "City is required.";
      }
      if (!state.trim()) {
        errors.state = "State is required.";
      }
      const cleanPin = pincode.trim();
      if (!cleanPin || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
        errors.pincode = "Enter a valid 6-digit Indian postal code.";
      }
      if (isNaN(latitude) || isNaN(longitude)) {
        errors.location = "Please select a valid spot on the map.";
      }
    }

    if (step === 2) {
      if (!title.trim()) {
        errors.title = "Space title is required.";
      } else if (title.trim().length < 5) {
        errors.title = "Title must be at least 5 characters long.";
      }

      if (!description.trim()) {
        errors.description = "Space description is required.";
      } else if (description.trim().length < 10) {
        errors.description = "Description should be at least 10 characters.";
      }

      if (vehicleTypes.length === 0) {
        errors.vehicleTypes = "Select at least one allowed vehicle type.";
      }

      if (isNaN(totalSlots) || totalSlots < 1) {
        errors.totalSlots = "Total parking slots must be at least 1.";
      }

      if (entryInstructions.length > 200) {
        errors.entryInstructions = "Entry instructions must be 200 characters or fewer.";
      }

      const cleanPhone = contactPhone.replace(/\D/g, "").slice(-10);
      if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        errors.contactPhone = "Enter a valid 10-digit Indian mobile number.";
      }
    }

    if (step === 3) {
      const price = parseFloat(pricePerHour);
      if (isNaN(price) || price <= 0) {
        errors.pricePerHour = "Enter an hourly rate in ₹ greater than 0.";
      }
      if (!photoUrl.trim()) {
        errors.photoUrl = "Please provide or upload a photo of your parking space.";
      }
    }

    if (step === 4) {
      if (availabilitySlots.length === 0) {
        errors.availability = "Add at least one weekly operating time window.";
      }
      for (const slot of availabilitySlots) {
        if (!slot.startTime || !slot.endTime) {
          errors.availability = "All windows must have valid start and end times.";
          break;
        }
        if (slot.endTime <= slot.startTime) {
          errors.availability = "End time must be after start time for every window.";
          break;
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    setServerError(null);
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setServerError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit Handler: Calls server route /api/owner/spaces with transactional RPC execution
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      setServerError({
        message: "Please complete all required fields correctly before publishing.",
      });
      return;
    }

    if (hostStatus !== "verified") {
      setShowHostVerifyModal(true);
      setServerError({
        message: "Demo Mode: Please complete Host Verification before publishing your space.",
      });
      return;
    }

    setSubmitting(true);
    setServerError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      latitude,
      longitude,
      price_per_hour: parseFloat(pricePerHour),
      photo_url: photoUrl.trim(),
      house_no: houseNo.trim(),
      building_name: buildingName.trim(),
      street: street.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      space_type: spaceType,
      vehicle_types: vehicleTypes,
      total_slots: totalSlots,
      entry_instructions: entryInstructions.trim(),
      contact_phone: contactPhone.trim(),
      amenities: selectedAmenities,
      max_vehicle_type: verifiedMaxVehicle,
      verified_host: hostStatus === "verified",
      has_cctv: verifiedSecurityDetails?.has_cctv ?? false,
      cctv_coverage: verifiedSecurityDetails?.cctv_coverage ?? null,
      has_guard: verifiedSecurityDetails?.has_guard ?? false,
      guard_hours: verifiedSecurityDetails?.guard_hours ?? null,
      has_entry_control: verifiedSecurityDetails?.has_entry_control ?? false,
      entry_control_type: verifiedSecurityDetails?.entry_control_type ?? null,
      manual_checkin: verifiedSecurityDetails?.manual_checkin ?? false,
      manual_checkin_by: verifiedSecurityDetails?.manual_checkin_by ?? null,
      security_score: verifiedSecurityDetails?.security_score ?? 0,
      ownership_proof_name: verifiedSecurityDetails?.ownership_proof_name ?? null,
      availability_slots: availabilitySlots.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    };

    try {
      const res = await fetch("/api/owner/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!isMountedRef.current) return;

      if (!res.ok) {
        console.error("[ListSpace] Server returned error publishing space:", data);
        if (data.validation_errors) {
          setFieldErrors(data.validation_errors);
        }
        setServerError({
          message:
            data.error ||
            "Failed to publish listing. Please verify your details and try again.",
          code: data.code,
          details: data.details,
        });
        setSubmitting(false);
        return;
      }

      // Success! Space and availability created atomically in Supabase
      setSuccess(true);
      const newSpaceId = data.space?.id || "";
      setTimeout(() => {
        router.push(`/owner/dashboard?published=true&new_id=${newSpaceId}`);
      }, 1200);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      console.error("[ListSpace] Network or unhandled error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while publishing your listing.";
      setServerError({
        message: msg,
      });
      setSubmitting(false);
    }
  };

  const progressPercent = (currentStep / 5) * 100;
  const estimatedMonthly = Math.round(parseFloat(pricePerHour || "0") * 8 * 22);

  // Composed public vs private address preview
  const publicAddress = [street.trim(), landmark.trim(), city.trim(), pincode.trim()]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1F3A] text-[#2FD08A] shadow-sm">
              <Car className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0B1F3A]">
              Par<span className="text-[#2FD08A]">Kit</span>{" "}
              <span className="text-xs font-semibold text-slate-400">Host Studio</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              Step {currentStep} of 5
            </span>
            <Link
              href="/owner/dashboard"
              className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Exit to Dashboard
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-[#2FD08A] via-[#26b878] to-[#FFC93C] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {/* Step Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-[#0B1F3A] text-white px-3 py-0.5 text-xs font-bold">
                Step {currentStep} of 5
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2FD08A]">
                {currentStep === 1 && "Location & Detailed Address"}
                {currentStep === 2 && "Space Details & Specs"}
                {currentStep === 3 && "Pricing & Photos"}
                {currentStep === 4 && "Weekly Availability"}
                {currentStep === 5 && "Review & Publish"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
              {currentStep === 1 && "Where is your parking space located?"}
              {currentStep === 2 && "Tell us about your space & vehicle rules"}
              {currentStep === 3 && "Set your hourly rate and parking photos"}
              {currentStep === 4 && "When is your space open for drivers?"}
              {currentStep === 5 && "Review your listing before publishing"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {currentStep === 1 &&
                "Search your address with live Google Maps-style suggestions, adjust the pin on OpenStreetMap, and verify detailed address fields."}
              {currentStep === 2 &&
                "Specify vehicle compatibility, number of slots, entry instructions, and your host contact phone."}
              {currentStep === 3 &&
                "Choose a competitive hourly price in INR (₹) and select crisp photos of the bay."}
              {currentStep === 4 &&
                "Define the recurring weekly schedule when drivers can reserve your spot."}
              {currentStep === 5 &&
                "Inspect how your space will appear. Supabase stores the listing atomically and publishes immediately to the driver map."}
            </p>
          </div>

          {/* Real Server Error Alert */}
          {serverError && (
            <div
              id="server-error-banner"
              className="mb-6 flex flex-col gap-1.5 rounded-2xl border border-red-200 bg-red-50 p-4.5 text-xs font-medium text-red-800 shadow-sm animate-in fade-in-50"
            >
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{serverError.message}</span>
              </div>
              {serverError.code && (
                <p className="text-[11px] text-red-600 font-mono mt-0.5">
                  Error Code: {serverError.code}
                </p>
              )}
              {serverError.details && (
                <p className="text-[11px] text-red-600 font-mono">
                  Details: {serverError.details}
                </p>
              )}
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold text-emerald-800 shadow-soft">
              <CheckCircle2 className="h-6 w-6 text-[#2FD08A] shrink-0" />
              <div>
                <p>Space published successfully to Supabase!</p>
                <p className="text-xs font-normal text-emerald-700">
                  Redirecting to your host dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Step Form Card */}
          <div className="rounded-2xl bg-white p-6 sm:p-10 shadow-soft border border-slate-200/90">
            {/* STEP 1: Address Autocomplete & Detailed Address Form */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* PART 2: Photon Address Autocomplete Input */}
                <div className="relative" ref={suggestionBoxRef}>
                  <Label
                    htmlFor="address-search"
                    className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center justify-between"
                  >
                    <span>Search Address / Landmark</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Photon Geocoder • Greater Noida NCR Bias
                    </span>
                  </Label>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="address-search"
                      type="text"
                      role="combobox"
                      aria-expanded={showSuggestions}
                      aria-autocomplete="list"
                      aria-controls="address-suggestions-dropdown"
                      aria-activedescendant={
                        activeSuggestionIdx >= 0 ? `suggestion-item-${activeSuggestionIdx}` : undefined
                      }
                      value={searchQuery ?? ""}
                      onChange={(e) => updateSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      placeholder="Type society, street, or sector (e.g. Pari Chowk, Sector 18, Gaur City)..."
                      className="h-12 rounded-xl border-slate-200 pl-10 pr-10 text-sm font-medium focus-visible:ring-[#2FD08A]"
                      autoComplete="off"
                    />
                    {isSearching ? (
                      <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-[#2FD08A]" />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          updateSearchQuery("");
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                        title="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  {/* Autocomplete Suggestions Dropdown with Accessibility & Error/Empty States */}
                  {showSuggestions && (
                    <div
                      id="address-suggestions-dropdown"
                      role="listbox"
                      className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden max-h-72 overflow-y-auto"
                    >
                      <div className="p-2 border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                        <span>Suggestions (Use ↑↓ and Enter)</span>
                        <span className="text-[10px] text-slate-400">Komoot Photon</span>
                      </div>

                      {/* Loading State */}
                      {isSearching && suggestions.length === 0 && (
                        <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin text-[#2FD08A]" />
                          <span>Searching addresses in Greater Noida NCR...</span>
                        </div>
                      )}

                      {/* Error State */}
                      {searchError && (
                        <div className="p-3 text-xs text-amber-700 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                          <span>{searchError}</span>
                        </div>
                      )}

                      {/* Empty Results State */}
                      {!isSearching && !searchError && suggestions.length === 0 && (searchQuery ?? "").trim().length >= 3 && (
                        <div className="p-4 text-center text-xs text-slate-500">
                          <p className="font-semibold text-slate-700">No address suggestions found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Try typing sector, landmark, or enter detailed fields manually below.
                          </p>
                        </div>
                      )}

                      {/* Suggestion Items (Using onMouseDown to prevent blur race condition) */}
                      {suggestions.map((suggestion, idx) => {
                        const isFocused = idx === activeSuggestionIdx;
                        return (
                          <div
                            key={suggestion.id || idx}
                            id={`suggestion-item-${idx}`}
                            role="option"
                            aria-selected={isFocused}
                            onMouseDown={(e) => {
                              // Prevent input blur before selection completes (Fix #5)
                              e.preventDefault();
                              handleSelectSuggestion(suggestion);
                            }}
                            onMouseEnter={() => setActiveSuggestionIdx(idx)}
                            className={`flex items-start gap-3 p-3 text-xs cursor-pointer transition-colors ${
                              isFocused
                                ? "bg-emerald-50 text-[#0B1F3A]"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <MapPin
                              className={`h-4 w-4 shrink-0 mt-0.5 ${
                                isFocused ? "text-[#2FD08A]" : "text-slate-400"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold truncate text-[#0B1F3A]">
                                {suggestion.name || suggestion.street || suggestion.label}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {suggestion.label}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Leaflet Draggable Pin Map */}
                <div className="space-y-2 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Interactive OpenStreetMap Pin
                      </h3>
                      <p className="text-xs text-slate-500">
                        Drag the pin or click on the map to pinpoint your exact spot.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                      {isReverseLoading ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#2FD08A]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Reverse geocoding...</span>
                        </div>
                      ) : (
                        <>
                          <span>Lat: {latitude.toFixed(5)}</span>
                          <span>•</span>
                          <span>Lng: {longitude.toFixed(5)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <LocationPickerMap
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={handleMapLocationChange}
                  />
                  {fieldErrors.location && (
                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.location}
                    </p>
                  )}
                </div>

                {/* PART 3: Detailed Address Form (Amazon/Flipkart style) */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                        Detailed Address Fields
                      </h3>
                      <p className="text-xs text-slate-500">
                        Auto pre-filled from geocoder. Edit to provide exact details.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Amazon / Flipkart Format
                    </span>
                  </div>

                  {/* House No & Building Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="houseNo"
                        className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider"
                      >
                        House / Flat / Shop / Plot No. <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="houseNo"
                        value={houseNo ?? ""}
                        onChange={(e) => {
                          setHouseNo(e.target.value ?? "");
                          clearFieldError("houseNo");
                        }}
                        placeholder="e.g. Flat 402, Tower B or Plot 12"
                        className={`mt-1.5 h-11 rounded-xl text-xs font-medium ${
                          fieldErrors.houseNo ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                      />
                      {fieldErrors.houseNo && (
                        <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {fieldErrors.houseNo}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="buildingName"
                        className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider"
                      >
                        Building / Society / Complex Name (Optional)
                      </Label>
                      <Input
                        id="buildingName"
                        value={buildingName ?? ""}
                        onChange={(e) => setBuildingName(e.target.value ?? "")}
                        placeholder="e.g. Gaur City 2, ATS Greens, or Omaxe Mall"
                        className="mt-1.5 h-11 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Street & Landmark */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="street"
                        className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center justify-between"
                      >
                        <span>Street / Area / Sector <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-slate-400 font-normal">Auto</span>
                      </Label>
                      <Input
                        id="street"
                        value={street ?? ""}
                        onChange={(e) => {
                          setStreet(e.target.value ?? "");
                          clearFieldError("street");
                        }}
                        placeholder="e.g. Sector 29, Golf Course Road"
                        className={`mt-1.5 h-11 rounded-xl text-xs font-medium ${
                          fieldErrors.street ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                      />
                      {fieldErrors.street && (
                        <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {fieldErrors.street}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="landmark"
                        className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider"
                      >
                        Nearby Landmark (Optional)
                      </Label>
                      <Input
                        id="landmark"
                        value={landmark ?? ""}
                        onChange={(e) => setLandmark(e.target.value ?? "")}
                        placeholder="e.g. Opposite Metro Gate 1, Behind Fortis Hospital"
                        className="mt-1.5 h-11 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* City, State, Pincode */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label
                        htmlFor="city"
                        className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center justify-between"
                      >
                        <span>City <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-slate-400 font-normal">Auto</span>
                      </Label>
                      <Input
                        id="city"
                        value={city ?? ""}
                        onChange={(e) => {
                          setCity(e.target.value ?? "");
                          clearFieldError("city");
                        }}
                        placeholder="Greater Noida"
                        className={`mt-1.5 h-11 rounded-xl text-xs font-medium ${
                          fieldErrors.city ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                      />
                      {fieldErrors.city && (
                        <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {fieldErrors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="state"
                        className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center justify-between"
                      >
                        <span>State <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-slate-400 font-normal">Auto</span>
                      </Label>
                      <Input
                        id="state"
                        value={state ?? ""}
                        onChange={(e) => {
                          setState(e.target.value ?? "");
                          clearFieldError("state");
                        }}
                        placeholder="Uttar Pradesh"
                        className={`mt-1.5 h-11 rounded-xl text-xs font-medium ${
                          fieldErrors.state ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                      />
                      {fieldErrors.state && (
                        <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {fieldErrors.state}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="pincode"
                        className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center justify-between"
                      >
                        <span>Pincode <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-slate-400 font-normal">6 digits</span>
                      </Label>
                      <Input
                        id="pincode"
                        maxLength={6}
                        value={pincode ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setPincode(val ?? "");
                          clearFieldError("pincode");
                        }}
                        placeholder="201310"
                        className={`mt-1.5 h-11 rounded-xl text-xs font-medium ${
                          fieldErrors.pincode ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                      />
                      {fieldErrors.pincode && (
                        <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {fieldErrors.pincode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Privacy Shield Notice */}
                  <div className="rounded-xl bg-blue-50/80 p-3.5 border border-blue-200/70 flex items-start gap-3">
                    <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-blue-900 leading-relaxed">
                      <span className="font-bold">Driver Privacy Shield:</span> House/Flat number
                      and building name remain strictly hidden on public maps. Only area, street,
                      landmark, and pincode are publicly visible before confirmed booking.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Space Details & Rules */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <Label
                    htmlFor="title"
                    className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider"
                  >
                    Listing Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title ?? ""}
                    onChange={(e) => {
                      setTitle(e.target.value ?? "");
                      clearFieldError("title");
                    }}
                    placeholder="e.g. Covered Driveway near Knowledge Park Metro Station"
                    className={`mt-1.5 h-12 rounded-xl text-sm font-medium ${
                      fieldErrors.title ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                  />
                  {fieldErrors.title ? (
                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.title}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Mention security, landmark, or vehicle size for higher conversions.
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label
                    htmlFor="description"
                    className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider"
                  >
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={description ?? ""}
                    onChange={(e) => {
                      setDescription(e.target.value ?? "");
                      clearFieldError("description");
                    }}
                    placeholder="e.g. Spacious gated driveway suitable for SUVs and Sedans. Gated society with 24/7 CCTV surveillance and security guard. Easy straight pull-in."
                    className={`mt-1.5 rounded-xl text-sm font-medium ${
                      fieldErrors.description ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                  />
                  {fieldErrors.description && (
                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.description}
                    </p>
                  )}
                </div>

                {/* Space Type Selector */}
                <div>
                  <Label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider block mb-2">
                    Space Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {SPACE_TYPES.map((type) => {
                      const isSelected = spaceType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSpaceType(type)}
                          className={`rounded-xl px-3.5 py-2.5 text-xs font-bold text-left transition-all border ${
                            isSelected
                              ? "bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicle Types Allowed (Multi-Select) & Total Slots */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <Label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider block mb-2">
                      Vehicles Allowed <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-2">
                      {VEHICLE_OPTIONS.map((v) => {
                        const isChecked = vehicleTypes.includes(v.id);
                        return (
                          <div
                            key={v.id}
                            onClick={() => toggleVehicleType(v.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? "bg-emerald-50/80 border-[#2FD08A] text-[#0B1F3A]"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 text-xs font-bold">
                              <span>{v.icon}</span>
                              <span>{v.label}</span>
                            </div>
                            <div
                              className={`h-4 w-4 rounded-md border flex items-center justify-center ${
                                isChecked
                                  ? "bg-[#2FD08A] border-[#2FD08A] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {fieldErrors.vehicleTypes && (
                      <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.vehicleTypes}
                      </p>
                    )}
                  </div>

                  {/* Total Slots */}
                  <div>
                    <Label
                      htmlFor="totalSlots"
                      className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider block"
                    >
                      Number of Parking Slots <span className="text-red-500">*</span>
                    </Label>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTotalSlots((prev) => Math.max(1, prev - 1))}
                        className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-lg font-bold text-[#0B1F3A] transition-colors"
                      >
                        -
                      </button>
                      <Input
                        id="totalSlots"
                        type="number"
                        min="1"
                        value={totalSlots}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTotalSlots(isNaN(val) ? 1 : Math.max(1, val));
                          clearFieldError("totalSlots");
                        }}
                        className="h-11 w-20 text-center font-black text-lg rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setTotalSlots((prev) => prev + 1)}
                        className="h-11 w-11 rounded-xl bg-[#0B1F3A] hover:bg-[#163359] flex items-center justify-center text-lg font-bold text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Total distinct vehicles that can park simultaneously.
                    </p>
                    {fieldErrors.totalSlots && (
                      <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.totalSlots}
                      </p>
                    )}
                  </div>
                </div>

                {/* Entry Instructions & Host Contact Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label
                      htmlFor="entryInstructions"
                      className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center justify-between"
                    >
                      <span>Entry Instructions</span>
                      <span className="text-[10px] text-slate-400">
                        {(entryInstructions ?? "").length}/200
                      </span>
                    </Label>
                    <Textarea
                      id="entryInstructions"
                      maxLength={200}
                      rows={2}
                      value={entryInstructions ?? ""}
                      onChange={(e) => {
                        setEntryInstructions(e.target.value ?? "");
                        clearFieldError("entryInstructions");
                      }}
                      placeholder='e.g. "Gate 2, ask for the guard. Show booking OTP."'
                      className={`mt-1.5 rounded-xl text-xs font-medium ${
                        fieldErrors.entryInstructions
                          ? "border-red-500 ring-1 ring-red-500"
                          : ""
                      }`}
                    />
                    <p className="mt-1 text-[10px] text-slate-400">
                      Protected: Revealed only after confirmed booking.
                    </p>
                    {fieldErrors.entryInstructions && (
                      <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.entryInstructions}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="contactPhone"
                      className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider"
                    >
                      Host Contact Phone <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-500">
                        +91
                      </span>
                      <Input
                        id="contactPhone"
                        type="tel"
                        maxLength={10}
                        value={contactPhone ?? ""}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, "");
                          setContactPhone(clean ?? "");
                          clearFieldError("contactPhone");
                        }}
                        placeholder="9876543210"
                        className={`h-11 rounded-xl pl-12 text-xs font-bold text-[#0B1F3A] tracking-wider ${
                          fieldErrors.contactPhone
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Protected: Revealed to drivers only for paid bookings.
                    </p>
                    {fieldErrors.contactPhone && (
                      <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.contactPhone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Amenities Selection */}
                <div className="pt-2">
                  <Label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider block mb-2">
                    Amenities & Features
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AMENITY_OPTIONS.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity.id);
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                            isSelected
                              ? "bg-slate-900 text-[#2FD08A] border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span>{amenity.icon}</span>
                          <span>{amenity.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Pricing & Photos */}
            {currentStep === 3 && (
              <div className="space-y-8">
                {/* Hourly Rate */}
                <div>
                  <Label
                    htmlFor="price"
                    className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider"
                  >
                    Hourly Price (INR ₹) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2 max-w-xs">
                    <span className="absolute left-4 top-3 text-lg font-bold text-[#0B1F3A]">
                      ₹
                    </span>
                    <Input
                      id="price"
                      type="number"
                      min="1"
                      step="1"
                      value={pricePerHour ?? ""}
                      onChange={(e) => {
                        setPricePerHour(e.target.value ?? "");
                        clearFieldError("pricePerHour");
                      }}
                      placeholder="60"
                      className={`h-14 rounded-xl border-slate-200 pl-9 text-2xl font-black text-[#0B1F3A] focus-visible:ring-[#2FD08A] ${
                        fieldErrors.pricePerHour ? "border-red-500 ring-1 ring-red-500" : ""
                      }`}
                    />
                    <span className="absolute right-4 top-4 text-xs font-semibold text-slate-400">
                      / hour
                    </span>
                  </div>
                  {fieldErrors.pricePerHour && (
                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.pricePerHour}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Estimated monthly host income at 8 hrs/day:{" "}
                      <strong className="text-[#0B1F3A]">
                        ₹{estimatedMonthly.toLocaleString("en-IN")}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Photos */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                      Space Photo <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-slate-400">Preview updates live below</span>
                  </div>

                  <div>
                    <Label
                      htmlFor="photoUrl"
                      className="text-[11px] font-semibold text-slate-500 mb-1 block"
                    >
                      Direct Photo URL
                    </Label>
                    <Input
                      id="photoUrl"
                      type="url"
                      value={photoUrl ?? ""}
                      onChange={(e) => {
                        setPhotoUrl(e.target.value ?? "");
                        clearFieldError("photoUrl");
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="h-11 rounded-xl border-slate-200 text-xs font-medium focus-visible:ring-[#2FD08A]"
                    />
                  </div>

                  {/* Curated Presets */}
                  <div>
                    <p className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wide mb-2.5">
                      Or select from curated parking presets:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CURATED_PHOTO_PRESETS.map((preset) => {
                        const isSelected = photoUrl === preset.url;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => {
                              setPhotoUrl(preset.url);
                              clearFieldError("photoUrl");
                            }}
                            className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all ${
                              isSelected
                                ? "border-[#2FD08A] shadow-md ring-2 ring-[#2FD08A]/20"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="h-28 w-full bg-slate-100 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={preset.url}
                                alt={preset.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="p-3 bg-white flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-[#0B1F3A]">{preset.title}</p>
                                <p className="text-[10px] text-slate-400">{preset.subtitle}</p>
                              </div>
                              {isSelected && (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2FD08A] text-[#0B1F3A]">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upload from device */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition-all hover:border-[#2FD08A] hover:bg-emerald-50/20"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-xs text-slate-500 mb-2">
                        <Upload className="h-5 w-5 text-[#2FD08A]" />
                      </div>
                      <p className="text-xs font-bold text-[#0B1F3A]">
                        {uploadedFileName
                          ? `Selected: ${uploadedFileName}`
                          : "Upload photo from your device"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, or WebP up to 5MB
                      </p>
                    </div>
                  </div>

                  {/* Photo Preview Card */}
                  <div className="pt-2">
                    <p className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wide mb-2">
                      Card Preview
                    </p>
                    <div className="relative h-60 w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-soft">
                      {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoUrl}
                          alt="Parking space preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          No photo provided
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 rounded-xl bg-black/75 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur">
                        ₹{pricePerHour || "0"} / hour
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Weekly Availability */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1F3A]">Weekly Available Hours</h3>
                    <p className="text-xs text-slate-500">
                      Drivers can reserve slots only within your active schedule.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addSlot}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F3A] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#163359] self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#2FD08A]" />
                    <span>Add Window</span>
                  </button>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400 font-semibold">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={applyPreset247}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    24/7 Full Week
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetWeekdays}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Mon - Fri (8:30 AM - 7 PM)
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetWeekends}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Weekends Only
                  </button>
                </div>

                {fieldErrors.availability && (
                  <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {fieldErrors.availability}
                  </p>
                )}

                {/* Slots List */}
                <div className="space-y-3">
                  {availabilitySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all hover:bg-slate-50"
                    >
                      <div className="w-full sm:w-1/3">
                        <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                          Day of Week
                        </Label>
                        <select
                          value={slot.dayOfWeek}
                          onChange={(e) =>
                            updateSlot(slot.id, "dayOfWeek", parseInt(e.target.value))
                          }
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#0B1F3A] outline-none focus:border-[#2FD08A]"
                        >
                          {DAYS_OF_WEEK.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-1/3">
                        <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                          Start Time
                        </Label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(slot.id, "startTime", e.target.value)}
                          className="h-10 rounded-lg bg-white text-xs font-semibold"
                        />
                      </div>

                      <div className="w-full sm:w-1/3">
                        <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                          End Time
                        </Label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(slot.id, "endTime", e.target.value)}
                          className="h-10 rounded-lg bg-white text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:pt-4">
                        <button
                          type="button"
                          onClick={() => removeSlot(slot.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Remove slot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Review & Publish */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-[#FFC93C]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2FD08A]">
                    Final Review
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0B1F3A]">
                  Review your listing before publishing to Supabase
                </h3>

                {/* Listing Summary Grid */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Title
                      </span>
                      <p className="text-base font-extrabold text-[#0B1F3A]">
                        {title || "Untitled Space"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Hourly Rate
                      </span>
                      <p className="text-2xl font-black text-[#0B1F3A]">₹{pricePerHour}</p>
                    </div>
                  </div>

                  {/* Address Section with Privacy Indicators */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Address Breakdown
                    </span>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                          <MapPin className="h-3.5 w-3.5 text-[#2FD08A]" />
                          <span>Publicly Visible to Drivers</span>
                        </div>
                        <p className="text-slate-600 font-medium">
                          {publicAddress || "Street / Area, City, Pincode"}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-blue-200">
                        <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-1">
                          <Lock className="h-3.5 w-3.5 text-blue-600" />
                          <span>Private (Unlocked on Paid Booking)</span>
                        </div>
                        <p className="text-slate-700 font-semibold">
                          {houseNo ? `Unit: ${houseNo}` : "No house specified"}
                          {buildingName ? ` • ${buildingName}` : ""}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Phone: +91 {contactPhone.slice(-10)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Type</span>
                      <p className="font-bold text-[#0B1F3A] mt-0.5">{spaceType}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Vehicles</span>
                      <p className="font-bold text-[#0B1F3A] mt-0.5">{vehicleTypes.join(", ")}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Slots</span>
                      <p className="font-bold text-[#0B1F3A] mt-0.5">{totalSlots} Parking Bay(s)</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Schedule</span>
                      <p className="font-bold text-[#26b878] mt-0.5">
                        {availabilitySlots.length} Active Window(s)
                      </p>
                    </div>
                  </div>

                  {/* Entry Instructions */}
                  {entryInstructions && (
                    <div className="pt-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Entry Instructions (Shown after Booking)
                      </span>
                      <p className="mt-1 p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-slate-700">
                        {entryInstructions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Host Verification Status Card (Demo mode) */}
                {hostStatus !== "verified" ? (
                  <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-amber-950">Host Verification Required</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-800 uppercase tracking-wider">
                              Demo Mode
                            </span>
                          </div>
                          <p className="text-xs text-amber-800/90 mt-1">
                            To ensure safety and quality, all hosts must complete a quick 5-step mock verification before publishing.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setShowHostVerifyModal(true)}
                        className="shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 px-5 shadow-sm"
                      >
                        Verify Host Profile
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="h-5 w-5 text-[#2FD08A]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-emerald-950">Host Identity Verified</h4>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <Check className="h-3 w-3" /> Verified Host (Demo Mode)
                            </span>
                          </div>
                          <p className="text-xs text-emerald-800/80 mt-0.5">
                            Your profile is verified. This listing will receive the Verified Host badge on the map and spot details.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider hidden sm:inline-block">
                        Max Clearance: {verifiedMaxVehicle.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {/* How Host Protection Works Info Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-soft space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2FD08A] flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-extrabold text-[#0B1F3A]">
                      How host protection works
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Every driver booking includes verified vehicle protection. Hosts aren't liable for covered damage to guest vehicles; claims for dents, broken mirrors, scratches, or incident impacts go directly through ParkIt and our listed insurance partners.
                  </p>
                </div>

                {/* Atomic Guarantee Alert */}
                <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200/80 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#2FD08A] shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 leading-relaxed">
                    <p className="font-bold">Atomic Transactional Guarantee:</p>
                    <p className="mt-0.5">
                      Your parking space and its {availabilitySlots.length} availability time windows
                      are saved together in a single database transaction. Once published, your
                      listing immediately appears on the driver map and in your host dashboard.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls Footer */}
          <div className="mt-8 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                variant="outline"
                className="h-12 rounded-xl px-6 text-sm font-bold text-[#0B1F3A] border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="h-12 rounded-xl bg-[#0B1F3A] px-8 text-sm font-bold text-white shadow-soft hover:bg-[#163359] transition-all"
              >
                Next Step <ArrowRight className="h-4 w-4 ml-2 text-[#2FD08A]" />
              </Button>
            ) : hostStatus !== "verified" ? (
              <Button
                type="button"
                onClick={() => setShowHostVerifyModal(true)}
                className="h-12 rounded-xl bg-amber-500 hover:bg-amber-600 px-8 text-sm font-bold text-white shadow-soft transition-all"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                <span>Verify Host to Publish (Demo Mode)</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || success}
                className="h-12 rounded-xl bg-[#2FD08A] px-10 text-sm font-bold text-[#0B1F3A] shadow-soft hover:bg-[#26b878] transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Publishing Listing...</span>
                  </>
                ) : (
                  <>
                    <span>Publish Listing to Supabase</span>
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Host Verification Modal (Demo Mode) */}
      <HostVerificationModal
        isOpen={showHostVerifyModal}
        onClose={() => setShowHostVerifyModal(false)}
        onVerified={({ maxVehicleType, securityDetails }) => {
          setHostStatus("verified");
          setVerifiedMaxVehicle(maxVehicleType);
          if (securityDetails) {
            setVerifiedSecurityDetails(securityDetails);
          }
          setShowHostVerifyModal(false);
          setServerError(null);
        }}
        initialPhone={contactPhone}
        initialName={(user as any)?.user_metadata?.full_name || "Host"}
        pincode={pincode}
        latitude={latitude}
        longitude={longitude}
        photoCount={uploadedFileName || photoUrl ? 1 : 0}
        currentMaxVehicleType={verifiedMaxVehicle}
      />
    </div>
  );
}
