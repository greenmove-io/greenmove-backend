const axios = require('axios');
import { isObjectEmpty } from './functions';
import BoundaryData from './BoundaryData';

const {
  CITY_SPARQL,
  BUS_STOPS_OSM,
  WIKIDATA_API_URL,
  AQICN_API_URL,
  AQICN_API_KEY,
  POSTCODESIO_API_URL,
  OVERPASS_API_URL
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
      return rej(`Error with fetching city wikidata: ${err.message}`);
    });
  });
}

const postcodeDistricts = async (data) => {
  return new Promise((res, rej) => {
    axios.get(`${POSTCODESIO_API_URL}/outcodes`, {
      params: {
        lon: data['longitude'],
        lat: data['latitude']
      }
    }).then(results => {
      return res(results.data.result);
    }).catch(err => {
      console.log(err);
      return rej(`Error with fetching postcode data: ${err.message}`);
    });
  });
}

const overpassAPI = async (data) => {
  return new Promise((res, rej) => {
    axios.get(`${OVERPASS_API_URL}/api/interpreter`, {
      params: {
        data: data
      }
    }).then(results => {
      return res(results.data);
    }).catch(err => {
      console.log(err);
      return rej(`Error with fetching postcode data: ${err.message}`);
    });
  });
}

export const PlaceFetch = async ({ name, last_updated }) => {
  return new Promise(async (res, rej) => {
    let wikiRequest = await wikidataRequest(CITY_SPARQL(name)).catch(err => rej(err));
    let wikiData = {};
    let i = 0;
    let highestPop = 0;
    let highestPopI = 0;
    if(!wikiRequest.results.bindings < 1) {
      for(const result of wikiRequest.results.bindings) {
        if(result.name.value.includes(name)) {
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

    // let { osm_id, area, geometry, area_inaccurate } = await BoundaryData(name).catch(err => rej(err));

    if(wikiData.item) {
      wikiData.item = wikiData.item.split('/')[4];
    }

    if(wikiData.area == undefined) {
      // wikiData.area = area;
    } else {
      wikiData.area = Number(wikiData.area);
    }

    if(wikiData.population !== undefined) wikiData.population = Number(wikiData.population);
    if(wikiData.latitude !== undefined && wikiData.longitude !== undefined) {
      wikiData.latitude = Number(wikiData.latitude);
      wikiData.longitude = Number(wikiData.longitude);
    }

    let aqi = await airQuality(wikiData).catch(err => rej(err));
    let pc = await postcodeDistricts(wikiData).catch(err => rej(err));
    let postcodes = pc.map(x => x.outcode);
    // let busStopsCount = await overpassAPI(BUS_STOPS_OSM(osm_id)).catch(err => rej(err));

    return res({ ...wikiData, aqi, postcodes });
    // return res({ ...wikiData, aqi, postcodes, osm_id, geometry, area_inaccurate });
  });
}
