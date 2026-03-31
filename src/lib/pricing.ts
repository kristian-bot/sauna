import type { BookingType } from './types';

// Prices in øre (1 NOK = 100 øre)
const PRIVATE_PRICE_OERE = 200000; // 2000 NOK
const SHARED_PRICE_PER_PERSON_OERE = 20000; // 200 NOK per person

export function calculatePrice(bookingType: BookingType, numPeople: number): number {
  if (bookingType === 'private') {
    return PRIVATE_PRICE_OERE;
  }
  return SHARED_PRICE_PER_PERSON_OERE * numPeople;
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
  return `${formatPriceNOK(SHARED_PRICE_PER_PERSON_OERE)}/person × ${numPeople} = ${formatPriceNOK(total)}`;
}

export const PRIVATE_PRICE_NOK = PRIVATE_PRICE_OERE / 100;
export const SHARED_PRICE_PER_PERSON_NOK = SHARED_PRICE_PER_PERSON_OERE / 100;
