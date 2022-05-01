const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const readline = require('readline');
import { closed } from '../db/repository';
import { calculateRating, calculateAQI, calculatePopulationDensity } from './CalculateData';
import { PlaceFetch, overpassAPI } from './FetchData';
import { PushBoundary, createBlob } from './GitHubAPI';
const CITY_DATA = require('../assets/json/uk-cities.json');

const {
  aqi_levels,
  GEOJSON_PRESET,
  BUS_STOPS_OSM,
} = require('../config');

const fillStatement = async (ct, place, isUpdating, i, placesLength) => {
    return new Promise((res, rej) => {
      setTimeout(async () => {
        await PlaceFetch(place).then(async (placeData) => {
          if(placeData !== undefined) {

            readline.clearLine(process.stdout);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`Progress: (${placesLength - i}/${placesLength}) ${place.name}`);

            place = { ...place, ...placeData };
            if(!isUpdating) place.place_id = crypto.randomBytes(8).toString("hex");
            place.rating = calculateRating(place);
            place.air_quality_label = aqi_levels.find(x => x[0] > place.air_quality)[1];

            if(place.population !== null && place.area !== null) {
              place.population_density = calculatePopulationDensity(place.population, place.area);
            } else {
              place.population_density = null;
            }

            if(place.geometry !== undefined) {
              let gj = GEOJSON_PRESET;
              gj.features = [];
              gj.features.push({ "type": "Feature", "properties": { "name": `${place.name}`, "id": `${place.place_id}`, "possibly_inaccurate": placeData.area_inaccurate }, "geometry": placeData.geometry });
              place.boundary_id ??= crypto.randomBytes(16).toString("hex");
              place.blob = await createBlob(gj).catch(err => rej(err));
            }

            // console.log(place);

            if(!isUpdating) {
                res({
                  statements: [
                    ["INSERT INTO places (place_id, place_type, name, county, country, rating, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7)", [place.place_id, 'CITY', place.name, place.county, place.country, place.rating, ct]],
                    ["INSERT INTO places_properties (place_id, wiki_item, osm_id, area, boundary_id, area_inaccurate, latitude, longitude, population, postcode_districts) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [place.place_id, place.wiki_item, place.osm_id, place.area, place.boundary_id, place.area_inaccurate, place.latitude, place.longitude, place.population, place.postcode_districts ]],
                    ["INSERT INTO places_qualities (place_id, air_quality, air_quality_label, bus_stop_quantity, population_density) VALUES ($1, $2, $3, $4, $5)", [place.place_id, place.air_quality, place.air_quality_label, place.bus_stop_quantity, place.population_density ]]
                  ],
                  ...place
                });
            } else {
                res({
                  statements: [
                    ["UPDATE places SET last_updated = $1, rating = $2 WHERE place_id = $3", [ct, place.rating, place.place_id]],
                    ["UPDATE places_properties SET area = $1, latitude = $2, longitude = $3, population = $4, postcode_districts = $5 WHERE place_id = $6", [place.area, place.latitude, place.longitude, place.population, place.postcode_districts, place.place_id]],
                    ["UPDATE places_qualities SET air_quality = $1, air_quality_label = $2, bus_stop_quantity = $3, population_density = $4 WHERE place_id = $5", [place.air_quality, place.air_quality_label, place.bus_stop_quantity, place.population_density, place.place_id]]
                  ],
                  ...place
                });
            }
          } else {
            rej(city);
          }
        }).catch(err => {
          console.log('The current place was: ', place);
          console.log('There was an error: ', err);
          res();
        });
      }, 800 * placesLength - 800 * i);
    });
}

const setup = async (ct, places, isUpdating) => {
  return Promise.all(places.map((place, i) => fillStatement(ct, place, isUpdating, i, places.length)))
  .then((data) => data)
  .catch(err => {
    console.log('There was an error with a place: ', err);
  });
}

const handleBoundaries = async (places) => {
  if(places[0].blob == undefined) return;
  return new Promise(async (res, rej) => {
    let treeData = [];

    places.map(place => {
      treeData.push({
        path: `places/boundaries/cities/${place.boundary_id}.json`,
        mode: "100644",
        type: "blob",
        sha: place.blob.sha
      });
    });

    console.log('PUSHING BOUNDARIES TO GITHUB...');
    const pushedBoundaries = await PushBoundary(treeData).catch(err => rej(err));

    res();
  });
}

const workWithPlaces = async (places) => {
  return new Promise(async (res, rej) => {
    console.log('');
    console.log('Using place data for extra work');
    await handleBoundaries(places).catch(err => console.error(err));

    res(places);
  });
}

const ChangeDatabase = async () => {
  return;
  let data = await closed.checkPlacesData();
  const { is_data } = data;
  let places = CITY_DATA;
  let statements = [];

  if(!is_data) {
    console.log('Filling the database');
  } else {
    console.log(`All city data is set`);
    places = await closed.getAllPlaces();
  }

  places = await setup(Date.now(), places, is_data);
  places = await workWithPlaces(places);

  places.map(place => place.statements.map(stmt => statements.push(stmt)));
  // closed.changePlaces(statements).then(results => {
  //     console.log('Places changed successfully');
  // }).catch(err => {
  //     console.error('BATCH FAILED ' + err);
  // });
}
export default ChangeDatabase;
