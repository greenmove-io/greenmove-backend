const crypto = require("crypto");
import { closed } from '../repositories/repository';
import { calculateRating, calculateAQI } from './CalculateData';
import { CityFetch } from './FetchData';
// const CITY_DATA = require('../assets/json/uk-cities.json');
let isUpdating = false;

const CITY_DATA = [
  {
    "city": "Aberdeen",
    "country": "Scotland",
    "county": "Aberdeen"
  },
  {
    "city": "Armagh",
    "country": "Northern Ireland",
    "county": "Armagh"
  },
];

const required_props = ['wiki_id', 'population', 'pop_date', 'area', 'latitude', 'longitude', 'aqi'];
const aqi_levels = [[0, 'Good'], [50, 'Good'], [100, 'Moderate'], [150, 'Unhealthy for Sensitive Groups'], [200, 'Unhealthy'], [300, 'Very Unhealthy'], [500, 'Hazardous']];
const fillCityStatements = async (ct) => {
  return Promise.all(
    CITY_DATA.map((city) => {
      return new Promise( async (res, rej) => {
        await CityFetch(city).then(async (cityData) => {
          if(cityData !== undefined) {
            for(let prop of required_props) {
              cityData[prop] ??= null;
            }

            console.log(cityData);
            const cityRating = calculateRating(cityData);
            let cityID = crypto.randomBytes(8).toString("hex");
            let aqi_label = aqi_levels.find(x => x[0] > cityData.aqi)[1];

            res({
                core: `INSERT INTO cities (city_id, name, county, country, is_capital, rating, last_updated) VALUES ('${cityID}', '${city.city}', '${city.county}', '${city.country}', ${+cityData.is_capital}, ${cityRating}, ${ct})`,
                data: `INSERT INTO city_data (city_id, city_area, wiki_id, lat, lng, pop, pop_date, air_quality, air_quality_label) VALUES ('${cityID}', ${cityData.area}, ${cityData.wiki_id}, ${cityData.latitude}, ${cityData.longitude}, ${cityData.population}, ${cityData.pop_date}, ${cityData.aqi}, ${aqi_label})`
            });
          } else {
            rej(city);
          }
        }).catch(err => {
          console.log('There was an error: ', err);
          res();
        });
      });
    })
  ).then((stmts) => {
    return(stmts);
  }).catch(err => {
    console.log('There was an error with a city: ', err);
  })
}

const updateCityStatements = (ct, cities) => {
  return Promise.all(
    cities.map((city) => {
      return new Promise( async (res, rej) => {
        await CityFetch(city).then(async (cityData) => {
          if(cityData !== undefined) {
            for(let prop of required_props) {
              cityData[prop] ??= null;
            }

            console.log(cityData);
            const cityRating = calculateRating(cityData);
            let aqi_label = aqi_levels.find(x => x[0] > cityData.aqi)[1];

            res({
                core: `UPDATE cities SET last_updated = ${ct}, rating = ${cityRating} WHERE city_id = '${cityData.city_id}'`,
                data: `UPDATE city_data SET city_area = ${cityData.area}, pop = ${cityData.population}, pop_date = ${cityData.pop_date}, air_quality = ${cityData.aqi}, air_quality_label = ${aqi_label} WHERE city_id = '${data.city_id}'`
            });
          } else {
            rej(city);
          }
        }).catch(err => {
          console.log('There was an error: ', err);
          res();
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
  return await fillCityStatements(Date.now());
}

const updateCheck = async () => {
  let res = await closed.getLastUpdated();
  let nu = new Date(res.last_updated);
  // nu.setMinutes(nu.getMinutes() + (60 * 24));
  nu.setMinutes(nu.getMinutes() + 5);
  let ct = new Date();
  setTimeout(ChangeDatabase, 1000);

  if(nu <= ct && !isUpdating) {
    console.log('Updating the database');
    isUpdating = true;
    let cities = await closed.getAllCities();
    cities = cities.slice(0, 4);
    return await updateCityStatements(Date.now(), cities);
  }
}

const ChangeDatabase = async () => {
  let isDatabaseFilled = await closed.checkCityData();
  let coreStmts = [];
  let dataStmts = [];
  let stmts;

  if(!!!isDatabaseFilled) {
    console.log('Filling the database');
    stmts = await fillDatabase();
  } else {
    console.log('All city data is set');
    stmts = await updateCheck();
  }

  console.log('statements: ', stmts);

  if(stmts !== undefined) {
    for(let stmt of stmts) {
      if(stmt !== undefined) {
        coreStmts.push(stmt.core);
        dataStmts.push(stmt.data);
      }
    }

    // closed.changeCities(coreStmts).then(results => {
    //     console.log('Cities changed successfully');
    //
    //     closed.changeCities(dataStmts).then(results => {
    //         isUpdated = false;
    //         console.log('City data changed successfully');
    //     }).catch(err => {
    //         console.error('BATCH FAILED ' + err);
    //     });
    // }).catch(err => {
    //     console.error('BATCH FAILED ' + err);
    // });
  }
}
export default ChangeDatabase;
