require('dotenv').config();

exports.ACCESS_TOKEN = process.env.ACCESS_TOKEN;
exports.DB_SOURCE = process.env.DB_SOURCE || 'db.sqlite';
exports.BASE_URL = process.env.BASE_URL || 'http://localhost:3080';

exports.AQICN_API_URL = process.env.AQICN_API_URL;
exports.AQICN_API_KEY = process.env.AQICN_API_KEY;

exports.WIKIDATA_API_URL = process.env.WIKIDATA_API_URL;
exports.POSTCODESIO_API_URL = process.env.POSTCODESIO_API_URL;

exports.required_props = ['item', 'population', 'area', 'latitude', 'longitude', 'aqi'];
exports.aqi_levels = [[0, 'Good'], [50, 'Good'], [100, 'Moderate'], [150, 'Unhealthy for Sensitive Groups'], [200, 'Unhealthy'], [300, 'Very Unhealthy'], [500, 'Hazardous']];

exports.citySPARQL = (city) => `
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
