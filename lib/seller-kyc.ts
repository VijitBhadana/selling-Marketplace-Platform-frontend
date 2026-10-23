// Client-side mirror of backend/src/modules/auth/seller-kyc.ts so the seller sign-up
// form can flag a mistyped Aadhaar / GSTIN / PAN before submitting. The backend re-checks.

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidAadhaar(digits: string) {
  if (!/^[2-9]\d{11}$/.test(digits)) return false;
  let c = 0;
  digits
    .split('')
    .reverse()
    .forEach((ch, i) => {
      c = VERHOEFF_D[c][VERHOEFF_P[i % 8][Number(ch)]];
    });
  return c === 0;
}

/** Groups 12 digits as "1234 5678 9012" for display. */
export function formatAadhaar(digits: string) {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function isValidGstin(gstin: string) {
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) return false;
  const state = Number(gstin.slice(0, 2));
  if (!((state >= 1 && state <= 38) || state === 97 || state === 99)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = GSTIN_CHARS.indexOf(gstin[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_CHARS[(36 - (sum % 36)) % 36] === gstin[14];
}

// PAN: 5 letters + 4 digits + 1 letter. The 4th letter is the holder type (P = person,
// C = company, F = firm, H = HUF, ...); for a person the 5th is their surname's initial.
const PAN_HOLDER_TYPES = 'ABCFGHJLPT';

export function isValidPan(pan: string) {
  return /^[A-Z]{5}\d{4}[A-Z]$/.test(pan) && PAN_HOLDER_TYPES.includes(pan[3]) && pan.slice(5, 9) !== '0000';
}

/** Why this PAN can't be accepted for this seller, or null if it's fine. */
export function panProblem(pan: string, name: string, gstin: string) {
  if (!isValidPan(pan)) return 'This is not a valid PAN — it looks like "ABCPE1234F" on your PAN card.';
  // A GSTIN carries its holder's PAN in characters 3–12.
  if (gstin.length === 15 && gstin.slice(2, 12) !== pan) return 'This PAN does not match your GST number.';
  const words = name.toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  if (pan[3] === 'P' && words.length > 1 && !words.some((w) => w[0] === pan[4])) {
    return `The 5th letter of a personal PAN is your surname's first letter — it doesn't match "${name.trim()}".`;
  }
  return null;
}
