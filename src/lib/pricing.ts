import type { BookingType, Sauna } from './types';

// Default fallback prices in øre (for legacy saunas without marketplace pricing)
const DEFAULT_PRIVATE_PRICE_OERE = 200000; // 2000 NOK
const DEFAULT_SHARED_PRICE_PER_PERSON_OERE = 20000; // 200 NOK per person

// Platform commission rate
const PLATFORM_COMMISSION_RATE = 0.15;

export function calculateCommission(totalOere: number) {
  const platformFee = Math.round(totalOere * PLATFORM_COMMISSION_RATE);
  return { platformFee, hostPayout: totalOere - platformFee };
}

export function getSaunaPrice(sauna: Sauna, bookingType: BookingType, numPeople: number): number {
  if (bookingType === 'private') {
    return sauna.private_price_oere ?? DEFAULT_PRIVATE_PRICE_OERE;
  }
  return (sauna.shared_price_per_person_oere ?? DEFAULT_SHARED_PRICE_PER_PERSON_OERE) * numPeople;
}

// Legacy function for backwards compatibility
export function calculatePrice(bookingType: BookingType, numPeople: number): number {
  if (bookingType === 'private') {
    return DEFAULT_PRIVATE_PRICE_OERE;
  }
  return DEFAULT_SHARED_PRICE_PER_PERSON_OERE * numPeople;
}

export function formatPriceNOK(oere: number): string {
  const nok = oere / 100;
  return `${nok.toLocaleString('nb-NO')} kr`;
}

export function getPriceDisplay(bookingType: BookingType, numPeople: number): string {
  const total = calculatePrice(bookingType, numPeople);
  if (bookingType === 'private') {
    return formatPriceNOK(total);
  }
  return `${formatPriceNOK(DEFAULT_SHARED_PRICE_PER_PERSON_OERE)}/person × ${numPeople} = ${formatPriceNOK(total)}`;
}

export function getSaunaPriceDisplay(sauna: Sauna, bookingType: BookingType, numPeople: number): string {
  const total = getSaunaPrice(sauna, bookingType, numPeople);
  if (bookingType === 'private') {
    return formatPriceNOK(total);
  }
  const perPerson = sauna.shared_price_per_person_oere ?? DEFAULT_SHARED_PRICE_PER_PERSON_OERE;
  return `${formatPriceNOK(perPerson)}/person × ${numPeople} = ${formatPriceNOK(total)}`;
}

export const PRIVATE_PRICE_NOK = DEFAULT_PRIVATE_PRICE_OERE / 100;
export const SHARED_PRICE_PER_PERSON_NOK = DEFAULT_SHARED_PRICE_PER_PERSON_OERE / 100;
export const PLATFORM_COMMISSION_PERCENT = PLATFORM_COMMISSION_RATE * 100;
