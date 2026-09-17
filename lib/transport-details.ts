// Agriculture & Farmer Cloude: shops posted under Tata Ace Mini Truck, Goods Loading &
// Transport or Farm-to-Market Delivery list vehicles instead of goods. The seller fills in
// what the vehicle is, how much it carries, the delivery charge (per trip / per km) and the
// hourly hire rate; the buyer says from where to where, what goods and when.
// Mirrors backend/src/modules/products/transport-details.ts (buyer side: cart/booking-details.ts).

import { formatRupees, getBookingKind, type PriceUnit } from './booking-details';

export const TRANSPORT_VEHICLES = [
  'Tata Ace / Chhota Hathi',
  'Pickup (Bolero / Dost)',
  'Mini Truck (407 / Eicher)',
  'Tractor Trolley',
  'Truck (6+ wheels)',
  'E-Rickshaw Loader',
  'Other',
];

export type TransportService = 'DELIVERY' | 'HOURLY';
export type DeliveryChargeUnit = 'PER_TRIP' | 'PER_KM';

export type TransportDetails = {
  vehicleType: string;
  otherVehicle?: string;
  capacity: string;
  services: TransportService[];
  deliveryCharge?: number;
  deliveryChargeUnit?: DeliveryChargeUnit;
  hourlyRate?: number;
  /** Shortest hire the seller accepts (only stored when more than 1 hour). */
  minHours?: number;
  loadingHelp: boolean;
  serviceArea?: string;
};

export const SERVICE_LABELS: Record<TransportService, string> = {
  DELIVERY: 'Goods delivery',
  HOURLY: 'Truck on hire',
};

export function isTransportShop(cloudeSlug?: string | null, categorySlug?: string | null) {
  return getBookingKind(cloudeSlug, categorySlug) === 'TRANSPORT';
}

/** Vehicles added before sellers could fill in rates have none — they can't be booked until edited. */
export function hasTransportRates(d?: TransportDetails | null): d is TransportDetails {
  return Array.isArray(d?.services) && d.services.length > 0;
}

export function offersService(d: TransportDetails | null | undefined, service: TransportService) {
  return hasTransportRates(d) && d.services.includes(service);
}

export function vehicleName(d: TransportDetails) {
  return d.vehicleType === 'Other' ? d.otherVehicle || 'Vehicle' : d.vehicleType;
}

/** '₹500 / trip' or '₹25 / km' */
export function deliveryChargeText(d: TransportDetails) {
  return `${formatRupees(Number(d.deliveryCharge))} / ${d.deliveryChargeUnit === 'PER_KM' ? 'km' : 'trip'}`;
}

/** '₹400 / hour' */
export function hourlyRateText(d: TransportDetails) {
  return `${formatRupees(Number(d.hourlyRate))} / hour`;
}

export function minHoursOf(d: TransportDetails | null | undefined) {
  return Number(d?.minHours) || 1;
}

/** Same maths as the backend's transportQuote(): the rate for the buyer's chosen service, and what it's per. */
export function transportQuote(
  d: TransportDetails | null | undefined,
  service: unknown,
): { unitPrice: number; priceUnit: PriceUnit } | null {
  if (service === 'HOURLY' && offersService(d, 'HOURLY')) return { unitPrice: Number(d!.hourlyRate) || 0, priceUnit: 'PER_HOUR' };
  if (service === 'DELIVERY' && offersService(d, 'DELIVERY')) {
    return { unitPrice: Number(d!.deliveryCharge) || 0, priceUnit: d!.deliveryChargeUnit === 'PER_KM' ? 'PER_KM' : 'FIXED' };
  }
  return null;
}

/** Label/value rows for the full vehicle sheet. */
export function formatTransportDetails(d: TransportDetails | null | undefined): { label: string; value: string }[] {
  if (!hasTransportRates(d)) return [];
  const rows: [string, string | undefined][] = [
    ['Vehicle', vehicleName(d)],
    ['Load capacity', d.capacity],
    ['Delivery charge', offersService(d, 'DELIVERY') ? deliveryChargeText(d) : undefined],
    ['On hire', offersService(d, 'HOURLY') ? hourlyRateText(d) : undefined],
    ['Minimum hire', offersService(d, 'HOURLY') && minHoursOf(d) > 1 ? `${minHoursOf(d)} hours` : undefined],
    ['Loading / unloading', d.loadingHelp ? 'Help included' : 'Not included'],
    ['Service area', d.serviceArea],
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1])).map(([label, value]) => ({ label, value }));
}

// --- Seller's "Add vehicle" form -----------------------------------------------------

/** Form state: text inputs as strings, the services as a string array, yes/no as 'YES' / 'NO'. */
export type TransportFormValues = Record<string, string | string[]>;

/** A shop posted under Tata Ace Mini Truck most likely adds a Tata Ace — pre-select it. */
const VEHICLE_BY_CATEGORY: Record<string, string> = {
  'tata-ace-mini-truck': 'Tata Ace / Chhota Hathi',
};

export function toTransportFormValues(d: TransportDetails | null | undefined, categorySlug?: string | null): TransportFormValues {
  if (!hasTransportRates(d)) {
    // Most sellers do both — they can untick one.
    return { vehicleType: VEHICLE_BY_CATEGORY[categorySlug ?? ''] ?? '', services: ['DELIVERY', 'HOURLY'], deliveryChargeUnit: 'PER_TRIP' };
  }
  const values: TransportFormValues = { deliveryChargeUnit: 'PER_TRIP' };
  for (const [key, value] of Object.entries(d)) {
    if (value === undefined || value === null) continue;
    values[key] = Array.isArray(value) ? value : typeof value === 'boolean' ? (value ? 'YES' : 'NO') : String(value);
  }
  return values;
}

const str = (value: string | string[] | undefined) => (typeof value === 'string' ? value.trim() : '');
const servicesOf = (values: TransportFormValues) => (Array.isArray(values.services) ? values.services : []);

/** Labels of the required details the seller hasn't filled in yet. */
export function missingTransportFields(values: TransportFormValues): string[] {
  const missing: string[] = [];
  const services = servicesOf(values);
  if (!str(values.vehicleType)) missing.push('Vehicle type');
  if (values.vehicleType === 'Other' && !str(values.otherVehicle)) missing.push('Vehicle name');
  if (!str(values.capacity)) missing.push('Load capacity');
  if (services.length === 0) missing.push('What you offer');
  if (services.includes('DELIVERY') && !(Number(str(values.deliveryCharge)) > 0)) missing.push('Delivery charge');
  if (services.includes('HOURLY') && !(Number(str(values.hourlyRate)) > 0)) missing.push('Rate per hour');
  if (!str(values.loadingHelp)) missing.push('Loading help');
  return missing;
}

/** What gets sent to the backend as the product's transportDetails. */
export function transportPayload(values: TransportFormValues): Record<string, unknown> {
  const services = servicesOf(values);
  const delivery = services.includes('DELIVERY');
  const hourly = services.includes('HOURLY');
  return {
    vehicleType: str(values.vehicleType),
    otherVehicle: values.vehicleType === 'Other' ? str(values.otherVehicle) : undefined,
    capacity: str(values.capacity),
    services,
    deliveryCharge: delivery ? Number(str(values.deliveryCharge)) : undefined,
    deliveryChargeUnit: delivery ? str(values.deliveryChargeUnit) || 'PER_TRIP' : undefined,
    hourlyRate: hourly ? Number(str(values.hourlyRate)) : undefined,
    minHours: hourly && str(values.minHours) ? Number(str(values.minHours)) : undefined,
    loadingHelp: values.loadingHelp === 'YES',
    serviceArea: str(values.serviceArea) || undefined,
  };
}
