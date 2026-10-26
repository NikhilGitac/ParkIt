"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

// Dynamic import of Leaflet map (client-side only with no SSR)
const LocationPickerMap = dynamic(
  () => import("@/components/location-picker-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] w-full items-center justify-center rounded-[16px] bg-slate-100 border border-slate-200">
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

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const CURATED_PHOTO_PRESETS = [
  {
    id: "gated-driveway",
    title: "Gated Residential Driveway",
    subtitle: "Ideal for SUVs & Sedans",
    url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "covered-carport",
    title: "Covered Carport / Garage",
    subtitle: "Weatherproof private bay",
    url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "commercial-bay",
    title: "Commercial Multi-level Bay",
    subtitle: "24/7 Security & CCTV",
    url: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "open-paved",
    title: "Open Paved Private Spot",
    subtitle: "Quick in-and-out access",
    url: "https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function ListSpacePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  // Step 1: Space Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  // Step 2: Location (Latitude & Longitude)
  const [latitude, setLatitude] = useState(28.6139); // Default New Delhi / NCR
  const [longitude, setLongitude] = useState(77.209);

  // Step 3: Pricing & Photos
  const [pricePerHour, setPricePerHour] = useState("60"); // in INR
  const [photoUrl, setPhotoUrl] = useState(CURATED_PHOTO_PRESETS[0].url);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Step 4: Availability Slots
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([
    { id: "slot-1", dayOfWeek: 1, startTime: "09:00", endTime: "19:00" },
    { id: "slot-2", dayOfWeek: 2, startTime: "09:00", endTime: "19:00" },
    { id: "slot-3", dayOfWeek: 3, startTime: "09:00", endTime: "19:00" },
    { id: "slot-4", dayOfWeek: 4, startTime: "09:00", endTime: "19:00" },
    { id: "slot-5", dayOfWeek: 5, startTime: "09:00", endTime: "19:00" },
  ]);

  useEffect(() => {
    async function checkAuth() {
      if (isSupabaseConfigured()) {
        try {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();

          if (authUser) {
            setUser(authUser);
          }
        } catch (err) {
          console.warn("Auth check error in ListSpace:", err);
        }
      }
    }
    checkAuth();
  }, [supabase]);

  // Handle local image file upload & preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Image file must be under 5MB.");
        return;
      }
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation per step
  const validateStep = (step: number): boolean => {
    setErrorMessage(null);
    if (step === 1) {
      if (!title.trim()) {
        setErrorMessage("Please enter a title for your parking space.");
        return false;
      }
      if (title.trim().length < 5) {
        setErrorMessage("Title must be at least 5 characters long.");
        return false;
      }
      if (!description.trim()) {
        setErrorMessage("Please describe your space (security, vehicle size, accessibility).");
        return false;
      }
      if (!address.trim()) {
        setErrorMessage("Please enter the complete street address.");
        return false;
      }
    }

    if (step === 2) {
      if (isNaN(latitude) || isNaN(longitude)) {
        setErrorMessage("Please select a valid location on the map.");
        return false;
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        setErrorMessage("Coordinates are outside valid boundaries.");
        return false;
      }
    }

    if (step === 3) {
      const price = parseFloat(pricePerHour);
      if (isNaN(price) || price <= 0) {
        setErrorMessage("Please enter an hourly price in INR greater than ₹0.");
        return false;
      }
      if (!photoUrl.trim()) {
        setErrorMessage("Please provide a photo URL or upload an image of the space.");
        return false;
      }
    }

    if (step === 4) {
      if (availabilitySlots.length === 0) {
        setErrorMessage("Please add at least one weekly availability slot.");
        return false;
      }
      for (const slot of availabilitySlots) {
        if (!slot.startTime || !slot.endTime) {
          setErrorMessage("All slots must have valid start and end times.");
          return false;
        }
        if (slot.endTime <= slot.startTime) {
          setErrorMessage("End time must be after start time for every slot.");
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Availability slot actions
  const addSlot = () => {
    const newId = `slot-${Date.now()}`;
    setAvailabilitySlots((prev) => [
      ...prev,
      { id: newId, dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
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

  // Submit Handler: Inserts parking_spaces and space_availability
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const isConfigured = isSupabaseConfigured();

      if (isConfigured) {
        // Retrieve authenticated user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        const ownerId = authUser?.id || user?.id;

        if (!ownerId) {
          throw new Error("You must be signed in to publish a space. Please log in first.");
        }

        // Ensure host role on profile to satisfy RLS owner check
        try {
          await supabase.from("profiles").upsert({
            id: ownerId,
            role: "owner",
            updated_at: new Date().toISOString(),
          });
        } catch {
          // If already set or handled
        }

        // 1. Insert into parking_spaces
        const { data: spaceData, error: spaceError } = await supabase
          .from("parking_spaces")
          .insert({
            owner_id: ownerId,
            title: title.trim(),
            description: description.trim(),
            address: address.trim(),
            latitude,
            longitude,
            price_per_hour: parseFloat(pricePerHour),
            photo_url: photoUrl.trim(),
            is_active: true,
          })
          .select("id")
          .single();

        if (spaceError) {
          throw spaceError;
        }

        const spaceId = spaceData.id;

        // 2. Insert all availability rows into space_availability
        if (availabilitySlots.length > 0) {
          const availabilityRows = availabilitySlots.map((slot) => ({
            space_id: spaceId,
            day_of_week: slot.dayOfWeek,
            start_time: slot.startTime,
            end_time: slot.endTime,
          }));

          const { error: availError } = await supabase
            .from("space_availability")
            .insert(availabilityRows);

          if (availError) {
            console.warn("Availability insert note:", availError);
          }
        }
      } else {
        // Preview mode / demo mock
        console.log("Mock publish: Space and availability saved locally.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/owner/dashboard");
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish listing. Please try again.";
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  const progressPercent = (currentStep / 4) * 100;
  const estimatedMonthly = Math.round(parseFloat(pricePerHour || "0") * 8 * 22);

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
              Step {currentStep} of 4
            </span>
            <Link
              href="/owner/dashboard"
              className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Exit to Dashboard
            </Link>
          </div>
        </div>

        {/* Airbnb-style Progress Bar */}
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
          {/* Step Breadcrumb / Indicator */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-[#0B1F3A] text-white px-3 py-0.5 text-xs font-bold">
                Step {currentStep} of 4
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2FD08A]">
                {currentStep === 1 && "Space Details"}
                {currentStep === 2 && "Exact Location"}
                {currentStep === 3 && "Pricing & Photos"}
                {currentStep === 4 && "Weekly Availability"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] tracking-tight">
              {currentStep === 1 && "Tell us about your parking space"}
              {currentStep === 2 && "Where is your space located?"}
              {currentStep === 3 && "Set your hourly rate and photos"}
              {currentStep === 4 && "When can drivers park here?"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {currentStep === 1 && "Start with an inviting title, description, and street address."}
              {currentStep === 2 && "Drop a pin on OpenStreetMap to guide drivers directly to your spot."}
              {currentStep === 3 && "Choose a competitive hourly price in INR (₹) and add appealing photos."}
              {currentStep === 4 && "Set up the recurring days and hours your parking bay is available."}
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 shadow-sm animate-in fade-in-50">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-[16px] border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold text-emerald-800 shadow-soft">
              <CheckCircle2 className="h-6 w-6 text-[#2FD08A] shrink-0" />
              <div>
                <p>Space published successfully!</p>
                <p className="text-xs font-normal text-emerald-700">Redirecting to your host dashboard...</p>
              </div>
            </div>
          )}

          {/* Step Form Cards */}
          <div className="rounded-[16px] bg-white p-6 sm:p-10 shadow-soft border border-slate-200/90">
            {/* STEP 1: Space Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    Listing Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Secure Gated Driveway near Metro Station"
                    className="mt-1.5 h-12 rounded-xl border-slate-200 text-sm font-medium focus-visible:ring-[#2FD08A]"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Catchy titles mention security, vehicle type, or nearby transit/landmarks.
                  </p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    Space Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Spacious covered driveway suitable for Sedans and SUVs. Fully gated with 24/7 CCTV surveillance. Easy straight-in pull. 3 minutes walk to metro station."
                    className="mt-1.5 rounded-xl border-slate-200 text-sm font-medium focus-visible:ring-[#2FD08A]"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Include details about gates, lighting, ease of parking, and security.
                  </p>
                </div>

                <div>
                  <Label htmlFor="address" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    Full Street Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Plot 14, Sector 29, Golf Course Road, Gurugram"
                      className="h-12 rounded-xl border-slate-200 pl-10 text-sm font-medium focus-visible:ring-[#2FD08A]"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Your exact street address is kept private and only sent to drivers with confirmed bookings.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Location (Leaflet Map) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1F3A]">Interactive OpenStreetMap Pin</h3>
                    <p className="text-xs text-slate-500">
                      Click anywhere on the map to pinpoint your parking bay.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                    <span>Lat: {latitude.toFixed(5)}</span>
                    <span>•</span>
                    <span>Lng: {longitude.toFixed(5)}</span>
                  </div>
                </div>

                {/* Leaflet Interactive Map Component */}
                <LocationPickerMap
                  latitude={latitude}
                  longitude={longitude}
                  onLocationChange={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />

                {/* Coordinate Inputs fallback */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label htmlFor="lat" className="text-xs font-bold text-slate-500 uppercase">
                      Latitude
                    </Label>
                    <Input
                      id="lat"
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="mt-1 h-10 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng" className="text-xs font-bold text-slate-500 uppercase">
                      Longitude
                    </Label>
                    <Input
                      id="lng"
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="mt-1 h-10 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Pricing & Photos */}
            {currentStep === 3 && (
              <div className="space-y-8">
                {/* Hourly Price in INR */}
                <div>
                  <Label htmlFor="price" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    Hourly Price (INR ₹) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2 max-w-xs">
                    <span className="absolute left-4 top-3 text-lg font-bold text-[#0B1F3A]">₹</span>
                    <Input
                      id="price"
                      type="number"
                      min="1"
                      step="1"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(e.target.value)}
                      placeholder="60"
                      className="h-14 rounded-xl border-slate-200 pl-9 text-2xl font-black text-[#0B1F3A] focus-visible:ring-[#2FD08A]"
                    />
                    <span className="absolute right-4 top-4 text-xs font-semibold text-slate-400">
                      / hour
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Estimated monthly host income at 8 hrs/day:{" "}
                      <strong className="text-[#0B1F3A]">₹{estimatedMonthly.toLocaleString("en-IN")}</strong>
                    </span>
                  </div>
                </div>

                {/* Photo Upload & Presets */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                      Space Photo <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-slate-400">Preview updates live below</span>
                  </div>

                  {/* Photo URL Input */}
                  <div>
                    <Label htmlFor="photoUrl" className="text-[11px] font-semibold text-slate-500 mb-1 block">
                      Direct Photo URL
                    </Label>
                    <Input
                      id="photoUrl"
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="h-11 rounded-xl border-slate-200 text-xs font-medium focus-visible:ring-[#2FD08A]"
                    />
                  </div>

                  {/* Supabase Storage Upload Placeholder */}
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
                      className="flex cursor-pointer flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition-all hover:border-[#2FD08A] hover:bg-emerald-50/20"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-xs text-slate-500 mb-2">
                        <Upload className="h-5 w-5 text-[#2FD08A]" />
                      </div>
                      <p className="text-xs font-bold text-[#0B1F3A]">
                        {uploadedFileName ? `Selected: ${uploadedFileName}` : "Upload from device (Storage placeholder)"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, or WebP up to 5MB
                      </p>
                    </div>
                  </div>

                  {/* Curated Large Photo Cards */}
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
                            onClick={() => setPhotoUrl(preset.url)}
                            className={`group relative cursor-pointer overflow-hidden rounded-[16px] border-2 transition-all ${
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

                  {/* Large Photo Preview Card */}
                  <div className="pt-2">
                    <p className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wide mb-2">
                      Listing Card Preview
                    </p>
                    <div className="relative h-64 sm:h-72 w-full overflow-hidden rounded-[16px] bg-slate-100 border border-slate-200 shadow-soft">
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

            {/* STEP 4: Availability */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1F3A]">Weekly Available Hours</h3>
                    <p className="text-xs text-slate-500">
                      Drivers can only reserve parking during your defined time windows.
                    </p>
                  </div>

                  {/* Add Slot Button */}
                  <button
                    type="button"
                    onClick={addSlot}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F3A] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#163359] self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#2FD08A]" />
                    <span>Add Slot</span>
                  </button>
                </div>

                {/* Quick Schedule Presets */}
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

                {/* Slot rows */}
                <div className="space-y-3">
                  {availabilitySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all hover:bg-slate-50"
                    >
                      {/* Day select */}
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

                      {/* Start time */}
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

                      {/* End time */}
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

                      {/* Remove button */}
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

                {/* Final Listing Summary Box */}
                <div className="mt-8 rounded-xl bg-gradient-to-br from-[#0B1F3A] to-[#163359] p-5 text-white shadow-soft">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-[#FFC93C]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2FD08A]">
                      Review & Ready to Publish
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400">Title</p>
                      <p className="font-bold text-white truncate">{title || "Untitled Space"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Rate</p>
                      <p className="font-bold text-[#FFC93C]">₹{pricePerHour} / hour</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Address</p>
                      <p className="font-semibold text-slate-200 truncate">{address || "No address set"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Active Slots</p>
                      <p className="font-semibold text-[#2FD08A]">{availabilitySlots.length} weekly windows</p>
                    </div>
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
              <div></div>
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="h-12 rounded-xl bg-[#0B1F3A] px-8 text-sm font-bold text-white shadow-soft hover:bg-[#163359] transition-all"
              >
                Next Step <ArrowRight className="h-4 w-4 ml-2 text-[#2FD08A]" />
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
                    <span>Publish Listing</span>
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
