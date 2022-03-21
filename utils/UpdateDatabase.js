const crypto = require("crypto");
import { closed } from '../repositories/repository';
import { CityFetch } from './FetchData';

const required_props = ['is_capital', 'latitude', 'longitude', 'population', 'overall_aqi'];
const fillCityStatements = async (ct, cities) => {
  return Promise.all(
    cities.map((city) => {
      return new Promise( async (res, rej) => {
        await CityFetch(city.name).then(cityData => {
          if(cityData !== undefined) {
            for(let prop of required_props) {
              cityData[prop] ??= null;
            }

            const cityRating = CalculateRating(cityData);
            res({
                core: `UPDATE cities SET last_updated = ${ct}, rating = ${cityRating} WHERE city_id = '${city.city_id}'`,
                data: `UPDATE city_data SET air_quality = ${cityData.overall_aqi} WHERE city_id = '${city.city_id}'`
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

const timedCheck = async () => {
  let res = await closed.getLastUpdated();
  let nu = new Date(res.last_updated);
  nu.setMinutes(nu.getMinutes() + (60 * 24));
  let ct = new Date();
  if(nu <= ct) {
    console.log('Updating the database');
    const currentTime = Date.now();
    let coreStmts = [];
    let dataStmts = [];
    let cities = await closed.getAllCities();
    let stmts = await fillCityStatements(currentTime, cities);

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
  setTimeout(timedCheck, 60000);
}

const UpdateDatabase = async () => {
  let isDatabaseFilled = await closed.checkCityData();
  if(!!isDatabaseFilled.isData) {
    timedCheck();
  } else {
    console.log('All city data is set');
  }
}
export default UpdateDatabase;
