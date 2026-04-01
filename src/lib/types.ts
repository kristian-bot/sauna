// ============================================================
// Database types
// ============================================================

export interface Host {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  slug: string;
  stripe_account_id: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Sauna {
  id: number;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  // Marketplace fields
  host_id: string | null;
  slug: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  image_urls: string[];
  private_price_oere: number | null;
  shared_price_per_person_oere: number | null;
  allowed_booking_types: string[];
  min_people: number;
  max_people: number | null;
  average_rating: number | null;
  review_count: number;
}

export interface MapSauna {
  id: number;
  name: string;
  slug: string;
  city: string;
  lat: number;
  lng: number;
  private_price_oere: number | null;
  shared_price_per_person_oere: number | null;
  image_urls: string[];
  max_people: number;
  average_rating: number | null;
  review_count: number;
}

export interface SaunaWithHost extends Sauna {
  host: Host;
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
  platform_fee_oere: number | null;
  host_payout_oere: number | null;
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
  platform_fee_oere: number | null;
  host_amount_oere: number | null;
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

export type EventType = 'yoga' | 'breathing' | 'meditation' | 'custom';

export interface Event {
  id: string;
  sauna_id: number;
  title: string;
  description: string | null;
  event_type: EventType;
  date: string;
  start_hour: number;
  duration_hours: number;
  max_participants: number;
  price_per_person_oere: number;
  current_participants: number;
  is_full: boolean;
  created_at: string;
}

export interface EventWithSauna extends Event {
  sauna: Sauna;
}

export interface EventBooking {
  id: string;
  event_id: string;
  num_people: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  price_nok: number; // øre
  status: BookingStatus;
  qr_token: string;
  expires_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  sauna_id: number;
  customer_name: string;
  customer_email: string;
  rating: number;
  comment: string | null;
  created_at: string;
  host_reply: string | null;
  host_reply_at: string | null;
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

export interface ReserveEventSlotResult {
  success: boolean;
  error_message: string | null;
}
