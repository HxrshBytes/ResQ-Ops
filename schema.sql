-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Base Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  phone_number VARCHAR(15) UNIQUE,
  role VARCHAR(50) CHECK (role IN ('CITIZEN', 'FARMER', 'FISHERMAN', 'COMMANDER')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP Auth Table
CREATE TABLE IF NOT EXISTS auth_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(15) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geospatial Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id VARCHAR(255) REFERENCES users(id),
  incident_type VARCHAR(50) NOT NULL, -- 'FLOOD', 'TREE_FALL', 'POWER_LINE', 'ROAD_BLOCK'
  description TEXT,
  location GEOMETRY(Point, 4326),
  status VARCHAR(20) DEFAULT 'REPORTED', -- 'REPORTED', 'VERIFIED', 'RESOLVED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast spatial queries
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST (location);

-- Database Schema for Agro-Marine Telemetry (PostgreSQL)

-- Farmer field and crop profile
CREATE TABLE IF NOT EXISTS farmer_farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES users(id),
  soil_type VARCHAR(50), -- 'BLACK_COTTON', 'ALLUVIAL', 'RED_LOAMY'
  primary_crop VARCHAR(50) NOT NULL,
  crop_stage VARCHAR(50) NOT NULL, -- 'SOWING', 'VEGETATIVE', 'FLOWERING', 'HARVEST'
  farm_polygon TEXT NOT NULL -- Store GeoJSON or WKT boundary
);

-- Coastal fisherman vessel and license profile
CREATE TABLE IF NOT EXISTS fisherman_vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES users(id),
  vessel_reg_no VARCHAR(50) UNIQUE NOT NULL,
  vessel_type VARCHAR(30) CHECK (vessel_type IN ('TRADITIONAL_CANOE', 'MOTORIZED_FIBER', 'MECHANIZED_TRAWLER')),
  home_harbor VARCHAR(100) NOT NULL,
  max_sea_distance_nm INT DEFAULT 12 -- 12 NM for small craft, 200 NM for deep sea
);

-- Cached localized weather & ocean telemetry log
CREATE TABLE IF NOT EXISTS agro_marine_telemetry_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geohash VARCHAR(12) NOT NULL,
  significant_wave_height_m NUMERIC(4,2),
  wind_speed_kmh NUMERIC(5,2),
  rain_probability_pct INT,
  soil_moisture_kpa NUMERIC(5,2),
  advisory_bulletin JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_geohash ON agro_marine_telemetry_cache(geohash);
