const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const readline = require('readline');
import { closed } from '../db/repository';
import { calculateRating, calculateAQI, calculatePopulationDensity } from './CalculateData';
import { PlaceFetch } from './FetchData';
import { pushFile } from './GitHubAPI';
const CITY_DATA = require('../assets/json/uk-cities.json');

const {
  required_props,
  aqi_levels,
  GEOJSON_PRESET
} = require('../config');

const fillStatements = async (ct, places, isUpdating) => {
  return Promise.all(
    places.map((place, i) => {
        return new Promise((res, rej) => {
          setTimeout(async () => {
            await PlaceFetch(place).then(async (placeData) => {
              if(placeData !== undefined) {
                for(let prop of required_props) {
                  placeData[prop] ??= null;
                }

                // readline.clearLine(process.stdout);
                // readline.cursorTo(process.stdout, 0);
                // process.stdout.write(`Progress: (${cities.length - i}/${cities.length}) ${city.name}`);

                const placeRating = calculateRating(placeData);
                placeData.aqi_label = aqi_levels.find(x => x[0] > placeData.aqi)[1];

                if(placeData.population !== null && placeData.area !== null) {
                  placeData.pop_density = calculatePopulationDensity(placeData.population, placeData.area);
                } else {
                  placeData.pop_density = null;
                }

                console.log(placeData);

                if(!isUpdating) {
                  let placeID = crypto.randomBytes(8).toString("hex");

                  try {
                    if(placeData.geometry !== undefined) {
                      const gj = GEOJSON_PRESET;
                      gj.features = [];
                      gj.features.push({ "type": "Feature", "properties": { "name": `${place.name}`, "id": `${placeID}`, "possibly_inaccurate": placeData.area_inaccurate }, "geometry": placeData.geometry });
                      await pushFile(`places/boundaries/cities/${placeID}-${place.name.replace(/ /g,"_")}-${place.county.replace(/ /g,"_")}-${place.country.replace(/ /g,"_")}.json`, gj, `Adding boundary data for ${place.name}, ${place.county}, ${place.country}`);
                    }

                    res({
                        core: ["INSERT INTO places (place_id, place_type, name, county, country, rating, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7)", [placeID, 'CITY', place.name, place.county, place.country, placeRating, ct]],
                        props: ["INSERT INTO places_properties (place_id, wiki_item, osm_id, place_area, area_inaccurate, latitude, longitude, population, postcode_districts) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [placeID, placeData.item, placeData.osm_id, placeData.area, placeData.area_inaccurate, placeData.latitude, placeData.longitude, placeData.population, placeData.postcodes ]],
                        quals: ["INSERT INTO places_qualities (place_id, air_quality, air_quality_label, population_density) VALUES ($1, $2, $3, $4)", [placeID, placeData.aqi, placeData.aqi_label, placeData.pop_density ]]
                    });
                  } catch(error) {
                    rej(error);
                  }
                } else {
                  try {
                    // await fs.promises.writeFile(path.resolve(__dirname, '../assets/hidden/boundaries/city', `${city.city_boundary}.json`), JSON.stringify(placeData.geometry), 'utf8');

                    res({
                        core: ["UPDATE places SET last_updated = $1, rating = $2 WHERE place_id = $3", [ct, placeRating, place.city_id]],
                        props: ["UPDATE places_properties SET place_area = $1, latitude = $2, longitude = $3, population = $4, postcode_districts = $5 WHERE place_id = $6", [placeData.area, placeData.latitude, placeData.longitude, placeData.population, placeData.postcodes, place.city_id]],
                        quals: ["UPDATE places_qualities SET air_quality = $1, air_quality_label = $2, population_density = $3 WHERE place_id = $4", [placeData.aqi, placeData.aqi_label, placeData.pop_density, city.city_id]]
                    });
                  } catch(error) {
                    rej(error);
                  }
                }
              } else {
                rej(city);
              }
            }).catch(err => {
              console.log('The current place was: ', place);
              console.log('There was an error: ', err);
              res();
            });
          }, 800 * places.length - 800 * i);
        });
    })
  ).then((stmts) => {
    return(stmts);
  }).catch(err => {
    console.log('There was an error with a place: ', err);
  })
}

const ChangeDatabase = async () => {
  let data = await closed.checkPlacesData();
  const { is_data } = data[0];
  let coreStmts = [];
  let propStmts = [];
  let qualStmts = [];
  let stmts;

  if(!is_data) {
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

    // closed.changePlaces(coreStmts).then(results => {
    //     console.log('Places changed successfully');
    //
    //     closed.changePlaces(propStmts).then(results => {
    //         console.log('Places properties changed successfully');
    //
    //         closed.changePlaces(qualStmts).then(results => {
    //             console.log('Places qualities changed successfully');
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
}
export default ChangeDatabase;
