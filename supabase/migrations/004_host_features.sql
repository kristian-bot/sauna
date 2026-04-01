-- 004_host_features.sql
-- Host reply on reviews, storage bucket, relaxed opening_hours constraint, dummy images

-- host_reply on reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS host_reply TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS host_reply_at TIMESTAMPTZ;

-- Supabase Storage bucket for sauna images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('sauna-images', 'sauna-images', true, 52428800, ARRAY['image/jpeg','image/png','image/webp']::TEXT[])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public can view sauna images" ON storage.objects;
CREATE POLICY "Public can view sauna images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sauna-images');

DROP POLICY IF EXISTS "Authenticated users can upload sauna images" ON storage.objects;
CREATE POLICY "Authenticated users can upload sauna images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sauna-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete own sauna images" ON storage.objects;
CREATE POLICY "Authenticated users can delete own sauna images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'sauna-images' AND auth.role() = 'authenticated');

-- Relax opening_hours constraint to allow multiple ranges per day
ALTER TABLE opening_hours DROP CONSTRAINT IF EXISTS opening_hours_sauna_id_day_of_week_key;
ALTER TABLE opening_hours ADD CONSTRAINT opening_hours_sauna_day_hour_key UNIQUE (sauna_id, day_of_week, open_hour);

-- Assign dummy images cyclically to seed saunas
UPDATE saunas SET image_urls = ARRAY['/images/saunas/sauna-' || ((id - 1) % 10 + 1) || '.jpg']
WHERE image_urls = '{}' OR image_urls IS NULL;
