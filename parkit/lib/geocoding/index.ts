// ==============================================================================
// ParKit Geocoding Service Interface & Photon Implementation
// Swappable provider interface (e.g. Photon now, Google Places / Mapbox later)
// ==============================================================================

export interface NormalizedLocation {
  id: string;
  label: string;
  lat: number;
  lon: number;
  houseNumber: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

export interface GeocodeSuggestion extends NormalizedLocation {
  // Backwards compatibility aliases
  latitude: number;
  longitude: number;
  name: string;
  district?: string;
  house_number?: string;
  formatted_address: string;
  address?: {
    label: string;
    name?: string;
    house_no?: string;
    building_name?: string;
    street?: string;
    district?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

export interface GeocoderProvider {
  name: string;
  search(
    query: string,
    options?: { lat?: number; lon?: number; limit?: number }
  ): Promise<{ suggestions: GeocodeSuggestion[]; error?: string; status?: number }>;
  reverse(
    lat: number,
    lon: number
  ): Promise<{ result: GeocodeSuggestion | null; error?: string; status?: number }>;
}

// In-memory LRU / TTL cache for geocoding queries (5 minutes TTL)
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const searchCache = new Map<string, CacheEntry<GeocodeSuggestion[]>>();
const reverseCache = new Map<string, CacheEntry<GeocodeSuggestion | null>>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = map.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    map.delete(key);
    return null;
  }
  return entry.data;
}

function setCached<T>(map: Map<string, CacheEntry<T>>, key: string, data: T) {
  if (map.size > 200) {
    const firstKey = map.keys().next().value;
    if (firstKey) map.delete(firstKey);
  }
  map.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export class PhotonGeocoder implements GeocoderProvider {
  name = "Photon (Komoot/OSM)";

  private normalizeFeature(feature: any, idx: number): GeocodeSuggestion | null {
    if (
      !feature?.geometry?.coordinates ||
      !Array.isArray(feature.geometry.coordinates) ||
      feature.geometry.coordinates.length < 2
    ) {
      return null;
    }

    // GeoJSON coordinates are [lon, lat]
    const rawLon = feature.geometry.coordinates[0];
    const rawLat = feature.geometry.coordinates[1];

    const lon = typeof rawLon === "number" ? rawLon : parseFloat(rawLon);
    const lat = typeof rawLat === "number" ? rawLat : parseFloat(rawLat);

    if (isNaN(lat) || isNaN(lon)) return null;

    const props = feature.properties || {};

    const name = String(props.name ?? "").trim();
    const houseNumber = String(props.housenumber ?? "").trim();
    const street = String(props.street ?? "").trim();
    const area = String(props.district ?? props.suburb ?? props.locality ?? "").trim();
    const city = String(props.city ?? props.town ?? props.village ?? props.county ?? "").trim();
    const state = String(props.state ?? "").trim();
    const pincode = String(props.postcode ?? "").trim();
    const country = String(props.country ?? "India").trim();

    // Compose a human-readable clean address label
    const labelParts = [
      name,
      houseNumber ? `No. ${houseNumber}` : null,
      street,
      area && area !== street ? area : null,
      city,
      state,
      pincode,
    ].filter(Boolean);

    const uniqueParts = Array.from(new Set(labelParts));
    const label = uniqueParts.length > 0 ? uniqueParts.join(", ") : name || "Location in NCR";

    const id = props.osm_id
      ? String(props.osm_id)
      : `photon-${idx}-${lat.toFixed(5)}-${lon.toFixed(5)}`;

    return {
      id,
      label,
      lat,
      lon,
      houseNumber,
      street: street || (area && area !== name ? area : "") || name,
      area,
      city: city || "Greater Noida",
      state: state || "Uttar Pradesh",
      pincode,

      // Aliases for compatibility
      latitude: lat,
      longitude: lon,
      name,
      district: area,
      house_number: houseNumber,
      formatted_address: label,
      address: {
        label,
        name,
        house_no: houseNumber,
        building_name:
          props.osm_value === "apartments" || props.osm_value === "building" ? name : "",
        street: street || area || name,
        district: area,
        city: city || "Greater Noida",
        state: state || "Uttar Pradesh",
        pincode,
        country,
      },
    };
  }

  async search(
    query: string,
    options: { lat?: number; lon?: number; limit?: number } = {}
  ): Promise<{ suggestions: GeocodeSuggestion[]; error?: string; status?: number }> {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 3) {
      return { suggestions: [] };
    }

    const lat = options.lat ?? 28.4744; // Greater Noida NCR bias
    const lon = options.lon ?? 77.5039;
    const limit = Math.min(Math.max(options.limit ?? 5, 1), 10);

    const cacheKey = `search_${cleanQuery.toLowerCase()}_${lat.toFixed(3)}_${lon.toFixed(3)}_${limit}`;
    const cached = getCached(searchCache, cacheKey);
    if (cached) return { suggestions: cached };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const url = new URL("https://photon.komoot.io/api/");
      url.searchParams.set("q", cleanQuery);
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lon));
      url.searchParams.set("limit", String(limit));

      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent": "ParKit-UrbanParking/1.0 (https://parkit.test; support@parkit.test)",
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 429) {
        return {
          suggestions: [],
          error: "Geocoding rate limit reached. Please wait a moment.",
          status: 429,
        };
      }

      if (!res.ok) {
        return {
          suggestions: [],
          error: `Geocoding provider returned HTTP ${res.status}`,
          status: res.status >= 500 ? 502 : res.status,
        };
      }

      const json = await res.json().catch(() => null);
      if (!json || !Array.isArray(json.features)) {
        return { suggestions: [] };
      }

      const suggestions: GeocodeSuggestion[] = [];
      json.features.forEach((feat: any, idx: number) => {
        const item = this.normalizeFeature(feat, idx);
        if (item) suggestions.push(item);
      });

      setCached(searchCache, cacheKey, suggestions);
      return { suggestions };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === "AbortError";
      const errorMsg = isAbort
        ? "Geocoding request timed out"
        : "Failed to connect to geocoding provider";
      return {
        suggestions: [],
        error: errorMsg,
        status: 504,
      };
    }
  }

  async reverse(
    lat: number,
    lon: number
  ): Promise<{ result: GeocodeSuggestion | null; error?: string; status?: number }> {
    const cacheKey = `rev_${lat.toFixed(5)}_${lon.toFixed(5)}`;
    const cached = getCached(reverseCache, cacheKey);
    if (cached !== null) return { result: cached };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const url = new URL("https://photon.komoot.io/reverse");
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lon));

      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent": "ParKit-UrbanParking/1.0 (https://parkit.test; support@parkit.test)",
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 429) {
        return {
          result: null,
          error: "Reverse geocoding rate limit reached.",
          status: 429,
        };
      }

      if (!res.ok) {
        return {
          result: null,
          error: `Reverse geocoding returned HTTP ${res.status}`,
          status: res.status >= 500 ? 502 : res.status,
        };
      }

      const json = await res.json().catch(() => null);
      const features = Array.isArray(json?.features) ? json.features : [];
      if (features.length === 0) {
        return { result: null };
      }

      const result = this.normalizeFeature(features[0], 0);
      setCached(reverseCache, cacheKey, result);
      return { result };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === "AbortError";
      const errorMsg = isAbort
        ? "Reverse geocoding request timed out"
        : "Failed to connect to reverse geocoder";
      return {
        result: null,
        error: errorMsg,
        status: 504,
      };
    }
  }
}

export const defaultGeocoder: GeocoderProvider = new PhotonGeocoder();
