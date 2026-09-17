// Booking Cloude (and Wedding Cloude's booking categories): products in these categories
// need the buyer to say what they're booking before they go into the bucket list.
// Mirrors backend/src/modules/cart/booking-details.ts.

export type BookingKind = 'STAY' | 'EVENT' | 'VEHICLE' | 'GOODS' | 'TOUR' | 'WEDDING' | 'PROPERTY' | 'TRANSPORT' | 'RENT';
/** A KYC photo the renter uploaded (Rent Cloude vehicles) — stored with the booking as a data URL. */
export type BookingDocument = { fileName: string; dataUrl: string };
export type BookingDetails = { kind?: BookingKind } & Record<string, string | number | BookingDocument | undefined>;

// Property Cloude: places listed for rent (or sale). The type decides which details the
// seller fills in (see lib/property-details.ts) and what the buyer is asked when renting.
export type PropertyType = 'HOSTEL' | 'PG' | 'GUEST_HOUSE' | 'ROOM' | 'FLAT' | 'SHOP' | 'OFFICE' | 'WAREHOUSE' | 'PLOT';

export const PROPERTY_TYPE_BY_CATEGORY: Record<string, PropertyType> = {
  'hostel-rent': 'HOSTEL',
  'guest-house-rent': 'GUEST_HOUSE',
  'room-rent': 'ROOM',
  'pg-rent': 'PG',
  'shop-rent-or-sale': 'SHOP',
  'office-rent-or-sale': 'OFFICE',
  'flat-rent-or-sale': 'FLAT',
  'warehouse-rent-or-sale': 'WAREHOUSE',
  'plot-rent-or-sale': 'PLOT',
};

/** People live here — the buyer says how many will stay; for the rest they say what it's for. */
export const RESIDENTIAL_TYPES: PropertyType[] = ['HOSTEL', 'PG', 'GUEST_HOUSE', 'ROOM', 'FLAT'];
export const TENANT_TYPES = ['Family', 'Bachelors', 'Students', 'Working professionals'];
export const PAYMENT_PLANS = ['Full payment', 'Home loan', 'Not decided yet'];

// Rent Cloude: everything in it is rented out by the day, so the kind comes from the
// Cloude rather than the category. What the buyer is asked on top of the dates depends on
// what is being rented: a vehicle needs the renter's licence and Aadhaar, a place needs
// the head count, everything else (furniture, a camera, a drill) needs neither.
export const RENT_CLOUDE_SLUG = 'rent';
export type RentSubject = 'VEHICLE' | 'PLACE' | 'ITEM';

const RENT_VEHICLE_CATEGORIES = ['cars', 'bikes-scooters', 'commercial-vehicles'];
const RENT_PLACE_CATEGORIES = ['flats-apartments', 'shops-offices', 'rooms-pg'];

export function getRentSubject(cloudeSlug?: string | null, categorySlug?: string | null): RentSubject | null {
  if (cloudeSlug !== RENT_CLOUDE_SLUG || !categorySlug) return null;
  if (RENT_VEHICLE_CATEGORIES.includes(categorySlug)) return 'VEHICLE';
  if (RENT_PLACE_CATEGORIES.includes(categorySlug)) return 'PLACE';
  return 'ITEM';
}

/** The KYC photos a renter uploads for a vehicle, in the order they are asked for. */
export const RENT_DOCUMENT_KEYS = ['drivingLicence', 'aadhaarCard'] as const;
export const RENT_DOCUMENT_LABELS: Record<(typeof RENT_DOCUMENT_KEYS)[number], string> = {
  drivingLicence: 'Driving licence',
  aadhaarCard: 'Aadhaar card',
};

const KIND_BY_CATEGORY: Record<string, Record<string, BookingKind>> = {
  property: Object.fromEntries(Object.keys(PROPERTY_TYPE_BY_CATEGORY).map((slug) => [slug, 'PROPERTY' as const])),
  booking: {
    hotels: 'STAY',
    'rooms-guest-houses': 'STAY',
    'party-events-birthday-function-booking': 'EVENT',
    'cab-bus-truck': 'VEHICLE',
    'delivery-package-movers-services': 'GOODS',
    'courier-services': 'GOODS',
    'tour-packages': 'TOUR',
  },
  // Wedding Cloude: venues and pandits are booked for some days and a guest count;
  // everything else (pooja items, furniture...) is bought like a normal product.
  wedding: {
    'hotel-booking': 'WEDDING',
    'banquet-hall-booking': 'WEDDING',
    'wedding-venue-booking': 'WEDDING',
    'pandit-booking': 'WEDDING',
  },
  // Agriculture & Farmer Cloude: vehicles for goods delivery or on hire by the hour — the
  // seller's rates are in lib/transport-details.ts. Everything else is bought normally.
  agriculture: {
    'tata-ace-mini-truck': 'TRANSPORT',
    'goods-loading-transport': 'TRANSPORT',
    'farm-to-market-delivery': 'TRANSPORT',
  },
};

export const PASSENGER_VEHICLES = ['Car / Cab', 'SUV / Innova', 'Tempo Traveller', 'Bus'];
export const GOODS_VEHICLES = ['Mini Truck (Tata Ace)', 'Pickup / Tempo', 'Truck'];
export const DELIVERY_VEHICLES = ['Bike / Scooter', 'Three-wheeler (Auto)', 'Mini Truck (Tata Ace)', 'Pickup / Tempo', 'Truck', 'Container Truck'];

export const BOOKING_TITLES: Record<BookingKind, string> = {
  STAY: 'Stay details',
  EVENT: 'Event details',
  VEHICLE: 'Trip details',
  GOODS: 'Shipment details',
  TOUR: 'Tour details',
  WEDDING: 'Booking details',
  PROPERTY: 'Rent details',
  TRANSPORT: 'Transport details',
  RENT: 'Rental details',
};

export function getBookingKind(cloudeSlug?: string | null, categorySlug?: string | null): BookingKind | null {
  if (!cloudeSlug || !categorySlug) return null;
  if (cloudeSlug === RENT_CLOUDE_SLUG) return 'RENT';
  return KIND_BY_CATEGORY[cloudeSlug]?.[categorySlug] ?? null;
}

// What a booking product's price is per — mirrors the backend. First option per kind is the default.
export type PriceUnit = 'FIXED' | 'PER_ROOM_NIGHT' | 'PER_NIGHT' | 'PER_HOUR' | 'PER_DAY' | 'PER_PERSON' | 'PER_MONTH' | 'PER_YEAR' | 'PER_KM';

export const PRICE_UNIT_OPTIONS: Record<BookingKind, PriceUnit[]> = {
  STAY: ['PER_ROOM_NIGHT', 'PER_NIGHT', 'FIXED'],
  EVENT: ['FIXED', 'PER_HOUR', 'PER_PERSON'],
  VEHICLE: ['PER_DAY', 'FIXED'],
  GOODS: ['FIXED'],
  TOUR: ['FIXED', 'PER_DAY', 'PER_PERSON'],
  WEDDING: ['PER_DAY', 'PER_PERSON', 'FIXED'],
  // Rent per day/month/year, or FIXED for sale — narrowed per property type in lib/property-details.ts.
  PROPERTY: ['PER_MONTH', 'PER_DAY', 'PER_YEAR', 'FIXED'],
  // Set from the seller's rates and the buyer's choice — see transportQuote() in lib/transport-details.ts.
  TRANSPORT: ['FIXED', 'PER_KM', 'PER_HOUR'],
  // Rent Cloude: everything is quoted per day, so the seller has nothing to choose.
  RENT: ['PER_DAY'],
};

/** Which booking-details field holds the rent duration for a property's price unit. */
export const RENT_DURATION_KEY: Partial<Record<PriceUnit, 'days' | 'months' | 'years'>> = {
  PER_DAY: 'days',
  PER_MONTH: 'months',
  PER_YEAR: 'years',
};

const FIXED_LABELS: Record<BookingKind, string> = {
  STAY: 'Total price',
  EVENT: 'Per event',
  VEHICLE: 'Per trip',
  GOODS: 'Per trip',
  TOUR: 'Per package',
  WEDDING: 'Per booking',
  PROPERTY: 'Sale price',
  TRANSPORT: 'Per trip',
  RENT: 'Per rental',
};

const UNIT_LABELS: Record<Exclude<PriceUnit, 'FIXED'>, string> = {
  PER_ROOM_NIGHT: 'Per room / night',
  PER_NIGHT: 'Per night',
  PER_HOUR: 'Per hour',
  PER_DAY: 'Per day',
  PER_PERSON: 'Per person',
  PER_MONTH: 'Per month',
  PER_YEAR: 'Per year',
  PER_KM: 'Per km',
};

export const PRICE_UNIT_HINTS: Record<PriceUnit, string> = {
  FIXED: 'Buyer pays this price once.',
  PER_ROOM_NIGHT: 'Buyer pays price × rooms × nights.',
  PER_NIGHT: 'Buyer pays price × nights.',
  PER_HOUR: 'Buyer pays price × hours booked.',
  PER_DAY: 'Buyer pays price × days booked.',
  PER_PERSON: 'Buyer pays price × number of people.',
  PER_MONTH: 'Tenant pays rent × months rented.',
  PER_YEAR: 'Tenant pays rent × years rented.',
  PER_KM: 'Buyer pays price × distance in km.',
};

export function effectivePriceUnit(kind: BookingKind, unit?: string | null): PriceUnit {
  const options = PRICE_UNIT_OPTIONS[kind];
  return options.includes(unit as PriceUnit) ? (unit as PriceUnit) : options[0];
}

export function priceUnitLabel(kind: BookingKind, unit: PriceUnit) {
  return unit === 'FIXED' ? FIXED_LABELS[kind] : UNIT_LABELS[unit];
}

/** "/ room / night" style suffix shown after a price; empty for a plain total. */
export function priceUnitSuffix(kind: BookingKind, unit: PriceUnit) {
  const label = priceUnitLabel(kind, unit);
  return label.startsWith('Per ') ? `/ ${label.slice(4).toLowerCase()}` : '';
}

const count = (value: unknown) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
};

/** How many times the unit price applies (2 rooms × 3 nights = 6). Same maths as the backend. */
export function bookingUnits(unit: PriceUnit, d: Record<string, unknown>): number {
  switch (unit) {
    case 'PER_ROOM_NIGHT':
      return count(d.rooms) * count(d.nights);
    case 'PER_NIGHT':
      return count(d.nights);
    case 'PER_HOUR':
      return count(d.durationHours);
    case 'PER_DAY':
      return count(d.days);
    case 'PER_PERSON':
      return count(d.guests ?? d.travellers ?? d.passengers);
    case 'PER_MONTH':
      return count(d.months);
    case 'PER_YEAR':
      return count(d.years);
    case 'PER_KM':
      return count(d.distanceKm);
    default:
      return 1;
  }
}

function unitFactors(unit: PriceUnit, d: Record<string, unknown>): string[] {
  switch (unit) {
    case 'PER_ROOM_NIGHT':
      return [plural(count(d.rooms), 'room'), plural(count(d.nights), 'night')];
    case 'PER_NIGHT':
      return [plural(count(d.nights), 'night')];
    case 'PER_HOUR':
      return [plural(count(d.durationHours), 'hour')];
    case 'PER_DAY':
      return [plural(count(d.days), 'day')];
    case 'PER_PERSON': {
      const n = count(d.guests ?? d.travellers ?? d.passengers);
      return [`${n} ${n === 1 ? 'person' : 'people'}`];
    }
    case 'PER_MONTH':
      return [plural(count(d.months), 'month')];
    case 'PER_YEAR':
      return [plural(count(d.years), 'year')];
    case 'PER_KM':
      return [`${count(d.distanceKm)} km`];
    default:
      return [];
  }
}

export function formatRupees(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

/** "₹999 × 2 rooms × 3 nights = ₹5,994" — or just "₹999" for a fixed price. */
export function bookingPriceLine(price: number, unit: PriceUnit, d: Record<string, unknown>) {
  const factors = unitFactors(unit, d);
  if (factors.length === 0) return formatRupees(price);
  return `${formatRupees(price)} × ${factors.join(' × ')} = ${formatRupees(price * bookingUnits(unit, d))}`;
}

/** One line per order item: "2 × Kurti" for normal items, the price breakdown for bookings. */
export function orderItemLine(it: { productName: string; quantity: number; unitPrice?: string | number; bookingDetails?: BookingDetails | null }) {
  const d = it.bookingDetails;
  if (!d?.kind) return `${it.quantity} × ${it.productName}`;
  const price = Number(it.unitPrice ?? 0);
  if (!price) return it.productName;
  return `${it.productName} — ${bookingPriceLine(price, (d.priceUnit as PriceUnit | undefined) ?? 'FIXED', d)}`;
}

/** The KYC photos on a rental booking, ready to show to the seller (and back to the renter). */
export function bookingDocuments(d: BookingDetails | null | undefined): { key: string; label: string; doc: BookingDocument }[] {
  if (!d) return [];
  return RENT_DOCUMENT_KEYS.flatMap((key) => {
    const doc = d[key];
    return doc && typeof doc === 'object' && typeof doc.dataUrl === 'string'
      ? [{ key, label: RENT_DOCUMENT_LABELS[key], doc }]
      : [];
  });
}

export function isPassengerVehicle(vehicleType?: unknown) {
  return typeof vehicleType === 'string' && PASSENGER_VEHICLES.includes(vehicleType);
}

/** Inclusive day count between two YYYY-MM-DD dates (20 → 22 Sep = 3 days). */
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
}

function formatDate(value: unknown) {
  if (typeof value !== 'string' || !value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function plural(n: unknown, word: string) {
  return `${n} ${word}${Number(n) === 1 ? '' : 's'}`;
}

/** Label/value rows for showing a booking to the buyer (bucket list, orders) and the seller. */
export function formatBookingDetails(d: BookingDetails | null | undefined): { label: string; value: string }[] {
  if (!d?.kind) return [];
  const rows: { label: string; value: string }[] = [];
  const add = (label: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== '' && typeof value !== 'object') rows.push({ label, value: String(value) });
  };

  switch (d.kind) {
    case 'STAY':
      add('Check-in', formatDate(d.checkIn));
      add('Stay', plural(d.nights, 'day'));
      add('Rooms', d.rooms);
      add('Guests', d.guests);
      add('Bed', d.bedType === 'DOUBLE' ? 'Double bed' : 'Single bed');
      break;
    case 'EVENT':
      add('Date', formatDate(d.eventDate));
      add('Start time', d.startTime);
      add('Duration', plural(d.durationHours, 'hour'));
      add('People', d.guests);
      break;
    case 'VEHICLE':
      add('Vehicle', d.vehicleType);
      add('From', d.pickup);
      add('To', d.drop);
      if (isPassengerVehicle(d.vehicleType)) {
        add('People', d.passengers);
        add('Dates', `${formatDate(d.startDate)} – ${formatDate(d.endDate)} (${plural(d.days, 'day')})`);
      } else {
        add('Date', formatDate(d.startDate));
        add('Goods', d.goodsDescription);
        add('Quantity', d.goodsQuantity);
      }
      break;
    case 'GOODS':
      add('Vehicle', d.vehicleType);
      add('Goods', d.goodsDescription);
      add('Quantity', d.goodsQuantity);
      add('Pickup', d.pickup);
      add('Deliver to', d.drop);
      add('Pickup date', formatDate(d.startDate));
      break;
    case 'TOUR':
      add('Starts', formatDate(d.startDate));
      add('Duration', plural(d.days, 'day'));
      add('Travellers', d.travellers);
      add('Budget', `₹${Number(d.budget).toLocaleString('en-IN')}`);
      break;
    case 'WEDDING':
      add('From', formatDate(d.startDate));
      add('Days', plural(d.days, 'day'));
      add('Guests', d.guests);
      break;
    case 'PROPERTY': {
      if (d.listingFor === 'SALE') {
        add('Enquiry', 'Wants to buy');
        if (d.visitDate) add('Site visit', formatDate(d.visitDate));
        add('Payment', d.paymentPlan);
      } else {
        add('Move-in', formatDate(d.startDate));
        const durationKey = (['days', 'months', 'years'] as const).find((k) => d[k] != null);
        if (durationKey) add('Rent for', plural(d[durationKey], durationKey.slice(0, -1)));
        add('People', d.occupants);
        add('Who', d.tenantType);
        add('Use for', d.purpose);
      }
      add('Phone', d.phone);
      break;
    }
    case 'RENT':
      add('Rent from', formatDate(d.startDate));
      add('Until', formatDate(d.endDate));
      add('Duration', plural(d.days, 'day'));
      add('People', d.occupants);
      if (d.subject === 'VEHICLE') add('KYC', 'Driving licence & Aadhaar uploaded');
      break;
    case 'TRANSPORT':
      add('Service', d.service === 'HOURLY' ? 'Truck on hire' : 'Goods delivery');
      add('From', d.pickup);
      add('To', d.drop);
      add('Goods', d.goodsDescription);
      add('Quantity', d.goodsQuantity);
      add(d.service === 'HOURLY' ? 'Date' : 'Pickup date', formatDate(d.startDate));
      add('Time', d.startTime);
      if (d.durationHours) add('Hours', plural(d.durationHours, 'hour'));
      if (d.distanceKm) add('Distance', `${d.distanceKm} km`);
      add('Phone', d.phone);
      break;
  }
  add('Notes', d.notes);
  return rows;
}
