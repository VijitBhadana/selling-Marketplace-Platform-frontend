import { cookies } from 'next/headers';
import { LEGACY_CITY_COOKIE, LOCATION_COOKIE, parseLocationCookie, type UserLocation } from './user-location';

/** The visitor's chosen location from the location picker's cookie, or null for "everywhere". */
export function getUserLocation(): UserLocation | null {
  const jar = cookies();
  return parseLocationCookie(jar.get(LOCATION_COOKIE)?.value, jar.get(LEGACY_CITY_COOKIE)?.value);
}
