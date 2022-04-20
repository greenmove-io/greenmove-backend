DROP DATABASE IF EXISTS greenmove;
CREATE DATABASE greenmove;

\c greenmove;

CREATE TABLE places (
  place_id VARCHAR(16),
  place_type VARCHAR(12),
  name VARCHAR,
  county VARCHAR,
  country VARCHAR,
  rating NUMERIC(3,2),
  last_updated BIGINT,
  PRIMARY KEY(place_id)
);

CREATE TABLE places_properties (
  place_id VARCHAR(16),
  wiki_item VARCHAR,
  osm_id INTEGER,
  place_area BIGINT,
  place_boundary VARCHAR(32),
  area_inaccurate BOOLEAN,
  latitude NUMERIC(16, 12),
  longitude NUMERIC(16, 12),
  population BIGINT,
  postcode_districts VARCHAR [],
  CONSTRAINT fk_place FOREIGN KEY(place_id) REFERENCES places(place_id)
);

CREATE TABLE places_qualities (
  place_id VARCHAR(16),
  air_quality INTEGER,
  air_quality_label VARCHAR,
  water_quality INTEGER,
  greenspace INTEGER,
  waste_recycling INTEGER,
  vehicle_quantity INTEGER,
  bus_stop_quantity INTEGER,
  population_density INTEGER,
  CONSTRAINT fk_place FOREIGN KEY(place_id) REFERENCES places(place_id)
)
