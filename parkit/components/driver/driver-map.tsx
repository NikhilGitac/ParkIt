"use client";

import { useEffect, useRef, memo } from "react";
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ParkingSpace } from "@/lib/parking-data";
import { Navigation, Crosshair } from "lucide-react";

// Marker HTML generator for price pills (Uber / Airbnb style)
function createPriceIcon(price: number, isSelected: boolean, isBestMatch: boolean) {
  let bgClass = isSelected
    ? "bg-[#2FD08A] text-[#0B1F3A] font-extrabold ring-4 ring-[#2FD08A]/40 scale-115 shadow-2xl z-50"
    : isBestMatch
    ? "bg-[#FFC93C] text-[#0B1F3A] font-bold shadow-md hover:scale-105"
    : "bg-[#0B1F3A] text-white font-semibold shadow-md hover:scale-105 hover:bg-[#163359]";

  const badgeTag = isBestMatch && !isSelected
    ? `<span style="position: absolute; top: -8px; right: -6px; background: #FFC93C; color: #0B1F3A; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 9999px; border: 1px solid #0B1F3A;">★</span>`
    : "";

  return L.divIcon({
    className: "parkit-price-pin",
    html: `
      <div style="position: relative; display: inline-flex; align-items: center; justify-content: center;">
        ${badgeTag}
        <div class="parkit-pill ${bgClass}" style="
          padding: 5px 10px;
          border-radius: 20px;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          line-height: 1;
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
          border: 1.5px solid rgba(255,255,255,0.9);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        ">
          <span style="font-size: 11px; opacity: 0.85;">₹</span>${price}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid ${isSelected ? "#2FD08A" : isBestMatch ? "#FFC93C" : "#0B1F3A"};
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
        "></div>
      </div>
    `,
    iconSize: [60, 32],
    iconAnchor: [30, 32],
    popupAnchor: [0, -32],
  });
}

// User current location pulsing beacon
const userLocationIcon = L.divIcon({
  className: "user-loc-beacon",
  html: `
    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: rgba(47, 208, 138, 0.35);
        animation: parkit-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: relative;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background-color: #2FD08A;
        border: 2.5px solid #FFFFFF;
        box-shadow: 0 2px 8px rgba(11, 31, 58, 0.4);
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Helper component to smoothly center/fly map when selected space changes
function MapController({
  centerLat,
  centerLng,
  zoom,
  selectedSpace,
}: {
  centerLat: number;
  centerLng: number;
  zoom?: number;
  selectedSpace: ParkingSpace | null;
}) {
  const map = useMap();
  const prevSpaceId = useRef<string | null>(null);

  useEffect(() => {
    if (selectedSpace && selectedSpace.id !== prevSpaceId.current) {
      prevSpaceId.current = selectedSpace.id;
      map.flyTo([selectedSpace.latitude, selectedSpace.longitude], 15, {
        animate: true,
        duration: 0.7,
      });
    }
  }, [selectedSpace, map]);

  return null;
}

interface DriverMapProps {
  userLocation: { lat: number; lng: number } | null;
  spaces: ParkingSpace[];
  selectedSpace: ParkingSpace | null;
  bestMatchId: string | null;
  onSelectSpace: (space: ParkingSpace) => void;
  onRecenter: () => void;
}

function DriverMapInner({
  userLocation,
  spaces,
  selectedSpace,
  bestMatchId,
  onSelectSpace,
  onRecenter,
}: DriverMapProps) {
  const fallbackCenter = [28.4744, 77.5039] as [number, number];
  const initialCenter = userLocation
    ? ([userLocation.lat, userLocation.lng] as [number, number])
    : fallbackCenter;

  return (
    <div className="relative w-full h-full">
      <style jsx global>{`
        @keyframes parkit-ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          background-color: #f1f5f9;
          font-family: inherit;
        }
        .parkit-price-pin {
          background: transparent;
          border: none;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 14px rgba(11, 31, 58, 0.12) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background-color: #ffffff !important;
          color: #0b1f3a !important;
          border-bottom: 1px solid #e2e8f0 !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-weight: bold;
        }
        .leaflet-control-zoom a:hover {
          background-color: #f8fafc !important;
          color: #2fd08a !important;
        }
      `}</style>

      <MapContainer
        center={initialCenter}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {/* OpenStreetMap Standard Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <ZoomControl position="topright" />

        <MapController
          centerLat={initialCenter[0]}
          centerLng={initialCenter[1]}
          selectedSpace={selectedSpace}
        />

        {/* User Location Pulsing Beacon */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
            zIndexOffset={100}
          />
        )}

        {/* Parking Space Price Pill Pins */}
        {spaces.map((space) => {
          const isSelected = selectedSpace?.id === space.id;
          const isBestMatch = bestMatchId === space.id;
          const icon = createPriceIcon(space.price_per_hour, isSelected, isBestMatch);

          return (
            <Marker
              key={space.id}
              position={[space.latitude, space.longitude]}
              icon={icon}
              zIndexOffset={isSelected ? 500 : isBestMatch ? 300 : 100}
              eventHandlers={{
                click: () => onSelectSpace(space),
              }}
            />
          );
        })}
      </MapContainer>

      {/* Uber-Style Floating "Recenter / Locate Me" Button */}
      <button
        onClick={onRecenter}
        aria-label="Recenter Map to My Location"
        className="absolute bottom-36 md:bottom-8 right-4 md:right-8 z-[800] bg-white hover:bg-slate-50 text-[#0B1F3A] hover:text-[#2FD08A] w-12 h-12 rounded-full shadow-soft-lg border border-slate-200/90 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Crosshair className="w-5 h-5 transition-transform group-hover:rotate-45" />
      </button>
    </div>
  );
}

export default memo(DriverMapInner);
