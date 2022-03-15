const crypto = require("crypto");
const axios = require('axios');
import repository from '../repositories/repository';
const CITY_DATA = require('../assets/json/uk-cities.json');

const {
  OPENWEATHER_API_URL,
  OPENWEATHER_API_KEY
} = require('../config');

const fillCityStatements = async () => {
  return Promise.all(
    CITY_DATA.map((city) => {
      return new Promise( async (resolve) => {
        let air_pol = await axios.get(`${OPENWEATHER_API_URL}/data/2.5/air_pollution`, {
          params: {
            lat: city.lat,
            lon: city.lng,
            appid: OPENWEATHER_API_KEY
          }
        });
        let cityID = crypto.randomBytes(8).toString("hex");
        resolve({
            core: `INSERT INTO cities (city_id, name) VALUES (${cityID}, ${city.city})`,
            data: `INSERT INTO city_data (city_id, lat, lng, pop, air_quality) VALUES (${cityID}, ${city.lat}, ${city.lng}, ${city.population}, ${air_pol.data.list[0].main.aqi})`
        });
      });
    })
  ).then((stmts) => {
    return(stmts);
  });
}

export const FillDatabase = async () => {
  console.log('Filling the database');
  let isDatabaseFilled = await repository.checkCityData();
  if(!!!isDatabaseFilled.isData) {
    let stmts = await fillCityStatements();

    console.log('Core statements', stmts.core);
    console.log('Data statements', stmts.data);

    // repository.insertCities(cityStmts).then(results => {
    //     console.log('Inserted cities successfully');
    //
    //     repository.insertCities(cityDataStmts).then(results => {
    //         console.log('Inserted city data successfully');
    //     }).catch(err => {
    //         console.error('BATCH FAILED ' + err);
    //     });
    // }).catch(err => {
    //     console.error('BATCH FAILED ' + err);
    // });
  }
}
