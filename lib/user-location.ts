// The visitor's chosen location, used to show shops, services and jobs near them. Kept in
// a cookie (not just localStorage) so server-rendered pages — home, Cloude pages — can
// filter by it too.

export type UserLocation = { city: string; pincode?: string; lat?: number; lng?: number };

export const LOCATION_COOKIE = 'dc_loc';
// Older builds stored only the city under this name — still read so nobody loses theirs.
export const LEGACY_CITY_COOKIE = 'dc_city';
export const LOCATION_CHANGE_EVENT = 'dc-location-change';
const PROMPTED_KEY = 'dc_location_prompted';
const CLEARED_KEY = 'dc_location_cleared';

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
  try {
    if (loc) localStorage.removeItem(CLEARED_KEY);
    else localStorage.setItem(CLEARED_KEY, '1');
  } catch {
    // storage blocked — only means a cleared location may get detected again
  }
  window.dispatchEvent(new CustomEvent(LOCATION_CHANGE_EVENT, { detail: loc }));
}

/** True when the visitor chose "all cities", which automatic detection must respect. */
export function locationWasCleared() {
  try {
    return localStorage.getItem(CLEARED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Straight-line km from the visitor to a shop, or undefined when either has no coordinates. */
export function distanceKm(
  from: UserLocation | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined,
): number | undefined {
  if (from?.lat == null || from.lng == null || lat == null || lng == null) return undefined;
  const rad = Math.PI / 180;
  const dLat = (lat - from.lat) * rad;
  const dLng = (lng - from.lng) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** "800 m" / "1.4 km" / "12 km". */
export function formatDistance(km: number) {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
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

/**
 * Calls `onAllowed` whenever this site may read location without asking: right away if it
 * already can, the moment access is granted (even from the site settings), and on coming
 * back to the tab — there's no event for the phone's own Location switch being turned on.
 * Browsers without the Permissions API simply never call it. Returns a stop function.
 */
export function watchLocationAccess(onAllowed: () => void) {
  let status: PermissionStatus | undefined;
  let stopped = false;
  const check = () => {
    if (status?.state === 'granted' && document.visibilityState === 'visible') onAllowed();
  };
  navigator.permissions
    ?.query({ name: 'geolocation' })
    .then((s) => {
      if (stopped) return;
      status = s;
      s.addEventListener('change', check);
      document.addEventListener('visibilitychange', check);
      check();
    })
    .catch(() => {});
  return () => {
    stopped = true;
    status?.removeEventListener('change', check);
    document.removeEventListener('visibilitychange', check);
  };
}

type NominatimAddress = Record<string, string | undefined>;

function cityFrom(addr: NominatimAddress) {
  return addr.city || addr.town || addr.municipality || addr.village || addr.state_district || addr.county || '';
}

function round(n: number) {
  return Math.round(n * 10000) / 10000;
}

/**
 * Why getCurrentPosition failed, worded so the visitor can fix it. Once a site's location
 * permission is blocked (or auto-blocked after dismissed prompts) the browser never asks
 * again, so the only way back is the site settings.
 */
export function locationErrorMessage(err: GeolocationPositionError, fallback = 'type your city instead') {
  if (err.code === err.PERMISSION_DENIED) {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      return `Location only works on a secure (https://) page — ${fallback}.`;
    }
    return `Location is blocked for this site. Tap the lock icon next to the address bar → Permissions → Location → Allow, then try again — or ${fallback}.`;
  }
  if (err.code === err.TIMEOUT) return `Finding your location took too long — try again, or ${fallback}.`;
  return `Could not get your location — check your phone's Location is turned on, or ${fallback}.`;
}

// Accuracy (metres) that's good enough to stop listening straight away.
const GOOD_FIX_METRES = 30;
// How long to keep improving once a first reading is in.
const SETTLE_MS = 6000;

/**
 * The most accurate reading the device gives within a few seconds. The first fix is usually
 * a rough Wi-Fi/cell one and GPS tightens it after that, so this listens rather than taking
 * a single reading. The timers only start once a reading arrives (the browser's own timeout
 * likewise waits for the permission prompt), so a slow "Allow" tap costs no accuracy. With
 * no fresh fix at all (laptops, indoors) it falls back to a rough or recent position.
 * Rejects with the GeolocationPositionError.
 */
export function preciseCoords(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    const geo = navigator.geolocation;
    let best: GeolocationCoordinates | undefined;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let done = false;

    const finish = (err?: GeolocationPositionError) => {
      if (done) return;
      done = true;
      clearTimeout(settle);
      geo.clearWatch(watchId);
      if (best) resolve(best);
      else if (err?.code === err?.PERMISSION_DENIED) reject(err);
      else {
        geo.getCurrentPosition(({ coords }) => resolve(coords), reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 10 * 60 * 1000,
        });
      }
    };

    const watchId = geo.watchPosition(
      ({ coords }) => {
        if (!best || coords.accuracy < best.accuracy) best = coords;
        if (best.accuracy <= GOOD_FIX_METRES) finish();
        else settle ??= setTimeout(finish, SETTLE_MS);
      },
      finish,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

/** Nominatim sometimes returns "110001;110002" or "110 001" — keeps the first clean 6-digit pincode. */
export function cleanPincode(postcode: string | undefined) {
  return postcode
    ?.replace(/\s/g, '')
    .split(/[;,]/)
    .find((p) => /^\d{6}$/.test(p));
}

/** Coordinates → address parts, via OpenStreetMap's reverse geocoder. */
export async function reverseGeocode(lat: number, lng: number): Promise<NominatimAddress> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en&lat=${lat}&lon=${lng}`,
  );
  return (await res.json())?.address ?? {};
}

/** Browser geolocation → city + pincode. Rejects with a message the picker can show as-is. */
export async function detectLocation(): Promise<UserLocation> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    throw new Error("Location isn't supported in this browser — type your city instead.");
  }
  let coords: GeolocationCoordinates;
  try {
    coords = await preciseCoords();
  } catch (err) {
    throw new Error(locationErrorMessage(err as GeolocationPositionError));
  }
  let addr: NominatimAddress;
  try {
    addr = await reverseGeocode(coords.latitude, coords.longitude);
  } catch {
    throw new Error('Could not detect your location — type your city instead.');
  }
  const city = cityFrom(addr);
  if (!city) throw new Error('Could not work out your city — type it instead.');
  return { city, pincode: cleanPincode(addr.postcode), lat: round(coords.latitude), lng: round(coords.longitude) };
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
