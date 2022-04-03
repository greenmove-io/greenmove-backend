const crypto = require("crypto");
import { closed } from '../repositories/repository';
import { calculateRating, calculateAQI } from './CalculateData';
import { CityFetch } from './FetchData';
const CITY_DATA = require('../assets/json/uk-cities.json');
let isUpdating = false;

// const CITY_DATA = [
//   {
//     "name": "Aberdeen",
//     "country": "Scotland",
//     "county": "Aberdeen"
//   }
// ];


const required_props = ['item', 'population', 'area', 'latitude', 'longitude', 'aqi'];
const aqi_levels = [[0, 'Good'], [50, 'Good'], [100, 'Moderate'], [150, 'Unhealthy for Sensitive Groups'], [200, 'Unhealthy'], [300, 'Very Unhealthy'], [500, 'Hazardous']];
const fillCityStatements = async (ct) => {
  return Promise.all(
    CITY_DATA.map((city, i) => {
        return new Promise((res, rej) => {
          setTimeout(async () => {
            await CityFetch(city.name).then(async (cityData) => {
              if(cityData !== undefined) {
                for(let prop of required_props) {
                  cityData[prop] ??= null;
                }

                console.log(city);
                // console.log(cityData);
                const cityRating = calculateRating(cityData);
                let cityID = crypto.randomBytes(8).toString("hex");
                let aqi_label = aqi_levels.find(x => x[0] > cityData.aqi)[1];

                res({
                    core: `INSERT INTO cities (city_id, name, county, country, rating, last_updated) VALUES ('${cityID}', '${city.name}', '${city.county}', '${city.country}', ${cityRating}, ${ct})`,
                    props: `INSERT INTO city_properties (city_id, wiki_item, city_area, lat, lng, pop) VALUES ('${cityID}', '${cityData.item}', ${cityData.area}, ${cityData.latitude}, ${cityData.longitude}, ${cityData.population})`,
                    quals: `INSERT INTO city_qualities (city_id, air_quality, air_quality_label) VALUES ('${cityID}', ${cityData.aqi}, '${aqi_label}')`
                });
              } else {
                rej(city);
              }
            }).catch(err => {
              console.log('There was an error: ', err);
              res();
            });
          }, 500 * CITY_DATA.length - 500 * i);
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
      return new Promise((res, rej) => {
        setTimeout(async () => {
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
                  props: `UPDATE city_properties SET city_area = ${cityData.area}, lat = ${cityData.latitude}, lng = ${cityData.longitude}, pop = ${cityData.population} WHERE city_id = '${cityData.city_id}')`,
                  quals: `UPDATE city_qualities SET air_quality = ${cityData.aqi}, air_quality_label = '${aqi_label}' WHERE city_id = '${cityData.city_id}')`
              });
            } else {
              rej(city);
            }
          }).catch(err => {
            console.log('There was an error: ', err);
            res();
          });
        }, 500 * CITY_DATA.length - 500 * i);
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
  let { isData } = await closed.checkCityData();
  let coreStmts = [];
  let propStmts = [];
  let qualStmts = [];
  let stmts;

  if(!!!isData) {
    console.log('Filling the database');
    stmts = await fillDatabase();
  } else {
    console.log('All city data is set');
    // stmts = await updateCheck();
  }

  // console.log('statements: ', stmts);

  if(stmts !== undefined) {
    for(let stmt of stmts) {
      if(stmt !== undefined) {
        coreStmts.push(stmt.core);
        propStmts.push(stmt.props);
        qualStmts.push(stmt.quals);
      }
    }

    closed.changeCities(coreStmts).then(results => {
        console.log('Cities changed successfully');

        closed.changeCities(propStmts).then(results => {
            console.log('City properties changed successfully');

            closed.changeCities(qualStmts).then(results => {
                isUpdating = false;
                console.log('City qualities changed successfully');
            }).catch(err => {
                console.error('BATCH FAILED ' + err);
            });
        }).catch(err => {
            console.error('BATCH FAILED ' + err);
        });
    }).catch(err => {
        console.error('BATCH FAILED ' + err);
    });
  }
}
export default ChangeDatabase;
