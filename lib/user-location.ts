// The visitor's chosen location, used to show shops, services and jobs near them. Kept in
// a cookie (not just localStorage) so server-rendered pages — home, Cloude pages — can
// filter by it too.

export type UserLocation = { city: string; pincode?: string; lat?: number; lng?: number };

export const LOCATION_COOKIE = 'dc_loc';
// Older builds stored only the city under this name — still read so nobody loses theirs.
export const LEGACY_CITY_COOKIE = 'dc_city';
export const LOCATION_CHANGE_EVENT = 'dc-location-change';
const PROMPTED_KEY = 'dc_location_prompted';

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/** Parses the cookie value; shared with the server-side reader. */
export function parseLocationCookie(raw: string | undefined, legacyCity?: string): UserLocation | null {
  if (raw) {
    try {
      const v = JSON.parse(safeDecode(raw));
      if (v && typeof v.city === 'string' && v.city.trim()) {
        return {
          city: v.city.trim(),
          pincode: typeof v.pincode === 'string' && v.pincode ? v.pincode : undefined,
          lat: Number.isFinite(v.lat) ? v.lat : undefined,
          lng: Number.isFinite(v.lng) ? v.lng : undefined,
        };
      }
    } catch {
      // unreadable cookie — treat as no location
    }
  }
  const city = legacyCity ? safeDecode(legacyCity).trim() : '';
  return city ? { city } : null;
}

function readCookie(name: string) {
  return document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];
}

export function readLocation(): UserLocation | null {
  if (typeof document === 'undefined') return null;
  return parseLocationCookie(readCookie(LOCATION_COOKIE), readCookie(LEGACY_CITY_COOKIE));
}

/** Query params the backend's "near" filters take (see backend common/nearby.ts). */
export function nearParams(loc: UserLocation | null | undefined): Record<string, string | undefined> {
  if (!loc) return {};
  return {
    city: loc.city,
    pincode: loc.pincode,
    lat: loc.lat != null ? String(loc.lat) : undefined,
    lng: loc.lng != null ? String(loc.lng) : undefined,
  };
}

/** Saves (or clears, with null) the location and tells every location picker on the page. */
export function saveLocation(loc: UserLocation | null) {
  const year = 60 * 60 * 24 * 365;
  document.cookie = loc
    ? `${LOCATION_COOKIE}=${encodeURIComponent(JSON.stringify(loc))}; path=/; max-age=${year}; SameSite=Lax`
    : `${LOCATION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${LEGACY_CITY_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent(LOCATION_CHANGE_EVENT, { detail: loc }));
}

/** True the first time it's called in this browser — gates the automatic permission prompt. */
export function shouldAutoPrompt() {
  try {
    if (localStorage.getItem(PROMPTED_KEY)) return false;
    localStorage.setItem(PROMPTED_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

type NominatimAddress = Record<string, string | undefined>;

function cityFrom(addr: NominatimAddress) {
  return addr.city || addr.town || addr.municipality || addr.village || addr.state_district || addr.county || '';
}

function round(n: number) {
  return Math.round(n * 10000) / 10000;
}

/**
 * Browser geolocation → city + pincode via OpenStreetMap's reverse geocoder (same lookup
 * the Post Ad form uses). Rejects with a message the picker can show as-is.
 */
export function detectLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error("Location isn't supported in this browser — type your city instead."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en&lat=${coords.latitude}&lon=${coords.longitude}`,
          );
          const addr: NominatimAddress = (await res.json())?.address ?? {};
          const city = cityFrom(addr);
          if (!city) {
            reject(new Error('Could not work out your city — type it instead.'));
            return;
          }
          resolve({ city, pincode: addr.postcode || undefined, lat: round(coords.latitude), lng: round(coords.longitude) });
        } catch {
          reject(new Error('Could not detect your location — type your city instead.'));
        }
      },
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied — type your city instead.'
              : 'Could not get your location — type your city instead.',
          ),
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

/**
 * A typed city or area → its coordinates, so nearby towns (~25 km) match too. Falls back
 * to the bare name when the lookup fails; the city match still works without coordinates.
 */
export async function locateTypedCity(name: string): Promise<UserLocation> {
  const city = name.trim();
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&accept-language=en&countrycodes=in&addressdetails=1&limit=1&q=${encodeURIComponent(city)}`,
    );
    const hit = (await res.json())?.[0];
    if (hit) {
      return { city, pincode: hit.address?.postcode || undefined, lat: round(Number(hit.lat)), lng: round(Number(hit.lon)) };
    }
  } catch {
    // offline / rate-limited — the city name alone is still useful
  }
  return { city };
}
