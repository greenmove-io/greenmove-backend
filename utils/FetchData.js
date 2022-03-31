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

const wikidataEntities = async (city) => {
  return new Promise((res, rej) => {
    axios.get(`${WIKIDATA_API_URL}/w/api.php`, {
      params: {
        action: 'wbgetentities',
        sites: 'enwiki',
        titles: city,
        props: 'labels',
        languages: 'en',
        format: 'json'
      }
    }).then(results => {
      return res(results.data);
    }).catch(err => {
      return rej(`Error with fetching city wikidata: ${err.message}`);
    });
  });
}

const wikidataClaims = async (WDID, property, rank) => {
  return new Promise((res, rej) => {
    axios.get(`${WIKIDATA_API_URL}/w/api.php`, {
      params: {
        action: 'wbgetclaims',
        entity: WDID,
        property: property,
        rank: rank,
        format: 'json'
      }
    }).then(results => {
      return res(results.data);
    }).catch(err => {
      return rej(`Error with fetching city wikidata: ${err.message}`);
    });
  });
}

export const CityFetch = async (city) => {
  return new Promise(async (res, rej) => {
    console.log(city);
    let wikiData = {};
    let WDID = await wikidataEntities(city.name).catch(err => rej(err));
    wikiData.wiki_id = WDID.entities[Object.keys(WDID.entities)[0]].id;

    let WDPOP = await wikidataClaims(wikiData.wiki_id, 'P1082', 'preferred').catch(err => rej(err));
    if(isObjectEmpty(WDPOP.claims)) {
      WDPOP = await wikidataClaims(wikiData.wiki_id, 'P1082', 'normal').catch(err => rej(err));
      if(isObjectEmpty(WDPOP.claims)) return rej(`No city population was found for ${city.name}`);
    }
    wikiData.population = +WDPOP.claims['P1082'][0]['mainsnak']['datavalue']['value']['amount'].replace(/\+/g, '');
    let popDate = WDPOP.claims['P1082'][0]['qualifiers']['P585'][0]['datavalue']['value']['time'].replace(/\+/g, '');
    wikiData.pop_date = new Date(popDate.slice(0, 4)).valueOf();

    let WDAREA = await wikidataClaims(wikiData.wiki_id, 'P2046', 'normal').catch(err => rej(err));
    if(isObjectEmpty(WDPOP.claims)) return rej(`No city area size was found for ${city.name}`);
    wikiData.area = +WDAREA.claims['P2046'][0]['mainsnak']['datavalue']['value']['amount'].replace(/\+/g, '');

    let WDCOORDINATES = await wikidataClaims(wikiData.wiki_id, 'P625', 'normal').catch(err => rej(err));
    if(isObjectEmpty(WDPOP.claims)) return rej(`No city coordinate location was found for ${city.name}`);
    let { latitude, longitude } = WDCOORDINATES.claims['P625'][0]['mainsnak']['datavalue']['value'];
    wikiData.longitude = longitude;
    wikiData.latitude = latitude;

    let aqi = await airQuality(wikiData).catch(err => rej(err));

    return res({ ...wikiData, aqi });
  });
}
