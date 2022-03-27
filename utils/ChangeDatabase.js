const crypto = require("crypto");
import { closed } from '../repositories/repository';
import CalculateRating from './CalculateRating';
import { CityFetch } from './FetchData';
const CITY_DATA = require('../assets/json/uk-cities.json');

// const CITY_DATA = [
//   {
//     "city": "Aberdeen",
//     "country": "Scotland",
//     "county": "Aberdeen"
//   },
//   {
//     "city": "Armagh",
//     "country": "Northern Ireland",
//     "county": "Armagh"
//   },
// ];

const required_props = ['is_capital', 'latitude', 'longitude', 'population', 'overall_aqi'];
const fillCityStatements = async (ct, isUpdate) => {
  return Promise.all(
    CITY_DATA.map((city) => {
      return new Promise( async (res, rej) => {
        await CityFetch(city.city).then(cityData => {
          if(cityData !== undefined) {
            for(let prop of required_props) {
              cityData[prop] ??= null;
            }

            const cityRating = CalculateRating(cityData);
            let cityID = crypto.randomBytes(8).toString("hex");
            if(!isUpdate) {
              res({
                  core: `INSERT INTO cities (city_id, name, county, country, is_capital, rating, last_updated) VALUES ('${cityID}', '${city.city}', '${city.county}', '${city.country}', ${+cityData.is_capital}, ${cityRating}, ${ct})`,
                  data: `INSERT INTO city_data (city_id, lat, lng, pop, air_quality) VALUES ('${cityID}', ${cityData.latitude}, ${cityData.longitude}, ${cityData.population}, ${cityData.overall_aqi})`
              });
            } else {
              res({
                  core: `UPDATE cities SET last_updated = ${ct}, rating = ${cityRating} WHERE city_id = '${city.city_id}'`,
                  data: `UPDATE city_data SET air_quality = ${cityData.overall_aqi} WHERE city_id = '${city.city_id}'`
              });
            }
          } else {
            rej(city);
          }
        }).catch(err => {
          console.log('There was an error: ', err);
        });
      });
    })
  ).then((stmts) => {
    return(stmts);
  }).catch(err => {
    console.log('There was an error with a city: ', err);
  })
}

const fillDatabase = async () => {
  const currentTime = Date.now();
  let coreStmts = [];
  let dataStmts = [];
  let stmts;
  stmts = await fillCityStatements(currentTime, false);
}

const updateCheck = async () => {
  let res = await closed.getLastUpdated();
  let nu = new Date(res.last_updated);
  nu.setMinutes(nu.getMinutes() + (60 * 24));
  let ct = new Date();
  if(nu <= ct) {
    console.log('Updating the database');
    const currentTime = Date.now();

    let cities = await closed.getAllCities();
    return stmts = await fillCityStatements(currentTime, true);
  }
  setTimeout(updateCheck, 60000);
}

const ChangeDatabase = async () => {
  let isDatabaseFilled = await closed.checkCityData();
  let coreStmts = [];
  let dataStmts = [];

  if(!!!isDatabaseFilled) {
    console.log('Filling the database');
    fillDatabase();
  } else {
    console.log('All city data is set');
    updateCheck();
  }

  for(let stmt of stmts) {
    coreStmts.push(stmt.core);
    dataStmts.push(stmt.data);
  }

  closed.changeCities(coreStmts).then(results => {
      console.log('Updated cities successfully');

      closed.changeCities(dataStmts).then(results => {
          console.log('Updated city data successfully');
      }).catch(err => {
          console.error('BATCH FAILED ' + err);
      });
  }).catch(err => {
      console.error('BATCH FAILED ' + err);
  });
}
export default ChangeDatabase;
