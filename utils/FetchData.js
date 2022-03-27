const axios = require('axios');

const {
  NINJA_API_URL,
  NINJA_API_KEY,
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

const cityDetails = async (city) => {
  return new Promise((res, rej) => {
    axios.get(`${NINJA_API_URL}/city`, {
      params: {
        name: city,
        country: 'GB'
      },
      headers: {
        'X-Api-Key': NINJA_API_KEY
      }
    }).then(results => {
      return res(results.data[0]);
    }).catch(err => {
      return rej(`Error with fetching city details: ${err.message}`);
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
    let WDID = await wikidataEntities(city).catch(err => rej(err));
    WDID = WDID.entities[Object.keys(WDID.entities)[0]].id;
    console.log(WDID);
    let WDPOP = await wikidataClaims(WDID, 'P1082', 'preferred').catch(err => rej(err));
    console.log(WDPOP.claims[WDID]);
    let WDAREA = await wikidataClaims(WDID, 'P2046', 'normal').catch(err => rej(err));
    console.log(WDAREA);
    let cityData = await cityDetails(city).catch(err => rej(err));
    let aqi = await airQuality(cityData).catch(err => rej(err));

    // let data = { ...cityData, aqi, ...WDID, ...WDPOP, ...WDAREA };
    // console.log(data);

    res({ ...cityData, aqi });
  });
}
