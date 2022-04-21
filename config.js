require('dotenv').config();

exports.ACCESS_TOKEN = process.env.ACCESS_TOKEN;
exports.DATABASE_URL = process.env.DATABASE_URL;
exports.IS_LOCAL_DEV = JSON.parse(process.env.IS_LOCAL_DEV);
exports.BASE_URL = process.env.BASE_URL || 'http://localhost:3080';

exports.AQICN_API_URL = process.env.AQICN_API_URL;
exports.AQICN_API_KEY = process.env.AQICN_API_KEY;

exports.WIKIDATA_API_URL = process.env.WIKIDATA_API_URL;
exports.POSTCODESIO_API_URL = process.env.POSTCODESIO_API_URL;
exports.NOMINATIM_API_URL = process.env.NOMINATIM_API_URL;
exports.OVERPASS_API_URL = process.env.OVERPASS_API_URL;
exports.GITHUB_API_KEY = process.env.GITHUB_API_KEY;
exports.GITHUB_BRANCH = process.env.GITHUB_BRANCH;

exports.required_props = ['wiki_item', 'osm_id', 'population', 'postcode_districts', 'area', 'latitude', 'longitude', 'air_quality', 'air_quality_label', 'geometry', 'area_inaccurate'];
exports.aqi_levels = [[0, 'Good'], [50, 'Good'], [100, 'Moderate'], [150, 'Unhealthy for Sensitive Groups'], [200, 'Unhealthy'], [300, 'Very Unhealthy'], [500, 'Hazardous']];
exports.GEOJSON_PRESET = {
    "type":"FeatureCollection",
    "features":[]
};

exports.CITY_SPARQL = (city) => `
  SELECT DISTINCT ?item ?name ?population ?area ?unitLabel ?latitude ?longitude WHERE {
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    VALUES
      ?type {wd:Q515} ?item wdt:P31 ?type .
      ?item rdfs:label ?queryByTitle.
      ?item wdt:P17 wd:Q145.
      ?item p:P625 ?statement . # coordinate-location statement
      ?statement psv:P625 ?coordinate_node .
      OPTIONAL { ?coordinate_node wikibase:geoLatitude ?latitude. }
      OPTIONAL { ?coordinate_node wikibase:geoLongitude ?longitude.}
      OPTIONAL {
        ?item p:P2046 ?areastatement .
        ?areastatement psn:P2046 ?areanode .
        ?areanode wikibase:quantityAmount ?area.
        ?areanode wikibase:quantityUnit ?unit.
      }


      OPTIONAL { ?item rdfs:label ?name. }
      OPTIONAL { ?item wdt:P1082 ?population. }
      FILTER(REGEX(?queryByTitle, "${city}"))
      FILTER (lang(?name) = "en")

  } LIMIT 10
`;

exports.BUS_STOPS_OSM = (osmID) => `
  make here_a_new_block_begins num = ${osmID};
  out;
  rel(${osmID});
  map_to_area;
  nwr[highway=bus_stop](area) -> .all;
  make counter num = 0 -> .count;
  foreach.all {
      .count convert counter num = t['num'] + 1 -> .count;
  }
  .count out;
`;

exports.CITY_DATA = [
  {
    "name": "Aberdeen",
    "country": "Scotland",
    "county": "Aberdeen"
  },
  {
    "name": "Bangor",
    "country": "Wales",
    "county": "Gwynedd"
  },
  {
    "name": "Bath",
    "country": "England",
    "county": "Somerset"
  },
  {
    "name": "Belfast",
    "country": "Northern Ireland",
    "county": "Antrim"
  },
  {
    "name": "Birmingham",
    "country": "England",
    "county": "West Midlands"
  },
  {
    "name": "Bradford",
    "country": "England",
    "county": "West Yorkshire"
  },
  {
    "name": "Bristol",
    "country": "England",
    "county": "Bristol"
  },
  {
    "name": "Cambridge",
    "country": "England",
    "county": "Cambridgeshire"
  },
];
