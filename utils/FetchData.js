const axios = require('axios');
import { isObjectEmpty } from './functions';
import BoundaryData from './BoundaryData';
import { handlePublicRoutes } from './OSMData';

const {
  default_required_props,
  properties_required_props,
  qualities_required_props,
  CITY_SPARQL,
  WIKIDATA_API_URL,
  AQICN_API_URL,
  AQICN_API_KEY,
  POSTCODESIO_API_URL,
  OVERPASS_API_URL,
  BUS_STOPS_OSM,
  BICYCLE_PARKING_OSM,
  PUBLIC_ROUTES_OSM
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

export const overpassAPI = async (data) => {
  return new Promise((res, rej) => {
    axios.post(`${OVERPASS_API_URL}/api/interpreter`, new URLSearchParams({data: data}), {headers: {"Content-Type": "application/x-www-form-urlencoded"}})
    .then(results => {
      return res(results.data);
    }).catch(err => {
      console.log(err);
      return rej(`Error with fetching postcode data: ${err.message}`);
    });
  });
}

export const PlaceFetch = async (place) => {
  return new Promise(async (res, rej) => {
    let required_props = [...default_required_props, ...properties_required_props, ...qualities_required_props];

    let wikiRequest = await wikidataRequest(CITY_SPARQL(place.name)).catch(err => rej(err));
    let wikiData = {};
    let i = 0;
    let highestPop = 0;
    let highestPopI = 0;
    if(!wikiRequest.results.bindings < 1) {
      for(const result of wikiRequest.results.bindings) {
        if(result.name.value.includes(place.name)) {
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

    if(place.boundary_last_updated == undefined) {
      place.boundary_last_updated = new Date(place.last_updated);
      place.boundary_last_updated.setMinutes(place.boundary_last_updated.getMinutes() - (60 * 180));
    }

    if(place.boundary_last_updated !== undefined) {
      let nu = new Date(place.boundary_last_updated);
      nu.setMinutes(nu.getMinutes() + (60 * 168));
      let ct = new Date();

      if(nu <= ct) {
        place.boundary_last_updated = place.last_updated;

        const bd = await BoundaryData(place.name).catch(err => rej(err));
        place.osm_id = bd['osm_id'];
        place.area = bd['area'];
        place.geometry = bd['geometry'];
        place.area_inaccurate = bd['area_inaccurate'];

        let busStopsCount = await overpassAPI(BUS_STOPS_OSM(place.osm_id)).catch(err => rej(err));
        place.bus_stop_quantity = Number(busStopsCount.elements[0].tags.num);

        let bicycleParkingCount = await overpassAPI(BICYCLE_PARKING_OSM(place.osm_id)).catch(err => rej(err));
        place.bicycle_parking_quantity = Number(bicycleParkingCount.elements[0].tags.num);

        let publicRoutes = await overpassAPI(PUBLIC_ROUTES_OSM(place.osm_id)).catch(err => rej(err));
        let calculatedRoutes = await handlePublicRoutes(publicRoutes.elements).catch(err => rej(err));
        place = {...place, ...calculatedRoutes};
      }
    }


    if(wikiData.item) wikiData.wiki_item = wikiData.item.split('/')[4];

    if(wikiData.area == undefined && place.area !== undefined) {
      wikiData.area = place.area;
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

    let data = {
      ...wikiData,
      air_quality: aqi,
      postcode_districts: postcodes,
    };
    place = { ...place, ...data };
    for(let prop of required_props) {
      if(place[prop] == undefined) place[prop] = null;
    }

    return res(place);
  });
}
