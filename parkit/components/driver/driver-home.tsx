"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  ParkingSpace,
  GREATER_NOIDA_CENTER,
  fetchSpacesFromSupabase,
  calculateDistanceKm,
} from "@/lib/parking-data";
import { FloatingSearchBar } from "./search-bar";
import { BottomSheet } from "./bottom-sheet";
import { FilterModal, FilterState, DEFAULT_FILTERS } from "./filter-modal";
import { Loader2, Car, Compass, AlertCircle } from "lucide-react";

// Dynamically import Leaflet Map to avoid SSR errors
const DriverMap = dynamic(() => import("./driver-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-[#2FD08A] mb-3" />
      <p className="text-sm font-semibold text-[#0B1F3A]">Loading interactive map...</p>
      <p className="text-xs text-slate-400 mt-1">Connecting to OpenStreetMap</p>
    </div>
  ),
});

export function DriverHome() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // 1. Determine user location (Browser Geolocation with Greater Noida fallback)
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
          };
          setUserLocation(coords);
        },
        () => {
          // Geolocation denied or unavailable: use fallback
          setUserLocation({
            lat: GREATER_NOIDA_CENTER.lat,
            lng: GREATER_NOIDA_CENTER.lng,
          });
        },
        { timeout: 7000 }
      );
    } else {
      setUserLocation({
        lat: GREATER_NOIDA_CENTER.lat,
        lng: GREATER_NOIDA_CENTER.lng,
      });
    }
  }, []);

  // 2. Fetch parking spaces once location is resolved
  useEffect(() => {
    const lat = userLocation ? userLocation.lat : GREATER_NOIDA_CENTER.lat;
    const lng = userLocation ? userLocation.lng : GREATER_NOIDA_CENTER.lng;

    async function loadData() {
      setLoading(true);
      const data = await fetchSpacesFromSupabase(lat, lng);
      setSpaces(data);
      if (data.length > 0 && !selectedSpace) {
        setSelectedSpace(data[0]);
      }
      setLoading(false);
    }

    loadData();
  }, [userLocation]);

  // 3. Recalculate distances if userLocation updates
  const spacesWithDistance = useMemo(() => {
    const currentLat = userLocation?.lat ?? GREATER_NOIDA_CENTER.lat;
    const currentLng = userLocation?.lng ?? GREATER_NOIDA_CENTER.lng;

    return spaces.map((s) => ({
      ...s,
      distance_km: calculateDistanceKm(currentLat, currentLng, s.latitude, s.longitude),
    }));
  }, [spaces, userLocation]);

  // 4. Apply search query & filters
  const filteredSpaces = useMemo(() => {
    return spacesWithDistance.filter((space) => {
      // Search matching title, address, or amenities
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = space.title.toLowerCase().includes(q);
        const matchesAddress = space.address.toLowerCase().includes(q);
        const matchesAmenity = space.amenities.some((a) => a.toLowerCase().includes(q));
        if (!matchesTitle && !matchesAddress && !matchesAmenity) return false;
      }

      // Max price filter
      if (space.price_per_hour > filters.maxPrice) return false;

      // Max distance filter
      if (filters.maxDistance < 25 && space.distance_km !== undefined) {
        if (space.distance_km > filters.maxDistance) return false;
      }

      // Available now filter
      if (filters.availableNowOnly && !space.is_available_now) return false;

      // Min rating filter
      if (filters.minRating > 0 && space.rating < filters.minRating) return false;

      return true;
    });
  }, [spacesWithDistance, searchQuery, filters]);

  // 5. Compute ranked order and Top "Best Match"
  const rankedSpaces = useMemo(() => {
    return [...filteredSpaces].sort((a, b) => {
      // Composite match score:
      // - Higher rating is better
      // - Available now gives a bonus
      // - Shorter distance is better
      // - Lower price is better
      const scoreA =
        (a.rating / 5) * 40 +
        (a.is_available_now ? 25 : 0) +
        Math.max(0, 30 - (a.distance_km || 0) * 2) +
        Math.max(0, 20 - a.price_per_hour * 0.2);

      const scoreB =
        (b.rating / 5) * 40 +
        (b.is_available_now ? 25 : 0) +
        Math.max(0, 30 - (b.distance_km || 0) * 2) +
        Math.max(0, 20 - b.price_per_hour * 0.2);

      return scoreB - scoreA;
    });
  }, [filteredSpaces]);

  // Best match ID is the top ranked item
  const bestMatchId = rankedSpaces.length > 0 ? rankedSpaces[0].id : null;

  // Handle selecting space
  const handleSelectSpace = useCallback((space: ParkingSpace) => {
    setSelectedSpace(space);
  }, []);

  // Handle recentering map to user location
  const handleRecenter = useCallback(() => {
    if (userLocation) {
      // Find nearest space or center directly
      const nearest = [...spacesWithDistance].sort(
        (a, b) => (a.distance_km || 0) - (b.distance_km || 0)
      )[0];
      if (nearest) setSelectedSpace(nearest);
    }
  }, [userLocation, spacesWithDistance]);

  // Quick filter toggle callbacks
  const handleQuickToggleAvailableNow = () => {
    setFilters((prev) => ({ ...prev, availableNowOnly: !prev.availableNowOnly }));
  };

  const handleQuickTogglePrice40 = () => {
    setFilters((prev) => ({
      ...prev,
      maxPrice: prev.maxPrice === 40 ? 100 : 40,
    }));
  };

  const handleQuickToggleDistance5 = () => {
    setFilters((prev) => ({
      ...prev,
      maxDistance: prev.maxDistance === 5 ? 25 : 5,
    }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none">
      {/* 1. Floating Top Search Bar with Quick Filter Chips */}
      <FloatingSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onOpenFilterModal={() => setIsFilterModalOpen(true)}
        onQuickToggleAvailableNow={handleQuickToggleAvailableNow}
        onQuickTogglePrice40={handleQuickTogglePrice40}
        onQuickToggleDistance5={handleQuickToggleDistance5}
        totalSpacesCount={rankedSpaces.length}
      />

      {/* 2. Full-Screen Interactive Leaflet Map */}
      <div className="w-full h-full">
        <DriverMap
          userLocation={userLocation}
          spaces={rankedSpaces}
          selectedSpace={selectedSpace}
          bestMatchId={bestMatchId}
          onSelectSpace={handleSelectSpace}
          onRecenter={handleRecenter}
        />
      </div>

      {/* 3. Draggable Bottom Sheet with Airbnb Cards */}
      <BottomSheet
        spaces={rankedSpaces}
        bestMatchId={bestMatchId}
        selectedSpace={selectedSpace}
        onSelectSpace={handleSelectSpace}
        onOpenFilters={() => setIsFilterModalOpen(true)}
      />

      {/* 4. Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
        matchCount={rankedSpaces.length}
      />
    </div>
  );
}
