"use client";

import { useEffect, useState, memo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, ExternalLink } from "lucide-react";

const spotPinIcon = L.divIcon({
  className: "mini-spot-pin",
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
      box-shadow: 0 4px 14px rgba(11, 31, 58, 0.35);
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

interface MiniSpaceMapProps {
  latitude: number;
  longitude: number;
  title: string;
  address: string;
}

function MiniSpaceMap({ latitude, longitude, title, address }: MiniSpaceMapProps) {
  const [mapKey] = useState(() => "mini-map-" + Math.random().toString(36).substring(2, 9));

  useEffect(() => {
    return () => {
      const container = document.getElementById("mini-leaflet-map");
      if (container) {
        (container as any)._leaflet_id = null;
      }
    };
  }, []);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200/90 shadow-soft">
      <MapContainer
        key={mapKey}
        id="mini-leaflet-map"
        center={[latitude, longitude]}
        zoom={15}
        zoomControl={false}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <Marker position={[latitude, longitude]} icon={spotPinIcon}>
          <Popup>
            <div className="text-xs font-sans">
              <strong className="block text-[#0B1F3A] mb-0.5">{title}</strong>
              <span className="text-slate-500">{address}</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Get directions badge */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-[400] inline-flex items-center gap-1.5 bg-white/95 hover:bg-white text-[#0B1F3A] hover:text-[#26b878] text-xs font-bold px-3 py-1.5 rounded-xl shadow-md border border-slate-200 backdrop-blur-sm transition-all hover:scale-105"
      >
        <Navigation className="w-3.5 h-3.5 text-[#2FD08A]" />
        <span>Directions</span>
        <ExternalLink className="w-3 h-3 text-slate-400" />
      </a>
    </div>
  );
}

export default memo(MiniSpaceMap);
