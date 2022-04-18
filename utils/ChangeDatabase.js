const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const readline = require('readline');
import { closed } from '../db/repository';
import { calculateRating, calculateAQI, calculatePopulationDensity } from './CalculateData';
import { CityFetch } from './FetchData';
const CITY_DATA = require('../assets/json/uk-cities.json');

const {
  required_props,
  aqi_levels
} = require('../config');

const fillStatements = async (ct, cities, isUpdating) => {
  return Promise.all(
    cities.map((city, i) => {
        return new Promise((res, rej) => {
          setTimeout(async () => {
            await CityFetch(city.name).then(async (cityData) => {
              if(cityData !== undefined) {
                for(let prop of required_props) {
                  cityData[prop] ??= null;
                }

                // readline.clearLine(process.stdout);
                // readline.cursorTo(process.stdout, 0);
                // process.stdout.write(`Progress: (${cities.length - i}/${cities.length}) ${city.name}`);

                const cityRating = calculateRating(cityData);
                cityData.aqi_label = aqi_levels.find(x => x[0] > cityData.aqi)[1];

                if(cityData.population !== null && cityData.area !== null) {
                  cityData.pop_density = calculatePopulationDensity(cityData.population, cityData.area);
                } else {
                  cityData.pop_density = null;
                }

                // cityData.postcodes = cityData.postcodes.join(',');
                console.log(cityData);

                if(!isUpdating) {
                  let cityID = crypto.randomBytes(8).toString("hex");
                  let boundaryID = crypto.randomBytes(16).toString("hex");

                  try {
                    // await fs.promises.writeFile(path.resolve(__dirname, '../assets/hidden/boundaries/city', `${boundaryID}.json`), JSON.stringify(cityData.geometry), 'utf8');

                    res({
                        core: ["INSERT INTO places (place_id, place_type, name, county, country, rating, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7)", [cityID, 'CITY', city.name, city.county, city.country, cityRating, ct]],
                        props: ["INSERT INTO places_properties (place_id, wiki_item, osm_id, place_area, place_boundary, area_inaccurate, latitude, longitude, population, postcode_districts) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [cityID, cityData.item, cityData.osm_id, cityData.area, boundaryID, cityData.area_inaccurate, cityData.latitude, cityData.longitude, cityData.population, cityData.postcodes ]],
                        quals: ["INSERT INTO places_qualities (place_id, air_quality, air_quality_label, population_density) VALUES ($1, $2, $3, $4)", [cityID, cityData.aqi, cityData.aqi_label, cityData.pop_density ]]
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

const ChangeDatabase = async () => {
  let { isData } = await closed.checkPlacesData();
  let coreStmts = [];
  let propStmts = [];
  let qualStmts = [];
  let stmts;

  if(!!!isData) {
    console.log('Filling the database');
    stmts = await fillStatements(Date.now(), CITY_DATA, false);
  } else {
    console.log(`All city data is set`);
    // let cities = await closed.getAllCities();
    // stmts = await fillStatements(Date.now(), cities, true);
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

    closed.changePlaces(coreStmts).then(results => {
        console.log('Places changed successfully');

        closed.changePlaces(propStmts).then(results => {
            console.log('Places properties changed successfully');

            closed.changePlaces(qualStmts).then(results => {
                console.log('Places qualities changed successfully');
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
