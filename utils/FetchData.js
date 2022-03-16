const axios = require('axios');

const {
  OPENWEATHER_API_URL,
  OPENWEATHER_API_KEY,
  NINJA_API_URL,
  NINJA_API_KEY
} = require('../config');

const airQuality = async (city) => {
  return new Promise((res, rej) => {
    axios.get(`${NINJA_API_URL}/airquality`, {
      params: {
        city: city,
        country: 'GB'
      },
      headers: {
        'X-Api-Key': NINJA_API_KEY
      }
    }).then(results => {
      return res(results.data);
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

export const CityFetch = async (city) => {
  return Promise.all([
    cityDetails(city),
    airQuality(city)
  ]).then( async ([details, aq]) => {
    return {...details, ...aq};
  }).catch(err => {
    console.log(err);
    return err;
  })
}
