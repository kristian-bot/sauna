-- ============================================================
-- Marketplace Transformation Migration
-- ============================================================

-- ============================================================
-- New table: hosts (badstumestere)
-- ============================================================

CREATE TABLE hosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  bio TEXT,
  profile_image_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  stripe_account_id TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hosts_slug ON hosts(slug);

-- ============================================================
-- Alter saunas: add marketplace fields
-- ============================================================

ALTER TABLE saunas ADD COLUMN host_id UUID REFERENCES hosts(id);
ALTER TABLE saunas ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE saunas ADD COLUMN description TEXT;
ALTER TABLE saunas ADD COLUMN address TEXT;
ALTER TABLE saunas ADD COLUMN city TEXT;
ALTER TABLE saunas ADD COLUMN lat FLOAT;
ALTER TABLE saunas ADD COLUMN lng FLOAT;
ALTER TABLE saunas ADD COLUMN image_urls TEXT[] DEFAULT '{}';
ALTER TABLE saunas ADD COLUMN private_price_oere INT;
ALTER TABLE saunas ADD COLUMN shared_price_per_person_oere INT;
ALTER TABLE saunas ADD COLUMN allowed_booking_types TEXT[] DEFAULT '{shared,private}';
ALTER TABLE saunas ADD COLUMN min_people INT DEFAULT 1;
ALTER TABLE saunas ADD COLUMN max_people INT;

-- Set max_people from existing capacity for old saunas
UPDATE saunas SET max_people = capacity WHERE max_people IS NULL;

-- ============================================================
-- Alter bookings: add commission fields
-- ============================================================

ALTER TABLE bookings ADD COLUMN platform_fee_oere INT;
ALTER TABLE bookings ADD COLUMN host_payout_oere INT;

-- ============================================================
-- Alter payments: add commission fields
-- ============================================================

ALTER TABLE payments ADD COLUMN platform_fee_oere INT;
ALTER TABLE payments ADD COLUMN host_amount_oere INT;

-- ============================================================
-- New table: events (spesialarrangementer)
-- ============================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sauna_id INT NOT NULL REFERENCES saunas(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('yoga', 'breathing', 'meditation', 'custom')),
  date DATE NOT NULL,
  start_hour INT NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  duration_hours INT NOT NULL DEFAULT 1,
  max_participants INT NOT NULL,
  price_per_person_oere INT NOT NULL,
  current_participants INT NOT NULL DEFAULT 0,
  is_full BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_sauna_id ON events(sauna_id);
CREATE INDEX idx_events_date ON events(date);

-- ============================================================
-- New table: event_bookings
-- ============================================================

CREATE TABLE event_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id),
  num_people INT NOT NULL DEFAULT 1,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  price_nok INT NOT NULL, -- in øre
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'expired', 'refunded')),
  qr_token UUID NOT NULL DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_bookings_event_id ON event_bookings(event_id);
CREATE INDEX idx_event_bookings_qr_token ON event_bookings(qr_token);

-- ============================================================
-- reserve_event_slot() — Atomic event reservation
-- ============================================================

CREATE OR REPLACE FUNCTION reserve_event_slot(
  p_event_id UUID,
  p_num_people INT
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current INT;
  v_max INT;
  v_is_full BOOLEAN;
BEGIN
  -- Lock the event row
  SELECT current_participants, max_participants, is_full
  INTO v_current, v_max, v_is_full
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Event ikke funnet'::TEXT;
    RETURN;
  END IF;

  IF v_is_full THEN
    RETURN QUERY SELECT false, 'Eventet er fullt'::TEXT;
    RETURN;
  END IF;

  IF v_current + p_num_people > v_max THEN
    RETURN QUERY SELECT false,
      ('Ikke nok plass. Ledig: ' || (v_max - v_current) || ' plasser')::TEXT;
    RETURN;
  END IF;

  -- Update participants
  UPDATE events
  SET current_participants = v_current + p_num_people,
      is_full = (v_current + p_num_people >= v_max)
  WHERE id = p_event_id;

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$;

-- ============================================================
-- Row Level Security for new tables
-- ============================================================

ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view hosts" ON hosts FOR SELECT USING (true);
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);

-- Hosts can update their own profile
CREATE POLICY "Hosts can update own profile" ON hosts FOR UPDATE USING (id = auth.uid());

-- Allow all saunas to be read (update existing policy for new fields)
DROP POLICY IF EXISTS "Anyone can view active saunas" ON saunas;
CREATE POLICY "Anyone can view active saunas" ON saunas FOR SELECT USING (is_active = true);

-- ============================================================
-- Seed: 20 dummy hosts + 100 saunas across Norwegian cities
-- ============================================================

-- Create dummy auth users for hosts (using uuid_generate_v4 as they don't need real auth)
DO $$
DECLARE
  host_ids UUID[] := ARRAY[
    uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(),
    uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(),
    uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(),
    uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4()
  ];
BEGIN

-- Insert hosts
INSERT INTO hosts (id, email, name, phone, bio, slug, is_verified) VALUES
  (host_ids[1],  'erik@badstu.no',      'Erik Nordmann',      '91234567', 'Badstumester i Oslo med 10 års erfaring.', 'erik-nordmann', true),
  (host_ids[2],  'kari@badstu.no',      'Kari Johansen',      '92345678', 'Driver tre badstuer i Bergen sentrum.', 'kari-johansen', true),
  (host_ids[3],  'ole@badstu.no',       'Ole Hansen',         '93456789', 'Friluftsbastu-entusiast i Trondheim.', 'ole-hansen', true),
  (host_ids[4],  'nina@badstu.no',      'Nina Larsen',        '94567890', 'Yoga og badstu i Tromsø under nordlyset.', 'nina-larsen', true),
  (host_ids[5],  'lars@badstu.no',      'Lars Berg',          '95678901', 'Tradisjonell finsk badstu i Stavanger.', 'lars-berg', true),
  (host_ids[6],  'hanne@badstu.no',     'Hanne Kristiansen',  '96789012', 'Moderne badstu-opplevelser i Kristiansand.', 'hanne-kristiansen', true),
  (host_ids[7],  'bjorn@badstu.no',     'Bjørn Pedersen',     '97890123', 'Badstu ved sjøen i Bodø.', 'bjorn-pedersen', true),
  (host_ids[8],  'ingrid@badstu.no',    'Ingrid Moe',         '98901234', 'Badstu med utsikt i Ålesund.', 'ingrid-moe', true),
  (host_ids[9],  'thomas@badstu.no',    'Thomas Nilsen',      '91012345', 'Badstu-gründer i Drammen.', 'thomas-nilsen', true),
  (host_ids[10], 'silje@badstu.no',     'Silje Olsen',        '92123456', 'Familievennlig badstu i Fredrikstad.', 'silje-olsen', true),
  (host_ids[11], 'anders@badstu.no',    'Anders Vik',         '93234567', 'Flytende badstu i Oslofjorden.', 'anders-vik', true),
  (host_ids[12], 'maren@badstu.no',     'Maren Solberg',      '94345678', 'Premium badstu i Bergen.', 'maren-solberg', true),
  (host_ids[13], 'per@badstu.no',       'Per Strand',         '95456789', 'Badstu ved Nidelva i Trondheim.', 'per-strand', true),
  (host_ids[14], 'lise@badstu.no',      'Lise Haug',          '96567890', 'Arktisk badstu i Tromsø.', 'lise-haug', true),
  (host_ids[15], 'magnus@badstu.no',    'Magnus Dahl',        '97678901', 'Fjord-badstu i Stavanger.', 'magnus-dahl', true),
  (host_ids[16], 'camilla@badstu.no',   'Camilla Ruud',       '98789012', 'Strandbastu i Kristiansand.', 'camilla-ruud', true),
  (host_ids[17], 'svein@badstu.no',     'Svein Lund',         '91890123', 'Fjelbastu i Bodø.', 'svein-lund', true),
  (host_ids[18], 'anne@badstu.no',      'Anne Berge',         '92901234', 'Moderne spa-badstu i Ålesund.', 'anne-berge', true),
  (host_ids[19], 'kristian@badstu.no',  'Kristian Aas',       '93012345', 'Urbane badstuopplevelser i Drammen.', 'kristian-aas', true),
  (host_ids[20], 'tone@badstu.no',      'Tone Fjeld',         '94123456', 'Historisk badstu i Fredrikstad.', 'tone-fjeld', true);

-- Insert 100 saunas across Norwegian cities
-- Oslo (lat ~59.91, lng ~10.75) - 15 saunas
INSERT INTO saunas (name, capacity, is_active, host_id, slug, description, address, city, lat, lng, private_price_oere, shared_price_per_person_oere, max_people) VALUES
  ('Aker Brygge Badstu', 10, true, host_ids[1], 'aker-brygge-badstu', 'Moderne badstu med utsikt over Oslofjorden. Nyt en varm badstue etter en lang dag i byen.', 'Aker Brygge 1', 'Oslo', 59.9111, 10.7280, 250000, 25000, 10),
  ('Sørenga Sjøbad Sauna', 12, true, host_ids[1], 'sorenga-sjobad-sauna', 'Flytende badstu ved Sørenga. Hopp rett i fjorden etterpå!', 'Sørenga 15', 'Oslo', 59.9030, 10.7530, 300000, 30000, 12),
  ('Grünerløkka Dampbad', 8, true, host_ids[11], 'grunerløkka-dampbad', 'Intim badstu midt på Løkka. Perfekt for en kveld med venner.', 'Thorvald Meyers gate 50', 'Oslo', 59.9225, 10.7590, 200000, 25000, 8),
  ('Frognerparken Badstu', 15, true, host_ids[11], 'frognerparken-badstu', 'Storbastu ved Frognerparken med plass til store grupper.', 'Kirkeveien 100', 'Oslo', 59.9270, 10.7010, 350000, 22000, 15),
  ('Bygdøy Strandbad Sauna', 10, true, host_ids[1], 'bygdoy-strandbad-sauna', 'Badstu ved Huk strand. Bading i sjøen inkludert.', 'Huk Aveny 2', 'Oslo', 59.8980, 10.6770, 280000, 28000, 10),
  ('Tjuvholmen Badstue', 8, true, host_ids[11], 'tjuvholmen-badstue', 'Eksklusiv badstu på Tjuvholmen med panoramautsikt.', 'Tjuvholmen allé 5', 'Oslo', 59.9080, 10.7220, 350000, 35000, 8),
  ('Hovedøya Sauna', 12, true, host_ids[1], 'hovedoya-sauna', 'Badstu på Hovedøya — en unik øy-opplevelse.', 'Hovedøya', 'Oslo', 59.8960, 10.7350, 200000, 20000, 12),
  ('Mathallen Dampbad', 6, true, host_ids[11], 'mathallen-dampbad', 'Liten og koselig badstu ved Mathallen. Perfekt for par.', 'Vulkan 5', 'Oslo', 59.9225, 10.7520, 180000, 30000, 6),
  ('Ekeberg Badstu', 10, true, host_ids[1], 'ekeberg-badstu', 'Badstu med panoramautsikt over byen fra Ekebergskråningen.', 'Kongsveien 15', 'Oslo', 59.8990, 10.7680, 250000, 25000, 10),
  ('Holmenkollen Fjellbadstu', 8, true, host_ids[11], 'holmenkollen-fjellbadstu', 'Fjellbadstu med utsikt. Perfekt vinteropplevelse.', 'Holmenkollveien 120', 'Oslo', 59.9640, 10.6670, 300000, 30000, 8),
  ('Operaen Badstue', 10, true, host_ids[1], 'operaen-badstue', 'Flytende badstu ved Operaen. Ikonisk beliggenhet.', 'Kirsten Flagstads plass 1', 'Oslo', 59.9070, 10.7530, 320000, 32000, 10),
  ('Sagene Dampbad', 8, true, host_ids[11], 'sagene-dampbad', 'Tradisjonell badstu i nabolaget. Folkelig og hyggelig.', 'Arendalsgata 20', 'Oslo', 59.9350, 10.7530, 150000, 18000, 8),
  ('Tøyen Badstue', 10, true, host_ids[1], 'toyen-badstue', 'Moderne badstu med grønt fokus. Bærekraftig varme.', 'Tøyengata 30', 'Oslo', 59.9130, 10.7720, 200000, 20000, 10),
  ('St. Hanshaugen Sauna', 6, true, host_ids[11], 'st-hanshaugen-sauna', 'Intim badstu ved parken. Rolig og avslappende.', 'Ullevålsveien 60', 'Oslo', 59.9290, 10.7430, 180000, 28000, 6),
  ('Bjørvika Badstue', 12, true, host_ids[1], 'bjorvika-badstue', 'Ny badstu i Bjørvika. Moderne fasiliteter.', 'Dronning Eufemias gate 10', 'Oslo', 59.9080, 10.7580, 280000, 25000, 12);

-- Bergen (lat ~60.39, lng ~5.32) - 12 saunas
INSERT INTO saunas (name, capacity, is_active, host_id, slug, description, address, city, lat, lng, private_price_oere, shared_price_per_person_oere, max_people) VALUES
  ('Bryggen Badstu', 10, true, host_ids[2], 'bryggen-badstu', 'Historisk badstu ved Bryggen. UNESCO-verdensarv som kulisse.', 'Bryggen 3', 'Bergen', 60.3975, 5.3240, 280000, 28000, 10),
  ('Fløyen Fjellbadstu', 8, true, host_ids[2], 'floyen-fjellbadstu', 'Badstu på toppen av Fløyen. Utsikt over hele Bergen.', 'Fløyen', 'Bergen', 60.3960, 5.3440, 320000, 35000, 8),
  ('Nordnes Sjøbad Sauna', 12, true, host_ids[12], 'nordnes-sjobad-sauna', 'Tradisjonell sjøbad med badstu ved Nordnes.', 'Nordnesparken 2', 'Bergen', 60.3960, 5.3050, 200000, 20000, 12),
  ('Sandviken Dampbad', 8, true, host_ids[2], 'sandviken-dampbad', 'Koselig badstu i Sandviken. Nær sjøen.', 'Sandviksboder 15', 'Bergen', 60.4050, 5.3270, 180000, 22000, 8),
  ('Laksevåg Badstue', 10, true, host_ids[12], 'laksevag-badstue', 'Familiebadstu i Laksevåg. God plass til alle.', 'Damsgårdsveien 50', 'Bergen', 60.3880, 5.3040, 200000, 20000, 10),
  ('Fjellveien Sauna', 6, true, host_ids[2], 'fjellveien-sauna', 'Intim badstu langs Fjellveien med panoramautsikt.', 'Fjellveien 30', 'Bergen', 60.3940, 5.3360, 250000, 35000, 6),
  ('Åsane Badstu', 12, true, host_ids[12], 'asane-badstu', 'Romslig badstu i Åsane. Gratis parkering.', 'Åsane senter', 'Bergen', 60.4650, 5.3320, 180000, 18000, 12),
  ('Fantoft Sauna', 8, true, host_ids[2], 'fantoft-sauna', 'Studentvennlig badstu nær Fantoft. Rimelige priser.', 'Fantoftvegen 20', 'Bergen', 60.3480, 5.3500, 150000, 15000, 8),
  ('Store Lungegårdsvann Badstu', 10, true, host_ids[12], 'store-lungegardsvann-badstu', 'Badstu ved vannet midt i Bergen sentrum.', 'Rasmus Meyers allé 5', 'Bergen', 60.3880, 5.3280, 250000, 25000, 10),
  ('Paradis Strandbad Sauna', 10, true, host_ids[2], 'paradis-strandbad-sauna', 'Strandbastu i Paradis. Sol og bad.', 'Paradisveien 10', 'Bergen', 60.3620, 5.3350, 220000, 22000, 10),
  ('Verftet Badstu', 8, true, host_ids[12], 'verftet-badstu', 'Industriell badstu i gammelt verft. Rå og autentisk.', 'USF Verftet', 'Bergen', 60.3920, 5.3170, 200000, 25000, 8),
  ('Ulriken Toppbadstu', 6, true, host_ids[2], 'ulriken-toppbadstu', 'Norges høyeste badstu! På toppen av Ulriken.', 'Ulriken 643', 'Bergen', 60.3780, 5.3890, 400000, 45000, 6);

-- Trondheim (lat ~63.43, lng ~10.40) - 12 saunas
INSERT INTO saunas (name, capacity, is_active, host_id, slug, description, address, city, lat, lng, private_price_oere, shared_price_per_person_oere, max_people) VALUES
  ('Nidelva Flytebadstu', 10, true, host_ids[3], 'nidelva-flytebadstu', 'Flytende badstu på Nidelva. Hopp i elva etterpå!', 'Kjøpmannsgata 40', 'Trondheim', 63.4310, 10.4020, 250000, 25000, 10),
  ('Bakklandet Dampbad', 8, true, host_ids[13], 'bakklandet-dampbad', 'Sjarmerende badstu i Bakklandet. Nær gamle bybro.', 'Øvre Bakklandet 20', 'Trondheim', 63.4290, 10.4060, 200000, 25000, 8),
  ('Solsiden Badstu', 12, true, host_ids[3], 'solsiden-badstu', 'Moderne badstu på Solsiden. Utsikt over fjorden.', 'Beddingen 10', 'Trondheim', 63.4350, 10.4150, 280000, 25000, 12),
  ('Lade Strandbadstu', 10, true, host_ids[13], 'lade-strandbadstu', 'Badstu ved Ladestien. Natur og sjø.', 'Ladeveien 50', 'Trondheim', 63.4450, 10.4400, 220000, 22000, 10),
  ('Kristiansten Festning Sauna', 8, true, host_ids[3], 'kristiansten-festning-sauna', 'Historisk badstu ved festningen. Fantastisk utsikt.', 'Kristiansten', 'Trondheim', 63.4260, 10.4130, 250000, 28000, 8),
  ('Gløshaugen Sauna', 6, true, host_ids[13], 'gloshaugen-sauna', 'Studentbadstu nær NTNU. Rimelig og sosialt.', 'Høgskoleringen 5', 'Trondheim', 63.4185, 10.4015, 120000, 15000, 6),
  ('Ila Sjøbadstu', 10, true, host_ids[3], 'ila-sjobadstu', 'Badstu ved sjøen i Ila. Rolig og fredelig.', 'Ilaparken', 'Trondheim', 63.4370, 10.3780, 200000, 20000, 10),
  ('Midtbyen Dampbad', 8, true, host_ids[13], 'midtbyen-dampbad', 'Sentral badstu i Midtbyen. Gå-avstand til alt.', 'Nordre gate 15', 'Trondheim', 63.4300, 10.3950, 220000, 25000, 8),
  ('Byåsen Utsiktsbadstu', 8, true, host_ids[3], 'byasen-utsiktsbadstu', 'Badstu med byutsikt fra Byåsen. Magisk ved solnedgang.', 'Byåsveien 80', 'Trondheim', 63.4130, 10.3600, 250000, 28000, 8),
  ('Korsvika Strandbadstu', 10, true, host_ids[13], 'korsvika-strandbadstu', 'Badstu på populær badestrand. Sol og bading.', 'Korsvika', 'Trondheim', 63.4470, 10.4550, 200000, 20000, 10),
  ('Nidarosdomen Badstu', 8, true, host_ids[3], 'nidarosdomen-badstu', 'Badstu i historiske omgivelser nær Nidarosdomen.', 'Bispegata 5', 'Trondheim', 63.4270, 10.3970, 280000, 30000, 8),
  ('Marinen Badstu', 10, true, host_ids[13], 'marinen-badstu', 'Havnebadstu ved Brattøra. Industriell sjarm.', 'Brattørkaia 15', 'Trondheim', 63.4380, 10.4030, 200000, 22000, 10);

-- Tromsø (lat ~69.65, lng ~18.96) - 10 saunas
INSERT INTO saunas (name, capacity, is_active, host_id, slug, description, address, city, lat, lng, private_price_oere, shared_price_per_person_oere, max_people) VALUES
  ('Nordlys Badstu', 8, true, host_ids[4], 'nordlys-badstu', 'Se nordlyset fra badstuen! Vinterens høydepunkt.', 'Strandveien 10', 'Tromsø', 69.6500, 18.9560, 350000, 35000, 8),
  ('Ishavskatedralen Sauna', 10, true, host_ids[14], 'ishavskatedralen-sauna', 'Arktisk badstu med utsikt mot Ishavskatedralen.', 'Tromsøbrua', 'Tromsø', 69.6480, 19.0440, 300000, 30000, 10),
  ('Telegrafbukta Badstu', 8, true, host_ids[4], 'telegrafbukta-badstu', 'Strandbadstu med utsikt over havet. Midnattsol om sommeren.', 'Telegrafbukta', 'Tromsø', 69.6350, 18.9360, 280000, 28000, 8),
  ('Polaria Dampbad', 10, true, host_ids[14], 'polaria-dampbad', 'Badstu ved Polaria. Arktisk opplevelse.', 'Hjalmar Johansens gate 12', 'Tromsø', 69.6470, 18.9500, 250000, 25000, 10),
  ('Fjellheisen Toppbadstu', 6, true, host_ids[4], 'fjellheisen-toppbadstu', 'Badstu på toppen av Tromsø! 421 meter over havet.', 'Fjellheisen', 'Tromsø', 69.6440, 19.0380, 400000, 50000, 6),
  ('Kvaløya Badstu', 10, true, host_ids[14], 'kvaloya-badstu', 'Øy-badstu på Kvaløya. Natur og stillhet.', 'Kvaløysletta', 'Tromsø', 69.6800, 18.8200, 220000, 22000, 10),
  ('Sentrum Dampbad', 8, true, host_ids[4], 'sentrum-dampbad', 'Badstu midt i Tromsø sentrum. Enkel tilgang.', 'Storgata 50', 'Tromsø', 69.6490, 18.9580, 200000, 25000, 8),
  ('Sommarøy Sauna', 8, true, host_ids[14], 'sommaroy-sauna', 'Paradis-badstu på Sommarøy. Hvite strender og turkist vann.', 'Sommarøy', 'Tromsø', 69.6330, 18.0430, 350000, 35000, 8),
  ('Håkøya Badstu', 6, true, host_ids[4], 'hakoya-badstu', 'Fredelig øy-badstu. Perfekt for en dagstur.', 'Håkøya', 'Tromsø', 69.6700, 18.8700, 200000, 30000, 6),
  ('Tromsøya Storbadstu', 15, true, host_ids[14], 'tromsoya-storbadstu', 'Stor badstu for grupper og events. Tromsøs største.', 'Stakkevollveien 30', 'Tromsø', 69.6620, 18.9700, 400000, 22000, 15);

-- Stavanger (lat ~58.97, lng ~5.73) - 10 saunas
INSERT INTO saunas (name, capacity, is_active, host_id, slug, description, address, city, lat, lng, private_price_oere, shared_price_per_person_oere, max_people) VALUES
  ('Vågen Badstu', 10, true, host_ids[5], 'vagen-badstu', 'Badstu ved Vågen i Stavanger sentrum. Havne-atmosfære.', 'Vågen 5', 'Stavanger', 58.9730, 5.7310, 250000, 25000, 10),
  ('Gamle Stavanger Sauna', 8, true, host_ids[15], 'gamle-stavanger-sauna', 'Sjarmerende badstu i Gamle Stavanger. Hvite trehus.', 'Øvre Strandgate 10', 'Stavanger', 58.9720, 5.7270, 280000, 30000, 8),
  ('Sola Strand Badstu', 12, true, host_ids[5], 'sola-strand-badstu', 'Strandbadstu på Solastranden. Sol, sand og sauna.', 'Solastranden', 'Stavanger', 58.8860, 5.5870, 200000, 20000, 12),
  ('Lysefjorden Badstu', 6, true, host_ids[15], 'lysefjorden-badstu', 'Fjord-badstu med utsikt over Lysefjorden. Unikt!', 'Lysebotn', 'Stavanger', 59.0530, 6.6430, 350000, 45000, 6),
  ('Ullandhaug Sauna', 10, true, host_ids[5], 'ullandhaug-sauna', 'Badstu med universitetsutsikt. Nær UiS.', 'Ullandhaug', 'Stavanger', 58.9420, 5.6920, 180000, 18000, 10),
  ('Eiganes Dampbad', 8, true, host_ids[15], 'eiganes-dampbad', 'Nabolagsbadstu i Eiganes. Hyggelig atmosfære.', 'Eiganesveien 30', 'Stavanger', 58.9630, 5.7220, 200000, 22000, 8),
  ('Hundvåg Sjøbadstu', 10, true, host_ids[5], 'hundvag-sjobadstu', 'Øy-badstu på Hundvåg. Fred og ro.', 'Hundvåg ring 10', 'Stavanger', 58.9880, 5.7050, 220000, 22000, 10),
  ('Forus Badstu', 12, true, host_ids[15], 'forus-badstu', 'Moderne badstu på Forus. Etter-jobb favoritt.', 'Forusveien 50', 'Stavanger', 58.9070, 5.7330, 200000, 20000, 12),
  ('Storhaug Badstue', 8, true, host_ids[5], 'storhaug-badstue', 'Urban badstu på Storhaug. Trendy nabolag.', 'Ryfylkegata 15', 'Stavanger', 58.9760, 5.7500, 200000, 25000, 8),
  ('Hafrsfjord Badstu', 10, true, host_ids[15], 'hafrsfjord-badstu', 'Badstu ved Sverd i fjell. Historisk beliggenhet.', 'Hafrsfjord', 'Stavanger', 58.9420, 5.6580, 250000, 25000, 10);

-- Kristiansand (lat ~58.15, lng ~8.00) - 8 saunas
INSERT INTO saunas (name, capacity, is_active, host_id, slug, description, address, city, lat, lng, private_price_oere, shared_price_per_person_oere, max_people) VALUES
  ('Bystranda Badstu', 10, true, host_ids[6], 'bystranda-badstu', 'Strandbadstu ved Bystranda. Sørlandet sommer!', 'Bystranda', 'Kristiansand', 58.1420, 8.0070, 250000, 25000, 10),
  ('Posebyen Dampbad', 8, true, host_ids[16], 'posebyen-dampbad', 'Sjarmerende badstu i Posebyen. Hvite trehus.', 'Posebyen', 'Kristiansand', 58.1490, 7.9960, 220000, 25000, 8),
  ('Odderøya Sauna', 10, true, host_ids[6], 'odderoya-sauna', 'Øy-badstu på Odderøya. Natur i byen.', 'Odderøya', 'Kristiansand', 58.1380, 7.9870, 200000, 20000, 10),
  ('Fiskebrygga Badstu', 8, true, host_ids[16], 'fiskebrygga-badstu', 'Badstu ved Fiskebrygga. Sjømat og sauna.', 'Gravane 2', 'Kristiansand', 58.1450, 8.0020, 250000, 28000, 8),
  ('Hamresanden Strandbadstu', 12, true, host_ids[6], 'hamresanden-strandbadstu', 'Lang sandstrand med badstu. Perfekt sommerdag.', 'Hamresanden', 'Kristiansand', 58.1750, 8.0800, 200000, 18000, 12),
  ('Baneheia Skogsbadstu', 6, true, host_ids[16], 'baneheia-skogsbadstu', 'Badstu i skogen. Naturopplevelse i byen.', 'Baneheia', 'Kristiansand', 58.1560, 7.9860, 180000, 28000, 6),
  ('Lund Badstue', 8, true, host_ids[6], 'lund-badstue', 'Nabolagsbadstu på Lund. Rolig og familievennlig.', 'Kongsgårdbakken 5', 'Kristiansand', 58.1600, 8.0100, 180000, 20000, 8),
  ('Dyreparken Sauna', 10, true, host_ids[16], 'dyreparken-sauna', 'Badstu nær Dyreparken. Perfekt etter en dag med familien.', 'Kardemomme by', 'Kristiansand', 58.1880, 8.1380, 200000, 20000, 10);

-- Bodø (lat ~67.28, lng ~14.40) - 8 saunas
INSERT INTO saunas (name, capacity, is_active, host_id, slug, description, address, city, lat, lng, private_price_oere, shared_price_per_person_oere, max_people) VALUES
  ('Saltstraumen Badstu', 8, true, host_ids[7], 'saltstraumen-badstu', 'Badstu ved verdens sterkeste malstrøm. Unikt!', 'Saltstraumen', 'Bodø', 67.2310, 14.6270, 300000, 35000, 8),
  ('Bodø Havn Sauna', 10, true, host_ids[17], 'bodo-havn-sauna', 'Havnebadstu med utsikt mot Lofoten.', 'Sjøgata 10', 'Bodø', 67.2870, 14.3970, 250000, 25000, 10),
  ('Nordland Fjellbadstu', 6, true, host_ids[7], 'nordland-fjellbadstu', 'Fjellbadstu over Bodø. Midnattsol-opplevelse.', 'Keiservarden', 'Bodø', 67.2780, 14.4290, 280000, 35000, 6),
  ('Rønvikleira Badstu', 10, true, host_ids[17], 'ronvikleira-badstu', 'Strandbadstu på Rønvikleira. Fugleliv og natur.', 'Rønvikleira', 'Bodø', 67.3000, 14.4200, 200000, 20000, 10),
  ('Mørkved Dampbad', 8, true, host_ids[7], 'morkved-dampbad', 'Studentvennlig badstu nær Nord Universitet.', 'Mørkvedlia 5', 'Bodø', 67.3100, 14.4800, 150000, 15000, 8),
  ('Tverlandet Sauna', 10, true, host_ids[17], 'tverlandet-sauna', 'Landlig badstu på Tverlandet. Stillhet og natur.', 'Tverlandet', 'Bodø', 67.2200, 14.5500, 180000, 18000, 10),
  ('Hunstad Badstue', 8, true, host_ids[7], 'hunstad-badstue', 'Familiebadstu på Hunstad. God for store grupper.', 'Hunstadmoen 10', 'Bodø', 67.2700, 14.4600, 180000, 20000, 8),
  ('Nyholmen Sjøbadstu', 8, true, host_ids[17], 'nyholmen-sjobadstu', 'Historisk badstu ved Nyholmen Skandse.', 'Nyholmen', 'Bodø', 67.2890, 14.3800, 220000, 25000, 8);

-- Ålesund (lat ~62.47, lng ~6.15) - 8 saunas
INSERT INTO saunas (name, capacity, is_active, host_id, slug, description, address, city, lat, lng, private_price_oere, shared_price_per_person_oere, max_people) VALUES
  ('Aksla Toppbadstu', 6, true, host_ids[8], 'aksla-toppbadstu', 'Badstu på toppen av Aksla. Jugendby-panorama.', 'Fjellstua', 'Ålesund', 62.4720, 6.1480, 350000, 45000, 6),
  ('Brosundet Badstu', 10, true, host_ids[18], 'brosundet-badstu', 'Sjøbadstu ved Brosundet. Ikonisk Ålesund.', 'Brosundet 1', 'Ålesund', 62.4710, 6.1520, 280000, 28000, 10),
  ('Jugend Dampbad', 8, true, host_ids[8], 'jugend-dampbad', 'Art nouveau badstu i jugendkvartalet. Stilfullt.', 'Apotekergata 5', 'Ålesund', 62.4700, 6.1500, 250000, 30000, 8),
  ('Langevåg Strandbadstu', 10, true, host_ids[18], 'langevag-strandbadstu', 'Strandbadstu med fjord-utsikt. Idyllisk.', 'Langevåg', 'Ålesund', 62.4550, 6.1050, 200000, 20000, 10),
  ('Ålesund Havn Sauna', 12, true, host_ids[8], 'alesund-havn-sauna', 'Moderne havnebadstu. Perfekt etter en sjøtur.', 'Skansekaia 5', 'Ålesund', 62.4730, 6.1500, 250000, 22000, 12),
  ('Hessa Badstue', 8, true, host_ids[18], 'hessa-badstue', 'Øy-badstu på Hessa. Stille og rolig.', 'Hessa', 'Ålesund', 62.4680, 6.1250, 200000, 25000, 8),
  ('Nørvøya Sauna', 8, true, host_ids[8], 'norvoya-sauna', 'Fiskerbadstu på Nørvøya. Tradisjonell sjarm.', 'Nørvøya', 'Ålesund', 62.4760, 6.1400, 180000, 22000, 8),
  ('Moa Badstu', 10, true, host_ids[18], 'moa-badstu', 'Enkel tilgang nær Moa senter. Parkering.', 'Moavegen 20', 'Ålesund', 62.4800, 6.2700, 180000, 18000, 10);

-- Drammen (lat ~59.74, lng ~10.20) - 8 saunas
INSERT INTO saunas (name, capacity, is_active, host_id, slug, description, address, city, lat, lng, private_price_oere, shared_price_per_person_oere, max_people) VALUES
  ('Drammenselva Flytebadstu', 10, true, host_ids[9], 'drammenselva-flytebadstu', 'Flytende badstu på Drammenselva. Hopp i elva!', 'Bragernes strand 5', 'Drammen', 59.7440, 10.2090, 250000, 25000, 10),
  ('Bragernes Dampbad', 8, true, host_ids[19], 'bragernes-dampbad', 'Sentral badstu på Bragernes. Gå-avstand til alt.', 'Bragernes torg 3', 'Drammen', 59.7430, 10.2050, 200000, 22000, 8),
  ('Spiralen Utsiktsbadstu', 6, true, host_ids[9], 'spiralen-utsiktsbadstu', 'Badstu ved Spiralen. Utsikt over Drammensfjorden.', 'Spiraltoppen', 'Drammen', 59.7350, 10.2210, 280000, 35000, 6),
  ('Marienlyst Badstu', 10, true, host_ids[19], 'marienlyst-badstu', 'Badstu nær Marienlyst. Familievennlig.', 'Marienlystveien 10', 'Drammen', 59.7520, 10.2230, 200000, 20000, 10),
  ('Strømsø Badstue', 8, true, host_ids[9], 'stromso-badstue', 'Urban badstu på Strømsø. Trendy nabolag.', 'Strømsø torg 5', 'Drammen', 59.7400, 10.2130, 200000, 22000, 8),
  ('Konnerud Skogsbadstu', 8, true, host_ids[19], 'konnerud-skogsbadstu', 'Skogsbadstu på Konnerud. Natur og frisk luft.', 'Konnerud', 'Drammen', 59.7180, 10.1650, 180000, 20000, 8),
  ('Holmen Sjøbadstu', 10, true, host_ids[9], 'holmen-sjobadstu', 'Fjord-badstu ved Holmen. Drammensfjorden.', 'Holmen', 'Drammen', 59.7350, 10.1900, 220000, 22000, 10),
  ('Gulskogen Badstu', 10, true, host_ids[19], 'gulskogen-badstu', 'Rolig badstu ved Gulskogen. Stor tomt.', 'Gulskogsveien 30', 'Drammen', 59.7310, 10.1670, 180000, 18000, 10);

-- Fredrikstad (lat ~59.22, lng ~10.93) - 9 saunas
INSERT INTO saunas (name, capacity, is_active, host_id, slug, description, address, city, lat, lng, private_price_oere, shared_price_per_person_oere, max_people) VALUES
  ('Gamlebyen Badstu', 10, true, host_ids[10], 'gamlebyen-badstu', 'Historisk badstu i Gamlebyen. Festningsby-atmosfære.', 'Gamlebyen', 'Fredrikstad', 59.2090, 10.9350, 250000, 25000, 10),
  ('Glomma Flytebadstu', 8, true, host_ids[20], 'glomma-flytebadstu', 'Flytende badstu på Glomma. Norges lengste elv!', 'Glomma', 'Fredrikstad', 59.2200, 10.9400, 220000, 25000, 8),
  ('Isegran Sauna', 8, true, host_ids[10], 'isegran-sauna', 'Øy-badstu på Isegran. Historisk idyll.', 'Isegran', 'Fredrikstad', 59.2100, 10.9420, 200000, 22000, 8),
  ('Kråkerøy Strandbadstu', 10, true, host_ids[20], 'krakerøy-strandbadstu', 'Strandbadstu på Kråkerøy. Sommerparadis.', 'Kråkerøy', 'Fredrikstad', 59.2020, 10.9600, 200000, 20000, 10),
  ('Sentrum Dampbad', 8, true, host_ids[10], 'fredrikstad-sentrum-dampbad', 'Bybadstu i Fredrikstad sentrum. Lett tilgjengelig.', 'Storgata 10', 'Fredrikstad', 59.2200, 10.9350, 180000, 20000, 8),
  ('Hvaler Sjøbadstu', 8, true, host_ids[20], 'hvaler-sjobadstu', 'Skjærgårdsbadstu i Hvaler. Sommerens høydepunkt!', 'Hvaler', 'Fredrikstad', 59.0850, 10.9800, 300000, 30000, 8),
  ('Gressvik Badstue', 10, true, host_ids[10], 'gressvik-badstue', 'Familievennlig badstu i Gressvik.', 'Gressvik', 'Fredrikstad', 59.2260, 10.9150, 180000, 18000, 10),
  ('Sellebakk Sauna', 8, true, host_ids[20], 'sellebakk-sauna', 'Rolig nabolagsbadstu i Sellebakk.', 'Sellebakk', 'Fredrikstad', 59.1950, 10.9500, 180000, 20000, 8),
  ('Torp Skogsbadstu', 10, true, host_ids[10], 'torp-skogsbadstu', 'Badstu i skogen ved Torp. Naturopplevelse.', 'Torp', 'Fredrikstad', 59.2400, 10.9100, 200000, 20000, 10);

-- Also give existing 9 saunas marketplace fields (host, slug, etc.)
UPDATE saunas SET
  host_id = host_ids[1],
  slug = 'chill-sauna-' || id,
  description = 'Original Chill Sauna badstu. Tradisjonell badstu med plass til ' || capacity || ' personer.',
  address = 'Chill Sauna Senteret',
  city = 'Oslo',
  lat = 59.91 + (id * 0.002),
  lng = 10.75 + (id * 0.003),
  private_price_oere = 200000,
  shared_price_per_person_oere = 20000,
  max_people = capacity
WHERE slug IS NULL;

-- Some sample events
INSERT INTO events (sauna_id, title, description, event_type, date, start_hour, duration_hours, max_participants, price_per_person_oere) VALUES
  ((SELECT id FROM saunas WHERE slug = 'aker-brygge-badstu'), 'Yoga i badstuen', 'Kombinert yoga- og badstu-opplevelse. Ta med yogamatte!', 'yoga', '2026-05-01', 18, 2, 10, 45000),
  ((SELECT id FROM saunas WHERE slug = 'bryggen-badstu'), 'Pusteøvelser & Badstu', 'Wim Hof-inspirerte pusteøvelser etterfulgt av badstu og isbad.', 'breathing', '2026-05-03', 17, 2, 8, 50000),
  ((SELECT id FROM saunas WHERE slug = 'nidelva-flytebadstu'), 'Meditasjon på vannet', 'Guidet meditasjon i flytende badstu. En unik opplevelse.', 'meditation', '2026-05-05', 19, 1, 8, 35000),
  ((SELECT id FROM saunas WHERE slug = 'nordlys-badstu'), 'Nordlys-yoga', 'Yoga under nordlyset i oppvarmet badstu. Magisk!', 'yoga', '2026-05-10', 20, 2, 6, 60000),
  ((SELECT id FROM saunas WHERE slug = 'vagen-badstu'), 'Morgenmeditasjon', 'Start dagen med guidet meditasjon og badstu ved havnen.', 'meditation', '2026-05-08', 7, 1, 10, 30000);

END $$;
