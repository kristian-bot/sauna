import { z } from 'zod';

export const bookingTypeSchema = z.enum(['private', 'shared']);

export const createBookingSchema = z.object({
  sauna_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ugyldig datoformat (YYYY-MM-DD)'),
  hour: z.number().int().min(0).max(23),
  booking_type: bookingTypeSchema,
  num_people: z.number().int().min(1).max(30),
  customer_name: z.string().min(2, 'Navn må ha minst 2 tegn').max(100),
  customer_email: z.string().email('Ugyldig e-postadresse'),
  customer_phone: z.string().min(8, 'Ugyldig telefonnummer').max(15),
});

export const openingHoursSchema = z.object({
  sauna_id: z.number().int().positive(),
  day_of_week: z.number().int().min(0).max(6),
  open_hour: z.number().int().min(0).max(23),
  close_hour: z.number().int().min(0).max(23),
  is_closed: z.boolean(),
});

export const saunaSchema = z.object({
  name: z.string().min(1).max(100),
  capacity: z.number().int().min(1).max(50),
  is_active: z.boolean(),
});

// Marketplace schemas

export const hostRegisterSchema = z.object({
  name: z.string().min(2, 'Navn må ha minst 2 tegn').max(100),
  email: z.string().email('Ugyldig e-postadresse'),
  phone: z.string().min(8, 'Ugyldig telefonnummer').max(15),
  password: z.string().min(6, 'Passord må ha minst 6 tegn'),
  bio: z.string().max(500).optional(),
});

export const createSaunaSchema = z.object({
  name: z.string().min(2, 'Navn må ha minst 2 tegn').max(100),
  description: z.string().min(10, 'Beskrivelse må ha minst 10 tegn').max(1000),
  address: z.string().min(2).max(200),
  city: z.string().min(2).max(100),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  capacity: z.number().int().min(1).max(50),
  max_people: z.number().int().min(1).max(50),
  min_people: z.number().int().min(1).max(50).optional(),
  private_price_oere: z.number().int().min(0).nullable().optional(),
  shared_price_per_person_oere: z.number().int().min(0).nullable().optional(),
  allowed_booking_types: z.array(z.enum(['private', 'shared'])).min(1),
});

export const updateSaunaSchema = createSaunaSchema.partial();

export const createEventSchema = z.object({
  title: z.string().min(2, 'Tittel må ha minst 2 tegn').max(200),
  description: z.string().max(1000).optional(),
  event_type: z.enum(['yoga', 'breathing', 'meditation', 'custom']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ugyldig datoformat'),
  start_hour: z.number().int().min(0).max(23),
  duration_hours: z.number().int().min(1).max(8),
  max_participants: z.number().int().min(1).max(100),
  price_per_person_oere: z.number().int().min(0),
});

export const bookEventSchema = z.object({
  num_people: z.number().int().min(1).max(30),
  customer_name: z.string().min(2, 'Navn må ha minst 2 tegn').max(100),
  customer_email: z.string().email('Ugyldig e-postadresse'),
  customer_phone: z.string().min(8, 'Ugyldig telefonnummer').max(15),
});

export const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ugyldig datoformat'),
  hours: z.array(z.object({
    hour: z.number().int().min(0).max(23),
    is_available: z.boolean(),
  })),
});
