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

exports.default_required_props = [
  'place_id',
  'place_type',
  'name',
  'county',
  'country',
  'rating',
  'last_updated',
];

exports.properties_required_props = [
  'wiki_item',
  'osm_id',
  'area',
  'geometry',
  'boundary_id',
  'boundary_last_updated',
  'area_inaccurate',
  'latitude',
  'longitude',
  'population',
  'park_quantity',
  'park_area',
  'greenspace_area',
  'bus_stop_quantity',
  'vehicle_quantity',
  'bicycle_parking_quantity',
  'walking_routes_quantity',
  'walking_routes_length',
  'cycling_routes_quantity',
  'cycling_routes_length',
  'postcode_districts'
];

exports.qualities_required_props = [
  'air_quality',
  'air_quality_label',
  'greenspace',
  'greenspace_area_ratio',
  'park_area_ratio',
  'park_average_area',
  'park_population_ratio',
  'bus_stop_population_ratio',
  'vehicle_population_ratio',
  'bicycle_parking_population_ratio',
  'population_density',
  'walking_routes_ratio',
  'cycling_routes_ratio'
];

exports.qualities_ranges = {
  air_quality: {
    min: 500,
    max: 0
  },
  population_density: {
    min: 99999,
    max: 0
  },
  greenspace_area_ratio: {
    min: 999,
    max: 0
  },
  park_area_ratio: {
    min: 9999,
    max: 0
  },
  park_average_area: {
    min: 9999999,
    max: 0
  },
  park_population_ratio: {
    min: 9999,
    max: 0
  },
  vehicle_population_ratio: {
    min: 9999,
    max: 0
  },
  bus_stop_population_ratio: {
    min: 9999,
    max: 0
  },
  bicycle_parking_population_ratio: {
    min: 9999,
    max: 0
  },
  walking_routes_ratio: {
    min: 9999,
    max: 0
  },
  cycling_routes_ratio: {
    min: 9999,
    max: 0
  }
}

exports.interquartiles = {
  air_quality: {
    isLowerBetter: true,
    arr: [],
    STD: 0,
    Q1: 0,
    Q2: 0,
    Q3: 0,
  },
  population_density: {
    isLowerBetter: true,
    arr: [],
    STD: 0,
    Q1: 0,
    Q2: 0,
    Q3: 0
  },
  greenspace_area_ratio: {
    isLowerBetter: false,
    arr: [],
    STD: 0,
    Q1: 0,
    Q2: 0,
    Q3: 0,
  },
  park_area_ratio: {
    isLowerBetter: false,
    arr: [],
    STD: 0,
    Q1: 0,
    Q2: 0,
    Q3: 0,
  },
  park_average_area: {
    isLowerBetter: false,
    arr: [],
    STD: 0,
    Q1: 0,
    Q2: 0,
    Q3: 0
  },
  park_population_ratio: {
    isLowerBetter: false,
    arr: [],
    STD: 0,
    Q1: 0,
    Q2: 0,
    Q3: 0,
  },
  vehicle_population_ratio: {
    isLowerBetter: false,
    arr: [],
    STD: 0,
    Q1: 0,
    Q2: 0,
    Q3: 0,
  },
  bus_stop_population_ratio: {
    isLowerBetter: false,
    arr: [],
    STD: 0,
    Q1: 0,
    Q2: 0,
    Q3: 0,
  },
  bicycle_parking_population_ratio: {
    isLowerBetter: false,
    arr: [],
    STD: 0,
    Q1: 0,
    Q2: 0,
    Q3: 0,
  },
  walking_routes_ratio: {
    isLowerBetter: false,
    arr: [],
    STD: 0,
    Q1: 0,
    Q2: 0,
    Q3: 0,
  },
  cycling_routes_ratio: {
    isLowerBetter: false,
    arr: [],
    STD: 0,
    Q1: 0,
    Q2: 0,
    Q3: 0,
  }
};

exports.aqi_levels = [
  [0, 'Good'],
  [50, 'Good'],
  [100, 'Moderate'],
  [150, 'Unhealthy for Sensitive Groups'],
  [200, 'Unhealthy'],
  [300, 'Very Unhealthy'],
  [500, 'Hazardous']];

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

exports.GREENSPACE_OSM = (osmID) => `
  [out:json][timeout:240];
    rel(${osmID});
    map_to_area->.myarea;
    (
      way["landuse"~"grass|forest|meadow|recreation_ground|village_green|allotments|orchard|vineyard|cemetery|greenfield|farmland"](area.myarea);
      way["natural"~"wood|grassland|tree|tree_row|heath|moor|scrub"](area.myarea);
      way["leisure"~"park|pitch|dog_park|golf_course|garden|recreation_ground"](area.myarea);
    );
  out geom;
`;

exports.BUS_STOPS_OSM = (osmID) => `
  [out:json][timeout:240];
  rel(${osmID});
  map_to_area;
  nwr[highway=bus_stop](area) -> .all;
  make counter num = 0 -> .count;
  foreach.all {
      .count convert counter num = t['num'] + 1 -> .count;
  }
  .count out;
`;

exports.BICYCLE_PARKING_OSM = (osmID) => `
  [out:json][timeout:60];
  rel(${osmID});
  map_to_area;
  nwr["amenity"="bicycle_parking"](area) -> .all;
  make counter num = 0 -> .count;
  foreach.all {
      .count convert counter num = t['num'] + 1 -> .count;
  }
  .count out;
`;

exports.PUBLIC_ROUTES_OSM = (osmID) => `
  [out:json][timeout:60];
  rel(${osmID});
  map_to_area;
  (
    way["highway"~"footway|cycleway|path|track|bridleway"](area);
  );
  convert result ::=::,::geom=geom(),length=length();
  out geom;
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
  }
];
