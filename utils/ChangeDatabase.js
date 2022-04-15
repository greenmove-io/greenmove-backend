const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const readline = require('readline');
import { closed } from '../repositories/repository';
import { calculateRating, calculateAQI, calculatePopulationDensity } from './CalculateData';
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

const {
  required_props,
  aqi_levels
} = require('../config');

const fillStatements = async (ct, cities) => {
  return Promise.all(
    cities.map((city, i) => {
        return new Promise((res, rej) => {
          setTimeout(async () => {
            await CityFetch(city.name).then(async (cityData) => {
              if(cityData !== undefined) {
                for(let prop of required_props) {
                  cityData[prop] ??= null;
                }

                readline.clearLine(process.stdout);
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`Progress: (${cities.length - i}/${cities.length}) ${city.name}`);


                const cityRating = calculateRating(cityData);
                cityData.aqi_label = aqi_levels.find(x => x[0] > cityData.aqi)[1];

                if(cityData.population !== null && cityData.area !== null) {
                  cityData.pop_density = calculatePopulationDensity(cityData.population, cityData.area);
                } else {
                  cityData.pop_density = null;
                }

                cityData.postcodes = cityData.postcodes.join(',');
                console.log(cityData);

                if(!isUpdating) {
                  let cityID = crypto.randomBytes(8).toString("hex");
                  let boundaryID = crypto.randomBytes(16).toString("hex");

                  try {
                    // await fs.promises.writeFile(path.resolve(__dirname, '../assets/hidden/boundaries/city', `${boundaryID}.json`), JSON.stringify(cityData.geometry), 'utf8');

                    res({
                        core: `INSERT INTO cities (city_id, name, county, country, rating, last_updated) VALUES ('${cityID}', '${city.name}', '${city.county}', '${city.country}', ${cityRating}, ${ct})`,
                        props: `INSERT INTO city_properties (city_id, wiki_item, osm_id, city_area, city_boundary, area_inaccurate, lat, lng, pop, postcode_districts) VALUES ('${cityID}', '${cityData.item}', ${cityData.osm_id}, ${cityData.area}, '${boundaryID}', ${+ cityData.area_inaccurate}, ${cityData.latitude}, ${cityData.longitude}, ${cityData.population}, '${cityData.postcodes}')`,
                        quals: `INSERT INTO city_qualities (city_id, air_quality, air_quality_label, population_density) VALUES ('${cityID}', ${cityData.aqi}, '${cityData.aqi_label}', ${cityData.pop_density})`
                    });
                  } catch(error) {
                    rej(error);
                  }
                } else {
                  try {
                    // await fs.promises.writeFile(path.resolve(__dirname, '../assets/hidden/boundaries/city', `${city.city_boundary}.json`), JSON.stringify(cityData.geometry), 'utf8');

                    res({
                        core: `UPDATE cities SET last_updated = ${ct}, rating = ${cityRating} WHERE city_id = '${city.city_id}'`,
                        props: `UPDATE city_properties SET city_area = ${cityData.area}, lat = ${cityData.latitude}, lng = ${cityData.longitude}, pop = ${cityData.population}, postcode_districts = '${cityData.postcodes}' WHERE city_id = '${city.city_id}'`,
                        quals: `UPDATE city_qualities SET air_quality = ${cityData.aqi}, air_quality_label = '${cityData.aqi_label}', population_density = ${cityData.pop_density} WHERE city_id = '${city.city_id}'`
                    });
                  } catch(error) {
                    rej(error);
                  }
                }
              } else {
                rej(city);
              }
            }).catch(err => {
              console.log('The current city was: ', city);
              console.log('There was an error: ', err);
              res();
            });
          }, 800 * cities.length - 800 * i);
        });
    })
  ).then((stmts) => {
    return(stmts);
  }).catch(err => {
    console.log('There was an error with a city: ', err);
  })
}

const fillDatabase = async () => {
  isUpdating = false;
  return await fillStatements(Date.now(), CITY_DATA);
}

const updateCheck = async () => {
  let res = await closed.getLastUpdated();
  let nu = new Date(res.last_updated);
  // nu.setMinutes(nu.getMinutes() + (60 * 24));
  nu.setMinutes(nu.getMinutes() + 1);
  let ct = new Date();

  if(nu <= ct && !isUpdating) {
    readline.clearLine(process.stdout);
    readline.cursorTo(process.stdout, 0);
    console.log('Updating the database');
    isUpdating = true;
    let cities = await closed.getAllCities();
    // cities = cities.splice(0, 4);
    return await fillStatements(Date.now(), cities);
  }
}

let loopCounter = 0;
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
    if(!isUpdating) {
      loopCounter++;
      readline.clearLine(process.stdout);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`All city data is set`);
      for(let j = 0; j < loopCounter; j++) {
        process.stdout.write(`.`);
      }
      if(loopCounter == 3) {
        loopCounter = 0;
      }
    } else {
      readline.clearLine(process.stdout);
      readline.cursorTo(process.stdout, 0);
    }
    stmts = await updateCheck();
  }

  console.log('statements: ', stmts);

  if(stmts !== undefined) {
    for(let stmt of stmts) {
      if(stmt !== undefined) {
        coreStmts.push(stmt.core);
        propStmts.push(stmt.props);
        qualStmts.push(stmt.quals);
      }
    }

    // closed.changeCities(coreStmts).then(results => {
    //     console.log('Cities changed successfully');
    //
    //     closed.changeCities(propStmts).then(results => {
    //         console.log('City properties changed successfully');
    //
    //         closed.changeCities(qualStmts).then(results => {
    //             isUpdating = false;
    //             console.log('City qualities changed successfully');
    //         }).catch(err => {
    //             console.error('BATCH FAILED ' + err);
    //         });
    //     }).catch(err => {
    //         console.error('BATCH FAILED ' + err);
    //     });
    // }).catch(err => {
    //     console.error('BATCH FAILED ' + err);
    // });
  }

  setTimeout(ChangeDatabase, 60000);
}
export default ChangeDatabase;
