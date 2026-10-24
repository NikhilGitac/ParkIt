"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";

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
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(11, 31, 58, 0.35);
    ">
      <div style="transform: rotate(45deg); font-size: 14px; font-weight: 800; color: #2FD08A;">
        P
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
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
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[360px] w-full items-center justify-center rounded-[16px] bg-slate-100 border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Navigation className="h-4 w-4 animate-spin text-[#2FD08A]" />
          <span>Loading map engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[380px] w-full overflow-hidden rounded-[16px] border border-slate-200 shadow-soft">
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

      {/* Coordinate & Helper Badge Overlay */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[400] flex flex-wrap items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-[#0B1F3A] shadow-md backdrop-blur border border-slate-200">
        <MapPin className="h-3.5 w-3.5 text-[#2FD08A] shrink-0" />
        <span>Click anywhere to adjust spot position:</span>
        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700">
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </span>
      </div>
    </div>
  );
}
