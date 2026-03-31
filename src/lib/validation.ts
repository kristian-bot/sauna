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
