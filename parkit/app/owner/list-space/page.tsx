"use client";

import { useState, useEffect } from "react";
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
  Info,
  Calendar,
  IndianRupee,
} from "lucide-react";

// Dynamic import of Leaflet map (client-side only)
const LocationPickerMap = dynamic(
  () => import("@/components/location-picker-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] w-full items-center justify-center rounded-[16px] bg-slate-100 border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#2FD08A]" />
          <span>Loading OpenStreetMap...</span>
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

const SAMPLE_PHOTO_PRESETS = [
  {
    title: "Gated Residential Driveway",
    url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Covered Carport / Garage",
    url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Commercial Multi-level Bay",
    url: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function ListSpacePage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Form State
  // Step 1: Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  // Step 2: Location
  const [latitude, setLatitude] = useState(28.6139); // Default New Delhi / NCR
  const [longitude, setLongitude] = useState(77.209);

  // Step 3: Pricing & Photos
  const [pricePerHour, setPricePerHour] = useState("60"); // in INR
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_PHOTO_PRESETS[0].url);

  // Step 4: Availability
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([
    { id: "slot-1", dayOfWeek: 1, startTime: "08:00", endTime: "20:00" },
    { id: "slot-2", dayOfWeek: 2, startTime: "08:00", endTime: "20:00" },
    { id: "slot-3", dayOfWeek: 3, startTime: "08:00", endTime: "20:00" },
    { id: "slot-4", dayOfWeek: 4, startTime: "08:00", endTime: "20:00" },
    { id: "slot-5", dayOfWeek: 5, startTime: "08:00", endTime: "20:00" },
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

  // Step validation
  const validateStep = (step: number): boolean => {
    setErrorMessage(null);
    if (step === 1) {
      if (!title.trim()) {
        setErrorMessage("Please provide a title for your parking space.");
        return false;
      }
      if (!description.trim()) {
        setErrorMessage("Please enter a short description of the space.");
        return false;
      }
      if (!address.trim()) {
        setErrorMessage("Please provide the full street address.");
        return false;
      }
    }

    if (step === 2) {
      if (isNaN(latitude) || isNaN(longitude)) {
        setErrorMessage("Please pick a valid location on the map.");
        return false;
      }
    }

    if (step === 3) {
      const price = parseFloat(pricePerHour);
      if (isNaN(price) || price <= 0) {
        setErrorMessage("Please enter a valid hourly rate greater than ₹0.");
        return false;
      }
      if (!photoUrl.trim()) {
        setErrorMessage("Please enter or select a photo URL for the listing.");
        return false;
      }
    }

    if (step === 4) {
      if (availabilitySlots.length === 0) {
        setErrorMessage("Please add at least one weekly availability time slot.");
        return false;
      }
      for (const slot of availabilitySlots) {
        if (!slot.startTime || !slot.endTime) {
          setErrorMessage("All slots must have a start time and end time.");
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

  const addAllWeekPreset = () => {
    const slots: AvailabilitySlot[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      id: `slot-preset-${day}-${Date.now()}`,
      dayOfWeek: day,
      startTime: "00:00",
      endTime: "23:59",
    }));
    setAvailabilitySlots(slots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const isConfigured = isSupabaseConfigured();

      if (isConfigured) {
        // Authenticated insert
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        const ownerId = authUser?.id || user?.id;

        if (!ownerId) {
          throw new Error("You must be logged in as a host to publish a space.");
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

        // 2. Insert into space_availability
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
        // Mock success when running in demo/offline preview mode
        console.log("Demo mode: Space and availability captured locally.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/owner/dashboard");
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish listing. Please try again.";
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  const progressPercent = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1F3A] text-[#2FD08A]">
              <Car className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0B1F3A]">
              Par<span className="text-[#2FD08A]">Kit</span>{" "}
              <span className="text-xs font-semibold text-slate-400">Host Studio</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              Step {currentStep} of 4
            </span>
            <Link
              href="/owner"
              className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Exit
            </Link>
          </div>
        </div>

        {/* Airbnb-style Progress Bar */}
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-[#2FD08A] to-[#FFC93C] transition-all duration-300"
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
              <span className="rounded-full bg-[#0B1F3A] text-white px-2.5 py-0.5 text-xs font-bold">
                Step {currentStep}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2FD08A]">
                {currentStep === 1 && "Space Details"}
                {currentStep === 2 && "Exact Location"}
                {currentStep === 3 && "Pricing & Visuals"}
                {currentStep === 4 && "Weekly Availability"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] tracking-tight">
              {currentStep === 1 && "Tell us about your parking space"}
              {currentStep === 2 && "Where is your space located?"}
              {currentStep === 3 && "Set your hourly rate and photos"}
              {currentStep === 4 && "When is your space open for parking?"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {currentStep === 1 && "Start with an inviting title, description, and street address."}
              {currentStep === 2 && "Drop a pin on OpenStreetMap to guide drivers turn-by-turn."}
              {currentStep === 3 && "Set a competitive hourly price in INR (₹) and upload photos."}
              {currentStep === 4 && "Define recurring hours drivers can reserve your spot."}
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
                    placeholder="e.g. Secure Covered Driveway near Cyber City"
                    className="mt-1.5 h-12 rounded-xl border-slate-200 text-sm font-medium focus-visible:ring-[#2FD08A]"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Catchy titles highlight safety, location, and vehicle suitability.
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
                    placeholder="e.g. Spacious gated parking bay fitting any SUV/Sedan. Well-lit with 24/7 CCTV surveillance. Easy straight-in pull. 3-minute walk to metro station."
                    className="mt-1.5 rounded-xl border-slate-200 text-sm font-medium focus-visible:ring-[#2FD08A]"
                  />
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
                      placeholder="e.g. Flat 4B, Sector 29, Golf Course Road, Gurugram"
                      className="h-12 rounded-xl border-slate-200 pl-10 text-sm font-medium focus-visible:ring-[#2FD08A]"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Exact address is only revealed to drivers with confirmed reservations.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Location (Leaflet Map) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1F3A]">OpenStreetMap Location Pin</h3>
                    <p className="text-xs text-slate-500">
                      Click anywhere on the map to place the exact pin for drivers.
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
                    <span>Lat: {latitude.toFixed(4)}</span>
                    <span>•</span>
                    <span>Lng: {longitude.toFixed(4)}</span>
                  </div>
                </div>

                {/* Leaflet Interactive Map */}
                <LocationPickerMap
                  latitude={latitude}
                  longitude={longitude}
                  onLocationChange={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />

                {/* Coordinate Input fallback */}
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
                  <p className="mt-2 text-xs text-slate-500">
                    Recommended urban average: ₹40 - ₹90 per hour depending on proximity to transit and offices.
                  </p>
                </div>

                {/* Photo URL */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="photoUrl" className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                      Space Photo URL <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-slate-400">Preview below</span>
                  </div>

                  <Input
                    id="photoUrl"
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/driveway-photo.jpg"
                    className="h-11 rounded-xl border-slate-200 text-xs font-medium focus-visible:ring-[#2FD08A]"
                  />

                  {/* Preset quick picks */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">Or choose a sample photo:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {SAMPLE_PHOTO_PRESETS.map((preset, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setPhotoUrl(preset.url)}
                          className={`rounded-xl border p-2 text-left text-xs transition-all ${
                            photoUrl === preset.url
                              ? "border-[#2FD08A] bg-[#2FD08A]/10 font-bold text-[#0B1F3A]"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {preset.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Large Photo Preview Card */}
                  <div className="pt-3">
                    <p className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wide mb-2">
                      Listing Photo Preview
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
                          No photo URL provided
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                        ₹{pricePerHour || "0"} / hr
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
                      Drivers can only reserve your space during these approved windows.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addAllWeekPreset}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Set 24/7 All Week
                    </button>
                    <button
                      type="button"
                      onClick={addSlot}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F3A] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#163359]"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#2FD08A]" />
                      <span>Add Slot</span>
                    </button>
                  </div>
                </div>

                {/* Slot rows */}
                <div className="space-y-3">
                  {availabilitySlots.map((slot, index) => (
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

                {/* Listing Summary Preview */}
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
                      <p className="font-semibold text-slate-200 truncate">{address || "No address"}</p>
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

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                variant="outline"
                className="h-12 rounded-xl px-6 text-sm font-bold text-[#0B1F3A] border-slate-300"
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
                className="h-12 rounded-xl bg-[#0B1F3A] px-8 text-sm font-bold text-white shadow-soft hover:bg-[#163359]"
              >
                Next Step <ArrowRight className="h-4 w-4 ml-2 text-[#2FD08A]" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || success}
                className="h-12 rounded-xl bg-[#2FD08A] px-10 text-sm font-bold text-[#0B1F3A] shadow-soft hover:bg-[#26b878]"
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
