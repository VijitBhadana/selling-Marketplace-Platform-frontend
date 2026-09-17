'use client';

import { useState } from 'react';
import { BadgeIndianRupee, Check, GraduationCap, Home, ImagePlus, Loader2, MapPin, MessageCircle, Package, Pencil, Plus, ShoppingCart, Stethoscope, Tag, Trash2, Truck, Wrench, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { api, ApiError } from '@/lib/api';
import {
  PRICE_UNIT_HINTS,
  PRICE_UNIT_OPTIONS,
  effectivePriceUnit,
  formatRupees,
  getBookingKind,
  getRentSubject,
  priceUnitLabel,
  priceUnitSuffix,
  type BookingKind,
  type PriceUnit,
  type PropertyType,
} from '@/lib/booking-details';
import {
  RENT_UNIT_OPTIONS,
  getPropertyType,
  listingForOf,
  missingPropertyFields,
  propertyFormListingFor,
  propertyHighlights,
  propertyPayload,
  propertyPriceText,
  toPropertyFormValues,
  type PropertyDetails,
  type PropertyFormValues,
} from '@/lib/property-details';
import { fileToResizedDataUrl, withImageParams } from '@/lib/image-utils';
import { BookingDetailsModal } from '@/components/booking-details';
import { PropertyDetailsModal, PropertyFieldsEditor } from '@/components/property-details';
import {
  clinicItemType,
  clinicPayload,
  isClinicCloude,
  missingClinicFields,
  toClinicFormValues,
  type ClinicDetails,
  type ClinicFormType,
  type ClinicFormValues,
} from '@/lib/clinic-details';
import { ClinicDetailsModal, ClinicFieldsEditor, ClinicProductGroups, ClinicTypePicker } from '@/components/clinic-details';
import {
  missingTransportFields,
  toTransportFormValues,
  transportPayload,
  type TransportDetails,
  type TransportFormValues,
} from '@/lib/transport-details';
import { TransportBookingModal, TransportCard, TransportDetailsModal, TransportFieldsEditor } from '@/components/transport-details';
import {
  EDUCATION_FORM_TEXT,
  defaultEducationType,
  educationActionLabel,
  educationItemType,
  educationNoun,
  educationPayload,
  educationPriceLabel,
  isEducationCloude,
  missingEducationFields,
  toEducationFormValues,
  type EducationDetails,
  type EducationFormType,
  type EducationFormValues,
} from '@/lib/education-details';
import { EducationDetailsModal, EducationFieldsEditor, EducationProductGroups, EducationTypePicker } from '@/components/education-details';
import {
  defaultFinanceType,
  financeActionLabel,
  financeHasPrice,
  financeItemType,
  financeNoun,
  financePayload,
  financePriceLabel,
  isFinanceCloude,
  missingFinanceFields,
  toFinanceFormValues,
  FINANCE_FORM_TEXT,
  type FinanceDetails,
  type FinanceFormType,
  type FinanceFormValues,
} from '@/lib/finance-details';
import { FinanceDetailsModal, FinanceFieldsEditor, FinanceProductGroups, FinanceTypePicker } from '@/components/finance-details';
import { FinanceApplyModal } from '@/components/finance-apply-modal';
import { useMyFinanceApplications } from '@/lib/use-my-finance-applications';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  priceType: 'FIXED' | 'CONTACT_FOR_PRICE';
  imageUrl: string | null;
  isService?: boolean;
  priceUnit?: string | null;
  /** Property Cloude only — BHK, area, furnishing, deposit, amenities, address... */
  propertyDetails?: PropertyDetails | null;
  /** Clinic & Doctors Cloude only — a doctor (qualification, days, timing...) or a medicine. */
  clinicDetails?: ClinicDetails | null;
  /** Agriculture transport shops only — the vehicle, its delivery charge and hourly rate. */
  transportDetails?: TransportDetails | null;
  /** Education Cloude only — a course, class, counselling service or new / used book. */
  educationDetails?: EducationDetails | null;
  /** Financing Cloude only — a loan scheme, insurance policy, investment plan or service. */
  financeDetails?: FinanceDetails | null;
};

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 hover:border-ink-muted/40 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10';

export function ShopProductsSection({
  listingId,
  sellerId,
  initialProducts,
  cloudeSlug,
  categorySlug,
  shopName,
}: {
  listingId: string;
  sellerId: string;
  initialProducts: Product[];
  cloudeSlug?: string;
  categorySlug?: string;
  /** Financing Cloude — shown in the application form so the applicant knows who gets it. */
  shopName?: string;
}) {
  const { user, token, requireAuth } = useAuth();
  const { addToCart, suspended } = useCart();
  const [products, setProducts] = useState(initialProducts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  // A product id, or 'all' while "Delete all" runs.
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  // Booking Cloude (hotels, events, vehicles, tours...) and Property Cloude: Buy opens a details form first.
  const [bookingProduct, setBookingProduct] = useState<Product | null>(null);
  // Property Cloude: the full property sheet (every detail the seller filled in).
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  // Clinic & Doctors Cloude: a doctor's profile / a medicine's sheet.
  const [viewingClinic, setViewingClinic] = useState<Product | null>(null);
  // Agriculture transport shops (Tata Ace, goods transport, farm-to-market): a vehicle's full sheet.
  const [viewingTransport, setViewingTransport] = useState<Product | null>(null);
  // Education Cloude: a course's / class's / counselling service's / book's full sheet.
  const [viewingEducation, setViewingEducation] = useState<Product | null>(null);
  // Financing Cloude: a scheme's full sheet, and the application form behind its Apply button.
  const [viewingFinance, setViewingFinance] = useState<Product | null>(null);
  const [applyingFor, setApplyingFor] = useState<Product | null>(null);

  const isOwner = user?.id === sellerId;
  const bookingKind = getBookingKind(cloudeSlug, categorySlug);
  const propertyType = getPropertyType(cloudeSlug, categorySlug);
  // Rent Cloude: a vehicle, a place or a plain item — decides what the renter is asked for.
  const rentSubject = getRentSubject(cloudeSlug, categorySlug);
  const isClinic = isClinicCloude(cloudeSlug);
  const isTransport = bookingKind === 'TRANSPORT';
  const isEducation = isEducationCloude(cloudeSlug);
  const isFinance = isFinanceCloude(cloudeSlug);
  // A financing scheme is applied for, never bought — this is the buyer's own application to each.
  const { markApplied, statusLabel } = useMyFinanceApplications();

  function flashAdded(id: string) {
    setAddedIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1500);
  }

  // Financing Cloude: applying is not buying — no cart, no payment. The buyer fills in the
  // agency's form, uploads the papers it asks for, and the agency approves or rejects.
  function handleApply(product: Product) {
    requireAuth(() => setApplyingFor(product), 'purchase');
  }

  function handleBuy(product: Product) {
    requireAuth(async () => {
      if (bookingKind) {
        setBookingProduct(product);
        return;
      }
      setAddingId(product.id);
      try {
        await addToCart(product.id);
        flashAdded(product.id);
      } finally {
        setAddingId(null);
      }
    }, 'purchase');
  }

  async function handleDelete(id: string) {
    if (!token) return;
    if (!window.confirm(`Delete this ${propertyType ? 'property' : isTransport ? 'vehicle' : 'product'}? This cannot be undone.`)) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      await api.products.remove(id, token);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Could not delete it. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteAll() {
    if (!token || products.length === 0) return;
    if (!window.confirm(`Delete all ${products.length} item${products.length === 1 ? '' : 's'} in this shop? This cannot be undone.`)) return;
    setDeletingId('all');
    setDeleteError(null);
    try {
      await api.products.removeAllForShop(listingId, token);
      setProducts([]);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Could not delete everything. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {propertyType ? (
            <Home size={15} className="text-brand" />
          ) : isClinic ? (
            <Stethoscope size={15} className="text-brand" />
          ) : isTransport ? (
            <Truck size={15} className="text-brand" />
          ) : isEducation ? (
            <GraduationCap size={15} className="text-brand" />
          ) : isFinance ? (
            <BadgeIndianRupee size={15} className="text-brand" />
          ) : (
            <Package size={15} className="text-brand" />
          )}
          {propertyType
            ? 'Properties'
            : isClinic
              ? 'Doctors & medicines'
              : isTransport
                ? 'Vehicles & rates'
                : isEducation
                  ? 'Courses, classes & books'
                  : isFinance
                    ? 'Schemes & services'
                    : 'Products'}
        </h2>
        {isOwner && (
          <div className="flex flex-wrap items-center gap-2">
          {products.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={deletingId !== null}
              className="flex items-center gap-1 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/10 disabled:opacity-50"
            >
              {deletingId === 'all' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete all
            </button>
          )}
          <button
            type="button"
            onClick={() => (token ? setModalOpen(true) : requireAuth(() => setModalOpen(true), 'post-ad'))}
            className="flex items-center gap-1 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-brand-ink hover:opacity-90"
          >
            <Plus size={13} />{' '}
            {propertyType
              ? 'Add property'
              : isClinic
                ? 'Add doctor / medicine'
                : isTransport
                  ? 'Add vehicle'
                  : isEducation
                    ? 'Add course / class / book'
                    : isFinance
                      ? 'Add loan / policy / plan'
                      : 'Add product'}
          </button>
          </div>
        )}
      </div>

      {deleteError && <p className="mb-3 text-xs text-accent">{deleteError}</p>}

      {products.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {propertyType
            ? isOwner
              ? 'No properties yet — add your first one with its rent/sale details so buyers can see it.'
              : 'No properties listed yet.'
            : isClinic
              ? isOwner
                ? 'Nothing listed yet — add your doctors (with their days and timing) and any medicines you sell.'
                : 'No doctors or medicines listed yet.'
            : isTransport
              ? isOwner
                ? 'No vehicles yet — add your truck with its delivery charge and hourly rate so buyers can book it.'
                : 'No vehicles listed yet.'
            : isEducation
              ? isOwner
                ? 'Nothing listed yet — add your courses, classes (with timing and fees), counselling services or books so students can see them.'
                : 'No courses, classes or books listed yet.'
            : isFinance
              ? isOwner
                ? 'Nothing listed yet — add your loan schemes, policies or plans with their rates, charges and conditions so buyers can apply.'
                : 'No schemes listed yet.'
            : isOwner
              ? 'No products yet — add your first one so buyers can see what you sell.'
              : 'No products listed yet.'}
        </p>
      ) : propertyType ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <PropertyCard
              key={p.id}
              product={p}
              isOwner={isOwner}
              deleting={deletingId === p.id}
              buying={addingId === p.id}
              added={addedIds.has(p.id)}
              suspended={suspended}
              onView={() => setViewingProduct(p)}
              onEdit={() => setEditingProduct(p)}
              onDelete={() => handleDelete(p.id)}
              onBuy={() => handleBuy(p)}
            />
          ))}
        </div>
      ) : isTransport ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <TransportCard
              key={p.id}
              product={p}
              isOwner={isOwner}
              suspended={suspended}
              buying={addingId === p.id}
              added={addedIds.has(p.id)}
              actions={isOwner ? <OwnerActions deleting={deletingId === p.id} onEdit={() => setEditingProduct(p)} onDelete={() => handleDelete(p.id)} /> : null}
              onView={() => setViewingTransport(p)}
              onBuy={() => handleBuy(p)}
            />
          ))}
        </div>
      ) : isClinic ? (
        <ClinicProductGroups
          products={products}
          isOwner={isOwner}
          suspended={suspended}
          isBuying={(p) => addingId === p.id}
          isAdded={(p) => addedIds.has(p.id)}
          ownerActions={(p) => <OwnerActions deleting={deletingId === p.id} onEdit={() => setEditingProduct(p)} onDelete={() => handleDelete(p.id)} />}
          onView={setViewingClinic}
          onBuy={handleBuy}
        />
      ) : isFinance ? (
        <FinanceProductGroups
          products={products}
          isOwner={isOwner}
          appliedStatus={(p) => statusLabel(p.id)}
          ownerActions={(p) => <OwnerActions deleting={deletingId === p.id} onEdit={() => setEditingProduct(p)} onDelete={() => handleDelete(p.id)} />}
          onView={setViewingFinance}
          onApply={handleApply}
        />
      ) : isEducation ? (
        <EducationProductGroups
          products={products}
          isOwner={isOwner}
          suspended={suspended}
          isBuying={(p) => addingId === p.id}
          isAdded={(p) => addedIds.has(p.id)}
          ownerActions={(p) => <OwnerActions deleting={deletingId === p.id} onEdit={() => setEditingProduct(p)} onDelete={() => handleDelete(p.id)} />}
          onView={setViewingEducation}
          onBuy={handleBuy}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 min-[420px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
          {products.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-xl border border-border">
              <div className="aspect-square bg-brand-soft">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={withImageParams(p.imageUrl, 'w=300&q=75&auto=format&fit=crop')} alt={p.name} className="h-full w-full object-cover" />
                )}
              </div>

              {isOwner && (
                <OwnerActions deleting={deletingId === p.id} onEdit={() => setEditingProduct(p)} onDelete={() => handleDelete(p.id)} />
              )}

              <div className="p-2">
                <p className="truncate text-xs font-medium text-ink">{p.name}</p>
                <p className="truncate text-[11px] font-semibold text-brand">
                  {p.priceType === 'CONTACT_FOR_PRICE'
                    ? 'Contact for price'
                    : `₹${p.price}${bookingKind ? ` ${priceUnitSuffix(bookingKind, effectivePriceUnit(bookingKind, p.priceUnit))}` : ''}`}
                </p>

                {!isOwner && (
                  <button
                    type="button"
                    disabled={addingId === p.id || addedIds.has(p.id) || suspended}
                    title={suspended ? 'Your account is suspended' : undefined}
                    onClick={() => handleBuy(p)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-brand py-1.5 text-[11px] font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {addedIds.has(p.id) ? (
                      <>
                        <Check size={12} /> Added
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={12} /> {bookingKind === 'RENT' ? 'Rent' : 'Buy'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ProductModal
          listingId={listingId}
          token={token!}
          cloudeSlug={cloudeSlug}
          bookingKind={bookingKind}
          propertyType={propertyType}
          categorySlug={categorySlug}
          onClose={() => setModalOpen(false)}
          onSaved={(product) => {
            setProducts((prev) => [product, ...prev]);
            setModalOpen(false);
          }}
        />
      )}

      {viewingProduct && (
        <PropertyDetailsModal
          product={viewingProduct}
          propertyType={propertyType}
          actionLabel={isOwner ? undefined : listingForOf(viewingProduct.propertyDetails) === 'SALE' ? 'Enquire to buy' : 'Rent now'}
          actionDisabled={suspended || addedIds.has(viewingProduct.id)}
          onAction={() => {
            const product = viewingProduct;
            setViewingProduct(null);
            handleBuy(product);
          }}
          onClose={() => setViewingProduct(null)}
        />
      )}

      {viewingClinic && (
        <ClinicDetailsModal
          product={viewingClinic}
          actionLabel={isOwner ? undefined : clinicItemType(viewingClinic.clinicDetails) === 'DOCTOR' ? 'Book appointment' : 'Buy'}
          actionDisabled={suspended || addedIds.has(viewingClinic.id)}
          onAction={() => {
            const product = viewingClinic;
            setViewingClinic(null);
            handleBuy(product);
          }}
          onClose={() => setViewingClinic(null)}
        />
      )}

      {viewingEducation && (
        <EducationDetailsModal
          product={viewingEducation}
          actionLabel={isOwner ? undefined : educationActionLabel(viewingEducation.educationDetails)}
          actionDisabled={suspended || addedIds.has(viewingEducation.id)}
          onAction={() => {
            const product = viewingEducation;
            setViewingEducation(null);
            handleBuy(product);
          }}
          onClose={() => setViewingEducation(null)}
        />
      )}

      {viewingFinance && (
        <FinanceDetailsModal
          product={viewingFinance}
          appliedStatus={isOwner ? undefined : statusLabel(viewingFinance.id)}
          actionLabel={isOwner ? undefined : financeActionLabel(viewingFinance.financeDetails)}
          onAction={() => {
            const product = viewingFinance;
            setViewingFinance(null);
            handleApply(product);
          }}
          onClose={() => setViewingFinance(null)}
        />
      )}

      {applyingFor && (
        <FinanceApplyModal
          product={applyingFor}
          shopName={shopName || 'this agency'}
          onClose={() => setApplyingFor(null)}
          onApplied={(application) => {
            markApplied(application);
            setApplyingFor(null);
          }}
        />
      )}

      {viewingTransport && (
        <TransportDetailsModal
          product={viewingTransport}
          actionLabel={isOwner ? undefined : 'Book now'}
          actionDisabled={suspended || addedIds.has(viewingTransport.id)}
          onAction={() => {
            const product = viewingTransport;
            setViewingTransport(null);
            handleBuy(product);
          }}
          onClose={() => setViewingTransport(null)}
        />
      )}

      {bookingProduct && isTransport && (
        <TransportBookingModal
          productName={bookingProduct.name}
          transport={bookingProduct.transportDetails}
          onClose={() => setBookingProduct(null)}
          onSubmit={async (details) => {
            await addToCart(bookingProduct.id, details);
            flashAdded(bookingProduct.id);
            setBookingProduct(null);
          }}
        />
      )}

      {bookingProduct && bookingKind && !isTransport && (
        <BookingDetailsModal
          kind={bookingKind}
          productName={bookingProduct.name}
          unitPrice={bookingProduct.priceType === 'FIXED' ? Number(bookingProduct.price) : null}
          priceUnit={effectivePriceUnit(bookingKind, bookingProduct.priceUnit)}
          property={bookingProduct.propertyDetails}
          propertyType={propertyType}
          rentSubject={rentSubject}
          onClose={() => setBookingProduct(null)}
          onSubmit={async (details) => {
            await addToCart(bookingProduct.id, details);
            flashAdded(bookingProduct.id);
            setBookingProduct(null);
          }}
        />
      )}

      {editingProduct && (
        <ProductModal
          listingId={listingId}
          token={token!}
          product={editingProduct}
          cloudeSlug={cloudeSlug}
          bookingKind={bookingKind}
          propertyType={propertyType}
          categorySlug={categorySlug}
          onClose={() => setEditingProduct(null)}
          onSaved={(product) => {
            setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

function OwnerActions({ deleting, onEdit, onDelete }: { deleting: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="absolute right-1.5 top-1.5 flex gap-1">
      <button
        type="button"
        aria-label="Edit"
        onClick={onEdit}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-bg/90 text-ink shadow-sm hover:text-brand"
      >
        <Pencil size={13} />
      </button>
      <button
        type="button"
        aria-label="Delete"
        disabled={deleting}
        onClick={onDelete}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-bg/90 text-ink shadow-sm hover:text-accent disabled:opacity-50"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

/** Property Cloude card: rent/sale badge, price per month/day/year, address and a few key facts. */
function PropertyCard({
  product: p,
  isOwner,
  deleting,
  buying,
  added,
  suspended,
  onView,
  onEdit,
  onDelete,
  onBuy,
}: {
  product: Product;
  isOwner: boolean;
  deleting: boolean;
  buying: boolean;
  added: boolean;
  suspended: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBuy: () => void;
}) {
  const forSale = listingForOf(p.propertyDetails) === 'SALE';
  const highlights = propertyHighlights(p.propertyDetails);
  const address = typeof p.propertyDetails?.address === 'string' ? p.propertyDetails.address : '';
  const deposit = forSale ? 0 : Number(p.propertyDetails?.deposit) || 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <button type="button" onClick={onView} aria-label={`View details of ${p.name}`} className="relative block aspect-[4/3] w-full bg-brand-soft">
        {p.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withImageParams(p.imageUrl, 'w=480&q=75&auto=format&fit=crop')} alt={p.name} className="h-full w-full object-cover" />
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            forSale ? 'bg-accent text-white' : 'bg-brand text-brand-ink'
          }`}
        >
          {forSale ? 'For sale' : 'For rent'}
        </span>
      </button>

      {isOwner && <OwnerActions deleting={deleting} onEdit={onEdit} onDelete={onDelete} />}

      <div className="flex flex-1 flex-col p-3">
        <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
        <p className="text-sm font-bold text-brand">{propertyPriceText(p)}</p>
        {address && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{address}</span>
          </p>
        )}
        {highlights.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {highlights.map((fact) => (
              <span key={fact} className="rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                {fact}
              </span>
            ))}
          </div>
        )}
        {deposit > 0 && <p className="mt-1.5 text-[11px] text-ink-muted">Deposit {formatRupees(deposit)}</p>}

        <div className="mt-auto flex gap-1.5 pt-3">
          <button
            type="button"
            onClick={onView}
            className="flex-1 rounded-full border border-border py-1.5 text-[11px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
          >
            Details
          </button>
          {!isOwner && (
            <button
              type="button"
              disabled={buying || added || suspended}
              title={suspended ? 'Your account is suspended' : undefined}
              onClick={onBuy}
              className="flex flex-1 items-center justify-center gap-1 rounded-full bg-brand py-1.5 text-[11px] font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {added ? (
                <>
                  <Check size={12} /> Added
                </>
              ) : forSale ? (
                'Enquire to buy'
              ) : (
                'Rent now'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChoiceCard({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
        selected
          ? 'border-brand bg-brand-soft text-brand ring-1 ring-brand'
          : 'border-border bg-bg text-ink-muted hover:border-brand/50 hover:text-ink'
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          selected ? 'bg-brand text-brand-ink' : 'bg-surface text-ink-muted'
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

function ProductModal({
  listingId,
  token,
  product,
  cloudeSlug,
  bookingKind,
  propertyType,
  categorySlug,
  onClose,
  onSaved,
}: {
  listingId: string;
  token: string;
  product?: Product;
  cloudeSlug?: string;
  bookingKind: BookingKind | null;
  propertyType: PropertyType | null;
  categorySlug?: string;
  onClose: () => void;
  onSaved: (product: Product) => void;
}) {
  const isEditing = Boolean(product);
  const isClinic = isClinicCloude(cloudeSlug);
  // Agriculture transport shops: every item is a vehicle, priced from its delivery charge / hourly rate.
  const isTransport = bookingKind === 'TRANSPORT';
  const [transportValues, setTransportValues] = useState<TransportFormValues>(() =>
    toTransportFormValues(product?.transportDetails, categorySlug),
  );
  // Clinic & Doctors Cloude: a doctor, a medicine, or anything else (a plain product).
  const [clinicType, setClinicType] = useState<ClinicFormType>(() =>
    isClinic ? clinicItemType(product?.clinicDetails) ?? (isEditing ? 'OTHER' : 'DOCTOR') : 'OTHER',
  );
  const [clinicValues, setClinicValues] = useState<ClinicFormValues>(() => toClinicFormValues(product?.clinicDetails, categorySlug));
  const clinicItem = isClinic && clinicType !== 'OTHER' ? clinicType : null;
  // Education Cloude: a course, class, counselling service, book, or anything else (a plain product).
  const isEducation = isEducationCloude(cloudeSlug);
  const [educationType, setEducationType] = useState<EducationFormType>(() =>
    isEducation ? educationItemType(product?.educationDetails) ?? (isEditing ? 'OTHER' : defaultEducationType(categorySlug)) : 'OTHER',
  );
  const [educationValues, setEducationValues] = useState<EducationFormValues>(() =>
    toEducationFormValues(product?.educationDetails, categorySlug),
  );
  const educationItem = isEducation && educationType !== 'OTHER' ? educationType : null;
  // Financing Cloude: a loan scheme, policy, investment plan, service, or a plain product.
  const isFinance = isFinanceCloude(cloudeSlug);
  const [financeType, setFinanceType] = useState<FinanceFormType>(() =>
    isFinance ? financeItemType(product?.financeDetails) ?? (isEditing ? 'OTHER' : defaultFinanceType(categorySlug)) : 'OTHER',
  );
  const [financeValues, setFinanceValues] = useState<FinanceFormValues>(() =>
    toFinanceFormValues(product?.financeDetails, categorySlug, isFinance ? defaultFinanceType(categorySlug) : undefined),
  );
  const financeItem = isFinance && financeType !== 'OTHER' ? financeType : null;
  const noun = propertyType
    ? 'property'
    : isTransport
      ? 'vehicle'
      : clinicItem === 'DOCTOR'
        ? 'doctor'
        : clinicItem === 'MEDICINE'
          ? 'medicine'
          : isEducation
            ? educationNoun(educationType)
            : isFinance
              ? financeNoun(financeType)
              : 'product';
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [priceType, setPriceType] = useState<'FIXED' | 'CONTACT_FOR_PRICE'>(product?.priceType ?? 'FIXED');
  const [price, setPrice] = useState(product?.price ?? '');
  const [isService, setIsService] = useState(product?.isService ?? false);
  const [priceUnit, setPriceUnit] = useState<PriceUnit | null>(bookingKind ? effectivePriceUnit(bookingKind, product?.priceUnit) : null);
  // Property Cloude: rent or sale, rent unit and every property detail.
  const [propertyValues, setPropertyValues] = useState<PropertyFormValues>(() => toPropertyFormValues(product?.propertyDetails));
  const [rentUnit, setRentUnit] = useState<PriceUnit>(() => {
    const options = propertyType ? RENT_UNIT_OPTIONS[propertyType] : [];
    return options.includes(product?.priceUnit as PriceUnit) ? (product!.priceUnit as PriceUnit) : options[0] ?? 'PER_MONTH';
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.imageUrl ? withImageParams(product.imageUrl, 'w=300&q=75&auto=format&fit=crop') : null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listingFor = propertyType ? propertyFormListingFor(propertyType, propertyValues) : null;
  const missingDetails = propertyType
    ? missingPropertyFields(propertyType, propertyValues)
    : clinicItem
      ? missingClinicFields(clinicItem, clinicValues)
      : educationItem
        ? missingEducationFields(educationItem, educationValues)
      : financeItem
        ? missingFinanceFields(financeItem, financeValues)
      : isTransport
        ? missingTransportFields(transportValues)
        : [];
  // A loan scheme and an investment plan carry no single price — their terms hold the numbers.
  const hasPriceBox = !isTransport && (!isFinance || financeHasPrice(financeType));
  const canSubmit =
    name.trim().length > 0 &&
    (!hasPriceBox || priceType === 'CONTACT_FOR_PRICE' || String(price).trim().length > 0) &&
    missingDetails.length === 0;
  const priceLabel = propertyType
    ? listingFor === 'SALE'
      ? 'Sale price (₹)'
      : `Rent (₹ ${priceUnitSuffix('PROPERTY', rentUnit)})`
    : clinicItem === 'DOCTOR'
      ? 'Consultation fee (₹)'
      : clinicItem === 'MEDICINE'
        ? 'Price / MRP (₹)'
        : educationItem
          ? educationPriceLabel(educationItem, educationValues)
          : financeItem
            ? financePriceLabel(financeItem, financeValues)
            : bookingKind === 'RENT'
              ? 'Rent (₹ / day)'
              : 'Price (₹)';

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const imageUrl = imageFile ? await fileToResizedDataUrl(imageFile).catch(() => undefined) : undefined;
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        priceType,
        price: priceType === 'FIXED' ? Number(price) : undefined,
        ...(cloudeSlug === 'skill' ? { isService } : {}),
        // A doctor/medicine sends its details; switching an existing one to "Other" clears them.
        ...(clinicItem
          ? { clinicDetails: clinicPayload(clinicItem, clinicValues) }
          : isClinic && product?.clinicDetails
            ? { clinicDetails: null }
            : {}),
        // A course/class/counselling/book sends its details; switching an existing one to "Other" clears them.
        ...(educationItem
          ? { educationDetails: educationPayload(educationItem, educationValues) }
          : isEducation && product?.educationDetails
            ? { educationDetails: null }
            : {}),
        // A scheme sends its financial terms; switching an existing one to "Other" clears them.
        ...(financeItem
          ? { financeDetails: financePayload(financeItem, financeValues) }
          : isFinance && product?.financeDetails
            ? { financeDetails: null }
            : {}),
        ...(propertyType
          ? { priceUnit: listingFor === 'SALE' ? 'FIXED' : rentUnit, propertyDetails: propertyPayload(propertyType, propertyValues) }
          : isTransport
            ? // The backend prices the vehicle from these rates.
              { transportDetails: transportPayload(transportValues) }
          : priceUnit
            ? { priceUnit }
            : {}),
        ...(imageUrl ? { imageUrl } : {}),
      };
      const saved = isEditing ? await api.products.update(product!.id, body, token) : await api.products.create(listingId, body, token);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not ${isEditing ? 'update' : 'add'} this ${noun} — please try again.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`my-auto flex max-h-[90vh] w-full animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0_/_0.5)] ${
          propertyType || clinicItem || isTransport || isEducation || financeItem ? 'max-w-lg' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            {isEditing ? <Pencil size={18} /> : propertyType ? <Home size={18} /> : isTransport ? <Truck size={18} /> : <Package size={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-bold text-ink">{isEditing ? `Edit ${noun}` : `Add a ${noun}`}</h3>
            <p className="text-xs text-ink-muted">
              {isEditing
                ? 'Update the details buyers see in your shop.'
                : propertyType
                  ? 'Fill in the details — buyers see them with the property.'
                  : isTransport
                    ? 'Buyers see the vehicle, delivery charge and hourly rate, and book it.'
                  : isClinic
                    ? "Patients see these details on your hospital's page."
                  : isEducation
                    ? 'Students see these details on your page, then enrol, book or buy.'
                  : isFinance
                    ? 'Buyers see every rate, charge and condition, work out their instalment, then apply with their documents.'
                    : "It'll show up in your shop's product list."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {isClinic && <ClinicTypePicker value={clinicType} onChange={setClinicType} />}
          {isEducation && <EducationTypePicker value={educationType} onChange={setEducationType} />}
          {isFinance && <FinanceTypePicker value={financeType} onChange={setFinanceType} />}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Photo</label>
            {imagePreview ? (
              <div className="flex items-center gap-3">
                <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    aria-label="Remove photo"
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X size={12} />
                  </button>
                </div>
                <p className="text-xs text-ink-muted">Remove it to pick a different photo.</p>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-bg px-4 py-3.5 transition-colors hover:border-brand hover:bg-brand-soft/30">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <ImagePlus size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">Upload a photo</span>
                  <span className="block text-xs text-ink-muted">A clear, well-lit shot sells best</span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">
                {propertyType ? 'Property title' : isTransport ? 'Vehicle / service name' : clinicItem === 'DOCTOR' ? "Doctor's name" : clinicItem === 'MEDICINE' ? 'Medicine name' : isEducation ? EDUCATION_FORM_TEXT[educationType].nameLabel : isFinance ? FINANCE_FORM_TEXT[financeType].nameLabel : 'Product name'}{' '}
                <span className="text-accent">*</span>
              </label>
              <span className="text-[11px] text-ink-muted">{name.length}/80</span>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              placeholder={
                propertyType
                  ? 'e.g. 2BHK Flat for Rent near Metro'
                  : isTransport
                    ? 'e.g. Tata Ace — Mandi Delivery'
                  : clinicItem === 'DOCTOR'
                    ? 'e.g. Dr. Anjali Sharma'
                    : clinicItem === 'MEDICINE'
                      ? 'e.g. Dolo 650'
                      : isClinic
                        ? 'e.g. Full Body Check-up'
                        : isEducation
                          ? EDUCATION_FORM_TEXT[educationType].namePlaceholder
                          : isFinance
                            ? FINANCE_FORM_TEXT[financeType].namePlaceholder
                            : 'e.g. Cotton Kurti — Blue'
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              rows={3}
              placeholder={
                propertyType
                  ? "Nearby places, house rules, what's included..."
                  : isTransport
                    ? 'Routes you cover, timings, what you carry (vegetables, grain, fertiliser bags)...'
                  : clinicItem === 'DOCTOR'
                    ? 'Languages spoken, treatments & procedures, awards...'
                    : clinicItem === 'MEDICINE'
                      ? "What it's used for, dosage, how to store it..."
                      : isClinic
                        ? "What's included, when reports are ready, how to prepare..."
                        : isEducation
                          ? EDUCATION_FORM_TEXT[educationType].descriptionPlaceholder
                          : isFinance
                            ? FINANCE_FORM_TEXT[financeType].descriptionPlaceholder
                            : 'Size, material, availability...'
              }
              className={`${inputClass} resize-y`}
            />
          </div>

          {clinicItem && <ClinicFieldsEditor type={clinicItem} values={clinicValues} onChange={setClinicValues} />}

          {educationItem && <EducationFieldsEditor type={educationItem} values={educationValues} onChange={setEducationValues} />}

          {financeItem && <FinanceFieldsEditor type={financeItem} values={financeValues} onChange={setFinanceValues} />}

          {isTransport && <TransportFieldsEditor values={transportValues} onChange={setTransportValues} />}

          {propertyType && (
            <PropertyFieldsEditor
              type={propertyType}
              values={propertyValues}
              onChange={setPropertyValues}
              rentUnit={rentUnit}
              onRentUnitChange={setRentUnit}
            />
          )}

          {cloudeSlug === 'skill' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">What are you offering?</label>
              <div className="flex gap-2">
                <ChoiceCard selected={!isService} onClick={() => setIsService(false)} icon={<Package size={14} />} label="Physical product" />
                <ChoiceCard selected={isService} onClick={() => setIsService(true)} icon={<Wrench size={14} />} label="Service" />
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
                {isService
                  ? 'On-site service (haircut, repair, tutoring...) — buyers only pick a time and pay online.'
                  : 'A physical item — buyers can choose Takeaway or Delivery, and Cash on Delivery.'}
              </p>
            </div>
          )}

          {/* A vehicle is priced by its rates above; a loan / investment plan by its own terms. */}
          {hasPriceBox && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">Pricing</label>
              <div className="flex gap-2">
                <ChoiceCard selected={priceType === 'FIXED'} onClick={() => setPriceType('FIXED')} icon={<Tag size={14} />} label="Fixed price" />
                <ChoiceCard
                  selected={priceType === 'CONTACT_FOR_PRICE'}
                  onClick={() => setPriceType('CONTACT_FOR_PRICE')}
                  icon={<MessageCircle size={14} />}
                  label="Contact for price"
                />
              </div>
            </div>
          )}

          {hasPriceBox && priceType === 'FIXED' && (
            <div className="animate-fade-in-up">
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                {priceLabel} <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">₹</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={propertyType ? (listingFor === 'SALE' ? '4500000' : '18500') : '499'}
                  inputMode="numeric"
                  className={`${inputClass} pl-8`}
                />
              </div>
              {propertyType && listingFor === 'RENT' && (
                <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">{PRICE_UNIT_HINTS[rentUnit]}</p>
              )}
            </div>
          )}

          {!propertyType && !isTransport && bookingKind && priceUnit && priceType === 'FIXED' && PRICE_UNIT_OPTIONS[bookingKind].length > 1 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">Price is</label>
              <div className="flex flex-wrap gap-2">
                {PRICE_UNIT_OPTIONS[bookingKind].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setPriceUnit(unit)}
                    aria-pressed={priceUnit === unit}
                    className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                      priceUnit === unit
                        ? 'border-brand bg-brand-soft text-brand ring-1 ring-brand'
                        : 'border-border bg-bg text-ink-muted hover:border-brand/50 hover:text-ink'
                    }`}
                  >
                    {priceUnitLabel(bookingKind, unit)}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">{PRICE_UNIT_HINTS[priceUnit]}</p>
            </div>
          )}

          {missingDetails.length > 0 && (
            <p className="text-[11px] leading-snug text-ink-muted">
              Still needed: <span className="font-medium text-ink">{missingDetails.join(', ')}</span>
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border bg-bg/60 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
            className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-10px_rgb(var(--brand)/0.9)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : isEditing ? <Check size={15} /> : <Plus size={15} />}
            {submitting ? (isEditing ? 'Saving…' : 'Adding…') : isEditing ? 'Save changes' : `Add ${noun}`}
          </button>
        </div>
      </div>
    </div>
  );
}
