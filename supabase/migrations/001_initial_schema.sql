-- ============================================================
-- Badstu Booking System — Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Tables
-- ============================================================

-- Saunas
CREATE TABLE saunas (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 12,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Time slots (created on first booking)
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sauna_id INT NOT NULL REFERENCES saunas(id),
  date DATE NOT NULL,
  hour INT NOT NULL CHECK (hour >= 0 AND hour <= 23),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('private', 'shared')),
  current_people INT NOT NULL DEFAULT 0,
  is_full BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sauna_id, date, hour)
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES slots(id),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('private', 'shared')),
  num_people INT NOT NULL DEFAULT 1,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  price_nok INT NOT NULL, -- in øre
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'expired', 'refunded')),
  qr_token UUID NOT NULL DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_qr_token ON bookings(qr_token);
CREATE INDEX idx_bookings_expires_at ON bookings(expires_at) WHERE status = 'pending_payment';

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  vipps_reference TEXT NOT NULL,
  vipps_psp_ref TEXT,
  amount_oere INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'authorized', 'captured', 'cancelled', 'refunded', 'expired', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_vipps_reference ON payments(vipps_reference);

-- Opening hours per sauna per weekday
CREATE TABLE opening_hours (
  id SERIAL PRIMARY KEY,
  sauna_id INT NOT NULL REFERENCES saunas(id),
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_hour INT NOT NULL CHECK (open_hour >= 0 AND open_hour <= 23),
  close_hour INT NOT NULL CHECK (close_hour >= 0 AND close_hour <= 23),
  is_closed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (sauna_id, day_of_week)
);

-- Admin users (references Supabase Auth)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin'
);

-- ============================================================
-- Updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- reserve_slot() — Atomic slot reservation
-- ============================================================

CREATE OR REPLACE FUNCTION reserve_slot(
  p_sauna_id INT,
  p_date DATE,
  p_hour INT,
  p_booking_type TEXT,
  p_num_people INT,
  p_capacity INT
)
RETURNS TABLE(slot_id UUID, success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_slot_id UUID;
  v_existing_type TEXT;
  v_current_people INT;
  v_is_full BOOLEAN;
BEGIN
  -- Try to lock existing slot
  SELECT s.id, s.booking_type, s.current_people, s.is_full
  INTO v_slot_id, v_existing_type, v_current_people, v_is_full
  FROM slots s
  WHERE s.sauna_id = p_sauna_id AND s.date = p_date AND s.hour = p_hour
  FOR UPDATE;

  IF v_slot_id IS NULL THEN
    -- No slot exists — create one
    INSERT INTO slots (sauna_id, date, hour, booking_type, current_people, is_full)
    VALUES (
      p_sauna_id,
      p_date,
      p_hour,
      p_booking_type,
      p_num_people,
      CASE
        WHEN p_booking_type = 'private' THEN true
        ELSE p_num_people >= p_capacity
      END
    )
    RETURNING id INTO v_slot_id;

    RETURN QUERY SELECT v_slot_id, true, NULL::TEXT;
    RETURN;
  END IF;

  -- Slot exists — validate
  IF v_is_full THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Tidspunktet er fullt booket'::TEXT;
    RETURN;
  END IF;

  IF v_existing_type != p_booking_type THEN
    IF v_existing_type = 'private' THEN
      RETURN QUERY SELECT NULL::UUID, false, 'Tidspunktet er booket som privat'::TEXT;
    ELSE
      RETURN QUERY SELECT NULL::UUID, false, 'Tidspunktet er allerede en fellesbooking'::TEXT;
    END IF;
    RETURN;
  END IF;

  IF p_booking_type = 'private' THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Tidspunktet er allerede booket'::TEXT;
    RETURN;
  END IF;

  -- Shared booking — check capacity
  IF v_current_people + p_num_people > p_capacity THEN
    RETURN QUERY SELECT NULL::UUID, false,
      ('Ikke nok plass. Ledig: ' || (p_capacity - v_current_people) || ' plasser')::TEXT;
    RETURN;
  END IF;

  -- Update slot
  UPDATE slots
  SET current_people = v_current_people + p_num_people,
      is_full = (v_current_people + p_num_people >= p_capacity)
  WHERE id = v_slot_id;

  RETURN QUERY SELECT v_slot_id, true, NULL::TEXT;
END;
$$;

-- ============================================================
-- release_slot() — Release people from a slot (on cancel/expire)
-- ============================================================

CREATE OR REPLACE FUNCTION release_slot(
  p_slot_id UUID,
  p_num_people INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_current INT;
  v_type TEXT;
BEGIN
  SELECT current_people, booking_type INTO v_current, v_type
  FROM slots WHERE id = p_slot_id FOR UPDATE;

  IF v_type = 'private' THEN
    DELETE FROM slots WHERE id = p_slot_id;
  ELSE
    UPDATE slots
    SET current_people = GREATEST(0, v_current - p_num_people),
        is_full = false
    WHERE id = p_slot_id;

    -- Clean up empty shared slots
    DELETE FROM slots WHERE id = p_slot_id AND current_people <= 0;
  END IF;
END;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE saunas ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public read access for saunas and opening_hours
CREATE POLICY "Anyone can view active saunas"
  ON saunas FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view opening hours"
  ON opening_hours FOR SELECT USING (true);

-- Slots: public read
CREATE POLICY "Anyone can view slots"
  ON slots FOR SELECT USING (true);

-- Bookings: read own via qr_token (handled via API with service role)
-- Admin full access via service role key

-- Service role bypasses RLS, so API routes using service role have full access

-- ============================================================
-- Seed: 9 saunas with default opening hours
-- ============================================================

INSERT INTO saunas (name, capacity) VALUES
  ('Badstu 1', 12),
  ('Badstu 2', 12),
  ('Badstu 3', 12),
  ('Badstu 4', 12),
  ('Badstu 5', 12),
  ('Badstu 6', 12),
  ('Badstu 7', 12),
  ('Badstu 8', 12),
  ('Badstu 9', 12);

-- Default opening hours: Mon-Sun 08:00–22:00
INSERT INTO opening_hours (sauna_id, day_of_week, open_hour, close_hour, is_closed)
SELECT s.id, d.day, 8, 22, false
FROM saunas s
CROSS JOIN generate_series(0, 6) AS d(day);
