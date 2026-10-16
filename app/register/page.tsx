'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Bike,
  Briefcase,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  Hash,
  IdCard,
  ImagePlus,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Receipt,
  ShoppingBag,
  User,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatAadhaar, isValidAadhaar, isValidGstin } from '@/lib/seller-kyc';
import { VEHICLE_TYPES, isValidLicense, isValidVehicleNumber } from '@/lib/delivery';
import { fileToResizedDataUrl } from '@/lib/image-utils';
import {
  AuthError,
  AuthField,
  AuthFormFallback,
  AuthShell,
  AuthSwitch,
  authInputClass,
  authSubmitClass,
} from '@/components/auth-shell';
import { startTopLoader } from '@/components/top-loader';

type Role = 'BUYER' | 'SELLER' | 'DELIVERY';

const roles = [
  { value: 'BUYER', label: 'Buyer', text: 'Browse, book & buy', icon: ShoppingBag },
  { value: 'SELLER', label: 'Seller', text: 'List shop & services', icon: Briefcase },
  { value: 'DELIVERY', label: 'Delivery', text: 'Deliver orders near you', icon: Bike },
] as const;

const roleLabel: Record<Role, string> = { BUYER: 'Buyer', SELLER: 'Seller', DELIVERY: 'Delivery Partner' };

/** Photo of an ID (Aadhaar card, driving licence), resized in the browser before upload. */
function PhotoField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a photo (JPG or PNG).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Large enough that the numbers on the card stay readable.
      onChange(await fileToResizedDataUrl(file, 1400, 0.82));
    } catch {
      setError('Could not read this photo — try another one.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-2 flex items-baseline justify-between gap-3 text-[13px] font-semibold text-ink">
        {label}
        <span className="text-xs font-normal text-ink-muted">Required</span>
      </p>
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-2.5 transition-colors focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15 ${
          value ? 'border-brand/50 bg-brand-soft/40' : 'border-border hover:border-ink-muted/40 hover:bg-surface-hover'
        }`}
      >
        <span className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg text-ink-muted">
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={20} />
          )}
        </span>
        <span className="min-w-0 text-sm">
          <span className="block font-semibold text-ink">{value ? 'Photo added' : 'Upload a clear photo'}</span>
          <span className="block text-xs text-ink-muted">{value ? 'Tap to change it' : 'JPG or PNG — every detail readable'}</span>
        </span>
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-accent">
          <AlertCircle size={13} strokeWidth={2.5} /> {error}
        </p>
      )}
    </div>
  );
}

// Error line under the Aadhaar / GST inputs — shown only once a full-length value fails the check.
function KycError({ value, length, valid, message }: { value: string; length: number; valid: boolean; message: string }) {
  if (value.length !== length || valid) return null;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-accent">
      <AlertCircle size={13} strokeWidth={2.5} /> {message}
    </p>
  );
}

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('BUYER');
  const [aadhaar, setAadhaar] = useState('');
  const [gstin, setGstin] = useState('');
  // Delivery partners only.
  const [aadhaarImage, setAadhaarImage] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseImage, setLicenseImage] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const isSeller = role === 'SELLER';
    const isDelivery = role === 'DELIVERY';
    const needsNumberPlate = vehicleType !== 'BICYCLE';
    if (isDelivery && phone.length !== 10) {
      setError('Delivery partners need a 10-digit phone number — buyers and shops will call you on it.');
      return;
    }
    if ((isSeller || isDelivery) && aadhaar.length !== 12) {
      setError(`Aadhaar number must be exactly 12 digits — you entered ${aadhaar.length}.`);
      return;
    }
    if ((isSeller || isDelivery) && !isValidAadhaar(aadhaar)) {
      setError('This Aadhaar number is not valid. Please check it against your Aadhaar card.');
      return;
    }
    if (isDelivery) {
      const problem = !aadhaarImage
        ? 'Please upload a photo of your Aadhaar card.'
        : !isValidLicense(licenseNumber)
          ? 'This driving licence number is not valid. It looks like "UP14 20190012345" on your licence.'
          : !licenseImage
            ? 'Please upload a photo of your driving licence.'
            : !vehicleType
              ? 'Please choose your vehicle.'
              : needsNumberPlate && !isValidVehicleNumber(vehicleNumber)
                ? 'This vehicle number is not valid. It looks like "UP15 AB 1234" on your number plate.'
                : address.trim().length < 10
                  ? 'Please enter your full address.'
                  : null;
      if (problem) {
        setError(problem);
        return;
      }
    }
    if (isSeller && gstin.length !== 15) {
      setError(`GST number must be exactly 15 characters — you entered ${gstin.length}.`);
      return;
    }
    if (isSeller && !isValidGstin(gstin)) {
      setError('This GST number is not valid. Please check it against your GST certificate.');
      return;
    }
    setLoading(true);
    try {
      await api.auth.register({
        name,
        email,
        password,
        phone,
        role,
        ...(isSeller ? { aadhaar, gstin } : {}),
        ...(isDelivery
          ? {
              aadhaar,
              aadhaarImage,
              licenseNumber,
              licenseImage,
              vehicleType,
              vehicleNumber: needsNumberPlate ? vehicleNumber : undefined,
              address: address.trim(),
            }
          : {}),
      });
      const params = new URLSearchParams({ email });
      if (next) params.set('next', next);
      startTopLoader(`/verify-otp?${params.toString()}`);
      router.push(`/verify-otp?${params.toString()}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account. The backend server may be offline.');
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">I want to sign up as</p>
          <div className="grid grid-cols-3 gap-2.5">
            {roles.map(({ value, label, text, icon: Icon }) => {
              const active = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  aria-pressed={active}
                  className={`relative flex flex-col items-start gap-2.5 rounded-2xl border p-3.5 text-left transition-all ${
                    active
                      ? 'border-brand bg-brand-soft/70 ring-4 ring-brand/10'
                      : 'border-border hover:border-ink-muted/40 hover:bg-surface-hover'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      active ? 'bg-brand text-brand-ink' : 'bg-bg text-ink-muted'
                    }`}
                  >
                    <Icon size={17} />
                  </span>
                  <span>
                    <span className={`block text-sm font-semibold ${active ? 'text-brand' : 'text-ink'}`}>{label}</span>
                    <span className="block text-xs text-ink-muted">{text}</span>
                  </span>
                  <span
                    aria-hidden
                    className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                      active ? 'border-brand bg-brand text-brand-ink' : 'border-border'
                    }`}
                  >
                    {active && <Check size={12} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <AuthField id="register-name" label="Full name" icon={User}>
          <input
            id="register-name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className={`${authInputClass} pl-11 pr-4`}
          />
        </AuthField>

        <AuthField id="register-email" label="Email" icon={Mail}>
          <input
            id="register-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${authInputClass} pl-11 pr-4`}
          />
        </AuthField>

        <AuthField
          id="register-phone"
          label={role === 'DELIVERY' ? 'Phone *' : 'Phone'}
          hint={role === 'DELIVERY' ? 'Shops & buyers will call you' : 'For OTP verification'}
          icon={Phone}
        >
          <span className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 border-r border-border pr-2.5 text-[15px] text-ink-muted">
            +91
          </span>
          <input
            id="register-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            required={role === 'DELIVERY'}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            className={`${authInputClass} pl-[5.6rem] pr-4`}
          />
        </AuthField>

        {(role === 'SELLER' || role === 'DELIVERY') && (
          <>
            <AuthField
              id="register-aadhaar"
              label="Aadhaar number *"
              hint={role === 'SELLER' ? 'Required for sellers' : 'Required for delivery partners'}
              icon={Fingerprint}
              after={
                <KycError
                  value={aadhaar}
                  length={12}
                  valid={isValidAadhaar(aadhaar)}
                  message="This is not a valid Aadhaar number"
                />
              }
            >
              <input
                id="register-aadhaar"
                required
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                value={formatAadhaar(aadhaar)}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                className={`${authInputClass} pl-11 pr-4`}
              />
            </AuthField>
          </>
        )}

        {role === 'DELIVERY' && (
          <>
            <PhotoField id="register-aadhaar-photo" label="Aadhaar card photo" value={aadhaarImage} onChange={setAadhaarImage} />

            <AuthField
              id="register-license"
              label="Driving licence number *"
              hint="As printed on your licence"
              icon={IdCard}
              after={
                licenseNumber.length >= 13 &&
                !isValidLicense(licenseNumber) && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-accent">
                    <AlertCircle size={13} strokeWidth={2.5} /> This is not a valid driving licence number
                  </p>
                )
              }
            >
              <input
                id="register-license"
                required
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={20}
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 17))}
                placeholder="UP1420190012345"
                className={`${authInputClass} pl-11 pr-4 uppercase`}
              />
            </AuthField>

            <PhotoField id="register-license-photo" label="Driving licence photo" value={licenseImage} onChange={setLicenseImage} />

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Your vehicle *</p>
              <div className="grid grid-cols-3 gap-2">
                {VEHICLE_TYPES.map((v) => {
                  const active = vehicleType === v.value;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => setVehicleType(v.value)}
                      aria-pressed={active}
                      className={`h-10 rounded-xl border px-2 text-[13px] font-semibold transition-colors ${
                        active ? 'border-brand bg-brand-soft/70 text-brand' : 'border-border text-ink-muted hover:border-ink-muted/40 hover:text-ink'
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {vehicleType && vehicleType !== 'BICYCLE' && (
              <AuthField id="register-vehicle-number" label="Vehicle number *" hint="From the number plate" icon={Hash}>
                <input
                  id="register-vehicle-number"
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={12}
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 11))}
                  placeholder="UP15AB1234"
                  className={`${authInputClass} pl-11 pr-4 uppercase`}
                />
              </AuthField>
            )}

            <AuthField id="register-address" label="Full address *" hint="Where you live" icon={MapPin}>
              <textarea
                id="register-address"
                required
                rows={2}
                maxLength={300}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no., street, area, city, pincode"
                className={`${authInputClass} h-auto resize-none py-3 pl-11 pr-4`}
              />
            </AuthField>
          </>
        )}

        {role === 'SELLER' && (
          <>
            <AuthField
              id="register-gstin"
              label="GST number"
              hint="Required for sellers"
              icon={Receipt}
              after={
                <KycError
                  value={gstin}
                  length={15}
                  valid={isValidGstin(gstin)}
                  message="This is not a valid GST number"
                />
              }
            >
              <input
                id="register-gstin"
                required
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={15}
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15))}
                className={`${authInputClass} pl-11 pr-4 uppercase`}
              />
            </AuthField>
          </>
        )}

        <AuthField
          id="register-password"
          label="Password"
          icon={Lock}
          after={
            <p
              className={`mt-2 flex items-center gap-1.5 text-xs transition-colors ${
                password.length >= 6 ? 'text-brand' : 'text-ink-muted'
              }`}
            >
              <Check size={13} strokeWidth={2.5} /> At least 6 characters
            </p>
          }
        >
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className={`${authInputClass} pl-11 pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </AuthField>

        {error && <AuthError message={error} />}

        <button type="submit" disabled={loading} className={authSubmitClass}>
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Creating account…
            </>
          ) : (
            <>
              {`Create account as ${roleLabel[role]}`}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <AuthSwitch
        prompt="Already have an account?"
        href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
        cta="Log in"
      />
    </>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell
      panelTitle="Open your dukan on the cloud."
      panelText="Join buyers and sellers discovering shops, services, jobs and bookings near them."
      title="Create your account"
      subtitle="Buy, sell, and book across every Cloude."
    >
      <Suspense fallback={<AuthFormFallback fields={5} />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
