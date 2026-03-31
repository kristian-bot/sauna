// ============================================================
// Database types
// ============================================================

export interface Sauna {
  id: number;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface Slot {
  id: string;
  sauna_id: number;
  date: string;
  hour: number;
  booking_type: BookingType;
  current_people: number;
  is_full: boolean;
  created_at: string;
}

export type BookingType = 'private' | 'shared';

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'cancelled'
  | 'expired'
  | 'refunded';

export interface Booking {
  id: string;
  slot_id: string;
  booking_type: BookingType;
  num_people: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  price_nok: number; // øre
  status: BookingStatus;
  qr_token: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithSlot extends Booking {
  slot: Slot & { sauna: Sauna };
}

export type PaymentStatus =
  | 'created'
  | 'authorized'
  | 'captured'
  | 'cancelled'
  | 'refunded'
  | 'expired'
  | 'failed';

export interface Payment {
  id: string;
  booking_id: string;
  vipps_reference: string;
  vipps_psp_ref: string | null;
  amount_oere: number;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface OpeningHours {
  id: number;
  sauna_id: number;
  day_of_week: number;
  open_hour: number;
  close_hour: number;
  is_closed: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

// ============================================================
// API types
// ============================================================

export interface SlotAvailability {
  hour: number;
  available: boolean;
  booking_type: BookingType | null;
  spots_left: number | null;
  is_full: boolean;
}

export interface CreateBookingRequest {
  sauna_id: number;
  date: string;
  hour: number;
  booking_type: BookingType;
  num_people: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export interface CreateBookingResponse {
  booking_id: string;
  vipps_redirect_url: string;
}

export interface ReserveSlotResult {
  slot_id: string;
  success: boolean;
  error_message: string | null;
}
