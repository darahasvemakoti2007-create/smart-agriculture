-- ============================================================
-- SmartAgri — Initial Database Schema
-- Migration: 0001_initial_schema.sql
-- ============================================================
-- This migration creates all application tables, foreign keys,
-- indexes, RLS policies, and triggers for the Smart Agriculture
-- platform running on Supabase (PostgreSQL).
--
-- DO NOT run this migration more than once without rolling back.
-- ============================================================


-- ============================================================
-- 1. REUSABLE TRIGGER FUNCTION — auto-update "updated_at"
-- ============================================================
-- Any table with an updated_at column can attach this trigger.
-- It fires BEFORE UPDATE and sets updated_at to the current UTC time.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 2. TABLES  (created in dependency order)
-- ============================================================


-- -------------------------------------------------------
-- 2a. profiles
-- -------------------------------------------------------
-- One row per registered user.  The id column directly
-- references auth.users so the profile is automatically
-- tied to the Supabase Auth user.

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  language    TEXT DEFAULT 'en',
  location    TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc', now()),

  CONSTRAINT profiles_latitude_range
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT profiles_longitude_range
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- -------------------------------------------------------
-- 2b. farms
-- -------------------------------------------------------

CREATE TABLE public.farms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_name       TEXT NOT NULL,
  location        TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  area            NUMERIC,
  area_unit       TEXT DEFAULT 'acres',
  soil_type       TEXT,
  irrigation_type TEXT,
  created_at      TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at      TIMESTAMPTZ DEFAULT timezone('utc', now()),

  CONSTRAINT farms_latitude_range
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT farms_longitude_range
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  CONSTRAINT farms_area_positive
    CHECK (area IS NULL OR area > 0),
  CONSTRAINT farms_area_unit_valid
    CHECK (area_unit IN ('acres', 'hectares', 'sq_meters', 'sq_feet'))
);

CREATE INDEX idx_farms_user_id   ON public.farms(user_id);
CREATE INDEX idx_farms_created_at ON public.farms(created_at);

CREATE TRIGGER set_farms_updated_at
  BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- -------------------------------------------------------
-- 2c. crops
-- -------------------------------------------------------

CREATE TABLE public.crops (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id               UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_name             TEXT NOT NULL,
  variety               TEXT,
  planting_date         DATE,
  expected_harvest_date DATE,
  status                TEXT DEFAULT 'active',
  created_at            TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at            TIMESTAMPTZ DEFAULT timezone('utc', now()),

  CONSTRAINT crops_status_valid
    CHECK (status IN ('active', 'harvested', 'failed', 'planned')),
  CONSTRAINT crops_harvest_after_planting
    CHECK (
      expected_harvest_date IS NULL
      OR planting_date IS NULL
      OR expected_harvest_date >= planting_date
    )
);

CREATE INDEX idx_crops_user_id    ON public.crops(user_id);
CREATE INDEX idx_crops_farm_id    ON public.crops(farm_id);
CREATE INDEX idx_crops_created_at ON public.crops(created_at);

CREATE TRIGGER set_crops_updated_at
  BEFORE UPDATE ON public.crops
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- -------------------------------------------------------
-- 2d. crop_images
-- -------------------------------------------------------

CREATE TABLE public.crop_images (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id              UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT,
  image_url            TEXT NOT NULL,
  image_type           TEXT DEFAULT 'crop',
  uploaded_at          TIMESTAMPTZ DEFAULT timezone('utc', now()),

  CONSTRAINT crop_images_type_valid
    CHECK (image_type IN ('crop', 'leaf', 'soil', 'pest', 'other'))
);

CREATE INDEX idx_crop_images_user_id ON public.crop_images(user_id);
CREATE INDEX idx_crop_images_crop_id ON public.crop_images(crop_id);


-- -------------------------------------------------------
-- 2e. disease_analyses
-- -------------------------------------------------------

CREATE TABLE public.disease_analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id      UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_id     UUID REFERENCES public.crop_images(id) ON DELETE SET NULL,
  disease_name TEXT,
  confidence   NUMERIC,
  severity     TEXT,
  symptoms     JSONB,
  risk_level   TEXT,
  ai_response  JSONB,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc', now()),

  CONSTRAINT disease_analyses_confidence_range
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
  CONSTRAINT disease_analyses_severity_valid
    CHECK (severity IS NULL OR severity IN ('low', 'moderate', 'high', 'critical')),
  CONSTRAINT disease_analyses_risk_valid
    CHECK (risk_level IS NULL OR risk_level IN ('low', 'moderate', 'high', 'critical'))
);

CREATE INDEX idx_disease_analyses_user_id    ON public.disease_analyses(user_id);
CREATE INDEX idx_disease_analyses_crop_id    ON public.disease_analyses(crop_id);
CREATE INDEX idx_disease_analyses_created_at ON public.disease_analyses(created_at);


-- -------------------------------------------------------
-- 2f. soil_readings
-- -------------------------------------------------------

CREATE TABLE public.soil_readings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id        UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ph             NUMERIC,
  nitrogen       NUMERIC,
  phosphorus     NUMERIC,
  potassium      NUMERIC,
  moisture       NUMERIC,
  temperature    NUMERIC,
  organic_carbon NUMERIC,
  recorded_at    TIMESTAMPTZ DEFAULT timezone('utc', now()),

  CONSTRAINT soil_readings_ph_range
    CHECK (ph IS NULL OR (ph >= 0 AND ph <= 14)),
  CONSTRAINT soil_readings_moisture_range
    CHECK (moisture IS NULL OR (moisture >= 0 AND moisture <= 100))
);

CREATE INDEX idx_soil_readings_user_id     ON public.soil_readings(user_id);
CREATE INDEX idx_soil_readings_farm_id     ON public.soil_readings(farm_id);
CREATE INDEX idx_soil_readings_recorded_at ON public.soil_readings(recorded_at);


-- -------------------------------------------------------
-- 2g. weather_records
-- -------------------------------------------------------

CREATE TABLE public.weather_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id           UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temperature       NUMERIC,
  humidity          NUMERIC,
  rain_probability  NUMERIC,
  wind_speed        NUMERIC,
  weather_condition TEXT,
  forecast_date     DATE,
  raw_response      JSONB,
  created_at        TIMESTAMPTZ DEFAULT timezone('utc', now()),

  CONSTRAINT weather_records_humidity_range
    CHECK (humidity IS NULL OR (humidity >= 0 AND humidity <= 100)),
  CONSTRAINT weather_records_rain_range
    CHECK (rain_probability IS NULL OR (rain_probability >= 0 AND rain_probability <= 100)),
  CONSTRAINT weather_records_wind_positive
    CHECK (wind_speed IS NULL OR wind_speed >= 0)
);

CREATE INDEX idx_weather_records_user_id    ON public.weather_records(user_id);
CREATE INDEX idx_weather_records_farm_id    ON public.weather_records(farm_id);
CREATE INDEX idx_weather_records_created_at ON public.weather_records(created_at);


-- -------------------------------------------------------
-- 2h. irrigation_records
-- -------------------------------------------------------

CREATE TABLE public.irrigation_records (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id                    UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  crop_id                    UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  user_id                    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  soil_moisture              NUMERIC,
  recommendation             TEXT,
  recommended_time           TIMESTAMPTZ,
  estimated_duration_minutes INTEGER,
  confidence                 NUMERIC,
  created_at                 TIMESTAMPTZ DEFAULT timezone('utc', now()),

  CONSTRAINT irrigation_records_moisture_range
    CHECK (soil_moisture IS NULL OR (soil_moisture >= 0 AND soil_moisture <= 100)),
  CONSTRAINT irrigation_records_duration_positive
    CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0),
  CONSTRAINT irrigation_records_confidence_range
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100))
);

CREATE INDEX idx_irrigation_records_user_id    ON public.irrigation_records(user_id);
CREATE INDEX idx_irrigation_records_farm_id    ON public.irrigation_records(farm_id);
CREATE INDEX idx_irrigation_records_crop_id    ON public.irrigation_records(crop_id);
CREATE INDEX idx_irrigation_records_created_at ON public.irrigation_records(created_at);


-- -------------------------------------------------------
-- 2i. recommendations
-- -------------------------------------------------------

CREATE TABLE public.recommendations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id     UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  crop_id     UUID REFERENCES public.crops(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  priority    TEXT DEFAULT 'medium',
  source      TEXT,
  confidence  NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc', now()),
  expires_at  TIMESTAMPTZ,

  CONSTRAINT recommendations_type_valid
    CHECK (type IN ('disease', 'irrigation', 'soil', 'weather', 'general')),
  CONSTRAINT recommendations_priority_valid
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT recommendations_confidence_range
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
  CONSTRAINT recommendations_expires_after_created
    CHECK (expires_at IS NULL OR expires_at >= created_at)
);

CREATE INDEX idx_recommendations_user_id    ON public.recommendations(user_id);
CREATE INDEX idx_recommendations_farm_id    ON public.recommendations(farm_id);
CREATE INDEX idx_recommendations_crop_id    ON public.recommendations(crop_id);
CREATE INDEX idx_recommendations_created_at ON public.recommendations(created_at);


-- -------------------------------------------------------
-- 2j. alerts
-- -------------------------------------------------------

CREATE TABLE public.alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id    UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  crop_id    UUID REFERENCES public.crops(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity   TEXT DEFAULT 'medium',
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  expires_at TIMESTAMPTZ,

  CONSTRAINT alerts_type_valid
    CHECK (alert_type IN ('disease', 'weather', 'irrigation', 'soil', 'general')),
  CONSTRAINT alerts_severity_valid
    CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_alerts_user_id    ON public.alerts(user_id);
CREATE INDEX idx_alerts_farm_id    ON public.alerts(farm_id);
CREATE INDEX idx_alerts_is_read    ON public.alerts(user_id, is_read);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at);


-- ============================================================
-- 3. ROW LEVEL SECURITY  — enable on every table
-- ============================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_analyses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_readings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts             ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
-- Every policy targets the "authenticated" role only.
-- No policies are created for the "anon" role.
--
-- For profiles  → ownership check is (auth.uid() = id)
-- For all other → ownership check is (auth.uid() = user_id)
-- INSERT policies use WITH CHECK to validate ownership on write.


-- ---- profiles ----
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);


-- ---- farms ----
CREATE POLICY "Users can view own farms"
  ON public.farms FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own farms"
  ON public.farms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own farms"
  ON public.farms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own farms"
  ON public.farms FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ---- crops ----
CREATE POLICY "Users can view own crops"
  ON public.crops FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crops"
  ON public.crops FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crops"
  ON public.crops FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own crops"
  ON public.crops FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ---- crop_images ----
CREATE POLICY "Users can view own crop images"
  ON public.crop_images FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crop images"
  ON public.crop_images FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crop images"
  ON public.crop_images FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own crop images"
  ON public.crop_images FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ---- disease_analyses ----
CREATE POLICY "Users can view own disease analyses"
  ON public.disease_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own disease analyses"
  ON public.disease_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own disease analyses"
  ON public.disease_analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own disease analyses"
  ON public.disease_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ---- soil_readings ----
CREATE POLICY "Users can view own soil readings"
  ON public.soil_readings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own soil readings"
  ON public.soil_readings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own soil readings"
  ON public.soil_readings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own soil readings"
  ON public.soil_readings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ---- weather_records ----
CREATE POLICY "Users can view own weather records"
  ON public.weather_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weather records"
  ON public.weather_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weather records"
  ON public.weather_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weather records"
  ON public.weather_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ---- irrigation_records ----
CREATE POLICY "Users can view own irrigation records"
  ON public.irrigation_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own irrigation records"
  ON public.irrigation_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own irrigation records"
  ON public.irrigation_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own irrigation records"
  ON public.irrigation_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ---- recommendations ----
CREATE POLICY "Users can view own recommendations"
  ON public.recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON public.recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON public.recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
  ON public.recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ---- alerts ----
CREATE POLICY "Users can view own alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON public.alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
-- This trigger fires whenever Supabase Auth inserts a new user
-- into auth.users.  It creates a matching row in public.profiles
-- so the application always has a profile row for every user.
--
-- SECURITY DEFINER runs the function with the privileges of the
-- owner (the database owner), which is necessary because RLS
-- would otherwise block the insert (there is no authenticated
-- session yet at signup time).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- END OF MIGRATION
-- ============================================================
