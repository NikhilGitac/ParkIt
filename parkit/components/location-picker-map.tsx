"use client";

import { useEffect, useRef, useState, memo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Crosshair, Compass } from "lucide-react";

// Fix default Leaflet marker icon paths broken by bundlers
if (typeof window !== "undefined") {
  try {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  } catch {
    // Ignore in non-browser or test environments
  }
}

// Custom ParKit Pin Marker
const customIcon = L.divIcon({
  className: "custom-parkit-pin",
  html: `
    <div style="
      background-color: #0B1F3A;
      color: #2FD08A;
      border: 3px solid #2FD08A;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(11, 31, 58, 0.4);
    ">
      <div style="transform: rotate(45deg); font-size: 15px; font-weight: 800; color: #2FD08A; letter-spacing: -0.5px;">
        P
      </div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

const CITY_PRESETS = [
  { name: "Greater Noida", lat: 28.4744, lng: 77.5039 },
  { name: "Noida (Sector 18)", lat: 28.5708, lng: 77.3261 },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.209 },
  { name: "Gurugram", lat: 28.4595, lng: 77.0266 },
];

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);

  // Initialize Map directly with Leaflet
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 14,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker([latitude, longitude], {
      icon: customIcon,
      draggable: true,
      autoPan: true,
    }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      const lat = Number(pos.lat.toFixed(6));
      const lng = Number(pos.lng.toFixed(6));
      onLocationChange(lat, lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));
      marker.setLatLng([lat, lng]);
      onLocationChange(lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position and view when coordinates change (e.g. from autocomplete)
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    marker.setLatLng([latitude, longitude]);
    const targetZoom = Math.max(map.getZoom(), 16);
    map.flyTo([latitude, longitude], targetZoom, { duration: 0.8 });
  }, [latitude, longitude]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(
          Number(pos.coords.latitude.toFixed(6)),
          Number(pos.coords.longitude.toFixed(6))
        );
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-2">
      {/* City Quick Presets & Locate Me bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Compass className="h-3.5 w-3.5 text-slate-400" /> Jump to:
          </span>
          {CITY_PRESETS.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => onLocationChange(city.lat, city.lng)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                Math.abs(latitude - city.lat) < 0.05 &&
                Math.abs(longitude - city.lng) < 0.05
                  ? "border-[#2FD08A] bg-[#2FD08A]/10 text-[#0B1F3A]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0B1F3A] shadow-xs hover:bg-slate-50 transition-colors"
        >
          <Crosshair className={`h-3.5 w-3.5 text-[#2FD08A] ${locating ? "animate-spin" : ""}`} />
          <span>{locating ? "Locating..." : "Locate Me"}</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="relative h-[400px] w-full overflow-hidden rounded-[16px] border border-slate-200 shadow-soft">
        <div ref={containerRef} className="h-full w-full z-0" />

        {/* Selected Coordinates Overlay Badge */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[400] flex flex-wrap items-center gap-2 rounded-xl bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#0B1F3A] shadow-md backdrop-blur border border-slate-200/90">
          <MapPin className="h-4 w-4 text-[#2FD08A] shrink-0" />
          <span>Selected Spot Location:</span>
          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] text-[#0B1F3A] font-bold">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(LocationPickerMap);
