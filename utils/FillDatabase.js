const crypto = require("crypto");
import repository from '../repositories/repository';
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

const fillCityStatements = async () => {
  return Promise.all(
    CITY_DATA.map((city) => {
      return new Promise( async (res, rej) => {
        await CityFetch(city.city).then(cityData => {
          if(cityData !== undefined) {
            for(let prop of required_props) {
              cityData[prop] ??= null;
            }
            let cityID = crypto.randomBytes(8).toString("hex");
            res({
                core: `INSERT INTO cities (city_id, name, county, country, is_capital) VALUES ('${cityID}', '${city.city}', '${city.county}', '${city.country}', ${+cityData.is_capital})`,
                data: `INSERT INTO city_data (city_id, lat, lng, pop, air_quality) VALUES ('${cityID}', ${cityData.latitude}, ${cityData.longitude}, ${cityData.population}, ${cityData.overall_aqi})`
            });
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

export const FillDatabase = async () => {
  let isDatabaseFilled = await repository.checkCityData();
  if(!!!isDatabaseFilled.isData) {
    console.log('Filling the database');
    let coreStmts = [];
    let dataStmts = [];
    let stmts = await fillCityStatements();

    for(let stmt of stmts) {
      coreStmts.push(stmt.core);
      dataStmts.push(stmt.data);
    }

    repository.insertCities(coreStmts).then(results => {
        console.log('Inserted cities successfully');

        repository.insertCities(dataStmts).then(results => {
            console.log('Inserted city data successfully');
        }).catch(err => {
            console.error('BATCH FAILED ' + err);
        });
    }).catch(err => {
        console.error('BATCH FAILED ' + err);
    });
  } else {
    console.log('All city data is set');
  }
}
