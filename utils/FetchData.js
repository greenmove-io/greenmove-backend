const axios = require('axios');
import { isObjectEmpty } from './functions';

const {
  AQICN_API_URL,
  AQICN_API_KEY,
  WIKIDATA_API_URL
} = require('../config');

const airQuality = async (data) => {
  return new Promise((res, rej) => {
    if(data === undefined) rej('No data was returned');
    axios.get(`${AQICN_API_URL}/feed/geo:${data['latitude']};${data['longitude']}/`, {
      params: {
        token: AQICN_API_KEY
      }
    }).then(results => {
      return res(results.data.data.aqi);
    }).catch(err => {
      return rej(`Error with fetching air quality: ${err.message}`);
    });
  });
}

const wikidataRequest = async (q) => {
  return new Promise((res, rej) => {
    axios.get(`${WIKIDATA_API_URL}/bigdata/namespace/wdq/sparql`, {
      params: {
        query: q,
        format: 'json'
      }
    }).then(results => {
      return res(results.data);
    }).catch(err => {
      console.error(err);
      return rej(`Error with fetching city wikidata: ${err.message}`);
    });
  });
}

export const CityFetch = async (city) => {
  return new Promise(async (res, rej) => {
    const SPARQL = `
      SELECT DISTINCT ?item ?name ?population ?area ?latitude ?longitude WHERE {
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en,en-gb". }
        VALUES
          ?type {wd:Q515} ?item wdt:P31 ?type .
          ?item rdfs:label ?queryByTitle.
          ?item wdt:P17 wd:Q145.
          ?item p:P625 ?statement . # coordinate-location statement
          ?statement psv:P625 ?coordinate_node .
          OPTIONAL { ?coordinate_node wikibase:geoLatitude ?latitude. }
          OPTIONAL { ?coordinate_node wikibase:geoLongitude ?longitude.}

        OPTIONAL { ?item rdfs:label ?name. }
        OPTIONAL { ?item wdt:P1082 ?population }
        OPTIONAL { ?item wdt:P2046 ?area }
        FILTER(REGEX(?queryByTitle, "${city}"))
        FILTER (lang(?name) = "en")
      } LIMIT 20
    `;
    let wikiRequest = await wikidataRequest(SPARQL).catch(err => rej(err));
    let wikiData = {};
    let i = 0;
    let highestPop = 0;
    let highestPopI = 0;
    if(!wikiRequest.results.bindings < 1) {
      for(const result of wikiRequest.results.bindings) {
        if(result.name.value.includes(city)) {
          if(result.population) {
            if(result.population.value > highestPop) {
              highestPop = result.population.value;
              highestPopI = i;
            }
          }
        }
        i++;
      }

      for(const prop in wikiRequest.results.bindings[highestPopI]) {
        wikiData[prop] = wikiRequest.results.bindings[highestPopI][prop].value;
      }
    }

    let aqi = await airQuality(wikiData).catch(err => rej(err));

    return res({ ...wikiData, aqi });
  });
}
