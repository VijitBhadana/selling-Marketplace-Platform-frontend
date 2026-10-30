// Licences / certificates a seller must upload before selling in Food, Clinic & Doctors and
// Sports & Fitness & Gym Cloudes: FSSAI for a food business, the medical registration / drug
// licence / hospital registration for a healthcare one, and the certificate of the field a
// trainer or academy teaches (yoga, karate, gym training...). Asked once when the shop is set
// up, and again for every doctor a Clinic & Doctors shop adds. Every other Cloude asks for none.
// Mirrors backend listings/shop-certificate.ts (the titles must match).
import { fileToResizedDataUrl } from '@/lib/image-utils';

export type CertificateRequirement = {
  /** What to upload — stored with the photo, e.g. "Yoga Trainer certificate". */
  title: string;
  hint: string;
  numberLabel: string;
  numberPlaceholder: string;
};

const CLINIC_PHARMACY = ['pharmacy-medical-store'];
const CLINIC_DIAGNOSTICS = ['x-ray', 'radiology', 'pathology-lab'];
const CLINIC_HOSPITALS = [
  'hospitals-offering-treatment',
  'comparative-affordable-options',
  'hospital-details-facilities',
  'emergency-services',
];
const CLINIC_NURSING = ['home-nursing-patient-care'];
const CLINIC_OTHER = ['other-healthcare-related-services', 'other-services-products'];

export const DOCTOR_CERTIFICATE: CertificateRequirement = {
  title: "Doctor's medical registration certificate",
  hint: "The doctor's registration certificate from the State Medical Council / NMC, with their name and registration number clearly visible.",
  numberLabel: 'Registration number',
  numberPlaceholder: 'e.g. RMC/12345',
};

/** What a shop in this category has to upload, or null when it needs no certificate. */
export function shopCertificateFor(
  cloudeSlug?: string | null,
  categorySlug?: string | null,
  categoryName?: string,
): CertificateRequirement | null {
  if (!cloudeSlug || !categorySlug) return null;
  if (cloudeSlug === 'food') {
    return {
      title: 'FSSAI licence / registration certificate',
      hint: 'Every food business needs an FSSAI licence or registration — restaurants, cloud kitchens, caterers and homemade food sellers alike.',
      numberLabel: 'FSSAI licence number',
      numberPlaceholder: '14-digit number',
    };
  }
  if (cloudeSlug === 'clinic-doctors') {
    const licence = (title: string, hint: string): CertificateRequirement => ({
      title,
      hint,
      numberLabel: 'Licence / registration number',
      numberPlaceholder: 'As printed on the certificate',
    });
    if (CLINIC_PHARMACY.includes(categorySlug)) return licence('Drug licence', 'The drug licence issued to your pharmacy / medical store by the State Drugs Control department.');
    if (CLINIC_DIAGNOSTICS.includes(categorySlug)) {
      return licence('Diagnostic centre / lab registration certificate', 'The registration certificate of your diagnostic centre, X-ray / radiology unit or pathology lab.');
    }
    if (CLINIC_HOSPITALS.includes(categorySlug)) {
      return licence('Hospital / clinic registration certificate', 'The registration certificate of your hospital or clinic (Clinical Establishments registration).');
    }
    if (CLINIC_NURSING.includes(categorySlug)) {
      return licence('Nursing registration / training certificate', 'Your nursing council registration, or the certificate of your nursing / patient-care training.');
    }
    if (CLINIC_OTHER.includes(categorySlug)) {
      return licence('Medical registration / licence certificate', 'The registration or licence that lets you offer this healthcare service.');
    }
    if (categorySlug === 'physiotherapy') {
      return licence("Physiotherapist's registration / degree certificate", 'Your physiotherapy degree (BPT / MPT) or council registration certificate.');
    }
    return DOCTOR_CERTIFICATE;
  }
  if (cloudeSlug === 'sports-fitness-gym') {
    const training = (title: string, hint: string): CertificateRequirement => ({
      title,
      hint,
      numberLabel: 'Certificate number',
      numberPlaceholder: 'As printed on the certificate',
    });
    if (categorySlug === 'gym-equipment-items') {
      return training('Shop registration / trade licence', 'Your shop registration (Shop & Establishment / Udyam) or trade licence.');
    }
    if (categorySlug === 'other-services-products') {
      return training('Training / service certificate', 'The certificate for the training or service you offer.');
    }
    return training(
      `${categoryName ?? 'Trainer'} certificate`,
      'The certificate for the field you train in — e.g. a yoga certification for a Yoga Trainer, a coaching certificate for an academy, a fitness certification for a Gym Trainer.',
    );
  }
  return null;
}

/** The photo as sent to the backend — larger than product photos so the text stays readable. */
export function certificateToDataUrl(file: File) {
  return fileToResizedDataUrl(file, 1600, 0.85);
}
