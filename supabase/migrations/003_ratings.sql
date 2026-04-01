-- ============================================================
-- 003: Reviews & Ratings
-- ============================================================

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
  sauna_id INT NOT NULL REFERENCES saunas(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_sauna_id ON reviews(sauna_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Add rating columns to saunas
ALTER TABLE saunas
  ADD COLUMN average_rating FLOAT,
  ADD COLUMN review_count INT NOT NULL DEFAULT 0;

-- Add review_email_sent to bookings
ALTER TABLE bookings
  ADD COLUMN review_email_sent BOOLEAN NOT NULL DEFAULT false;

-- Function to submit a review and update sauna rating atomically
CREATE OR REPLACE FUNCTION submit_review(
  p_booking_id UUID,
  p_rating INT,
  p_comment TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking RECORD;
  v_review_id UUID;
BEGIN
  -- Get booking details
  SELECT b.id, b.customer_name, b.customer_email, b.status, s.sauna_id
  INTO v_booking
  FROM bookings b
  JOIN slots s ON s.id = b.slot_id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status != 'confirmed' THEN
    RAISE EXCEPTION 'Booking is not confirmed';
  END IF;

  -- Check rating range
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Insert review (UNIQUE constraint on booking_id prevents duplicates)
  INSERT INTO reviews (booking_id, sauna_id, customer_name, customer_email, rating, comment)
  VALUES (p_booking_id, v_booking.sauna_id, v_booking.customer_name, v_booking.customer_email, p_rating, p_comment)
  RETURNING id INTO v_review_id;

  -- Update sauna average rating and count
  UPDATE saunas
  SET review_count = (SELECT COUNT(*) FROM reviews WHERE sauna_id = v_booking.sauna_id),
      average_rating = (SELECT AVG(rating)::FLOAT FROM reviews WHERE sauna_id = v_booking.sauna_id)
  WHERE id = v_booking.sauna_id;

  RETURN v_review_id;
END;
$$;

-- RLS policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read reviews"
  ON reviews FOR SELECT
  USING (true);
