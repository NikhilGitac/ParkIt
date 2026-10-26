"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Crosshair, Compass } from "lucide-react";

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

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

const CITY_PRESETS = [
  { name: "Delhi NCR", lat: 28.6139, lng: 77.209 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
];

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerMapProps) {
  const [mounted, setMounted] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-[16px] bg-slate-100 border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Navigation className="h-4 w-4 animate-spin text-[#2FD08A]" />
          <span>Loading OpenStreetMap engine...</span>
        </div>
      </div>
    );
  }

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
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-[#0B1F3A] hover:text-white transition-colors"
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
        <MapContainer
          center={[latitude, longitude]}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler
            onLocationSelect={(lat, lng) => {
              onLocationChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
            }}
          />
          <MapRecenter lat={latitude} lng={longitude} />
          <Marker position={[latitude, longitude]} icon={customIcon} />
        </MapContainer>

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
