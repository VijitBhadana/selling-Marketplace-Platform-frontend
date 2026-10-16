// Delivery partners: sign-up options and the shapes the delivery panel works with.
// Client-side mirror of backend/src/modules/auth/delivery-kyc.ts — the backend re-checks.

export const VEHICLE_TYPES = [
  { value: 'BIKE', label: 'Motorcycle' },
  { value: 'SCOOTER', label: 'Scooter' },
  { value: 'BICYCLE', label: 'Bicycle' },
  { value: 'E_RICKSHAW', label: 'E-rickshaw' },
  { value: 'AUTO', label: 'Auto' },
  { value: 'CAR', label: 'Car' },
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number]['value'];

export function vehicleLabel(value: string) {
  return VEHICLE_TYPES.find((v) => v.value === value)?.label ?? value;
}

export function isValidLicense(value: string) {
  return /^[A-Z]{2}\d{2}[0-9A-Z]{9,13}$/.test(value);
}

export function isValidVehicleNumber(value: string) {
  return /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$/.test(value) || /^\d{2}BH\d{4}[A-Z]{1,2}$/.test(value);
}

export type DeliveryStatus = 'SEARCHING' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED';

export type DeliveryProfile = {
  name: string;
  email: string;
  phone: string | null;
  aadhaarLast4: string | null;
  address: string;
  vehicleType: string;
  vehicleNumber: string | null;
  licenseNumber: string;
  city: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
};

/** An order as the delivery panel sees it: pickup shop, drop address and who to call. */
export type DeliveryOrder = {
  id: string;
  shopName: string | null;
  address: string | null;
  totalAmount: string;
  paymentMethod: 'ONLINE' | 'COD';
  paymentStatus: 'PENDING' | 'PAID';
  status: 'PENDING' | 'COMPLETED' | 'NO_SHOW';
  deliveryStatus: DeliveryStatus;
  deliveryAcceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: { id: string; productName: string; quantity: number }[];
  listing: {
    id: string;
    shopName: string | null;
    title: string;
    city: string | null;
    pincode: string | null;
    latitude: number | null;
    longitude: number | null;
    seller: { name: string; phone: string | null };
  } | null;
  // The buyer's phone only comes through once this partner has accepted the order.
  buyer: { name: string; phone?: string | null };
};

/** Google Maps directions to the shop — its pin when it saved one, else its name and area. */
export function shopMapUrl(listing: NonNullable<DeliveryOrder['listing']>) {
  const destination =
    listing.latitude != null && listing.longitude != null
      ? `${listing.latitude},${listing.longitude}`
      : [listing.shopName || listing.title, listing.city, listing.pincode].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function addressMapUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

/** Who's carrying an order, as the buyer and the shop see it (licence number masked). */
export type OrderDeliveryPartner = {
  name: string;
  phone: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  licenseNumber: string | null;
};

/** The delivery fields every order row carries (null for non-delivery orders). */
export type OrderDelivery = {
  deliveryStatus: DeliveryStatus | null;
  deliveryPartner: OrderDeliveryPartner | null;
  deliveryAcceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
};

/** What the shop sees for a delivery order. */
export const SELLER_DELIVERY_STATUS: Record<DeliveryStatus, string> = {
  SEARCHING: 'Finding a delivery partner near your shop',
  ASSIGNED: 'Delivery partner is on the way to your shop',
  PICKED_UP: 'Picked up — on the way to the buyer',
  DELIVERED: 'Delivered to the buyer',
};

/** What the buyer sees under a delivery order in their order list. */
export const BUYER_DELIVERY_STATUS: Record<DeliveryStatus, string> = {
  SEARCHING: 'Finding a delivery partner near the shop',
  ASSIGNED: 'Delivery partner is on the way to the shop',
  PICKED_UP: 'Picked up — arriving very soon',
  DELIVERED: 'Delivered',
};
