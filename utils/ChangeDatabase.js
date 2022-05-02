const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const readline = require('readline');
import { closed } from '../db/repository';
import CalculateData from './CalculateData';
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
            place.air_quality_label = aqi_levels.find(x => x[0] > place.air_quality)[1];
            place.population_density = CalculateData.populationDensity(place.population, place.area);
            place.bus_stop_population_ratio = CalculateData.busStopPopulationRatio(place.bus_stop_quantity, place.population);
            if(place.vehicle_quantity !== undefined && place.vehicle_quantity !== null) {
              place.vehicle_population_ratio = CalculateData.vehiclePopulationRatio(place.vehicle_quantity, place.population);
            } else {
              place.vehicle_population_ratio = null;
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
                    ["INSERT INTO places_properties (place_id, wiki_item, osm_id, area, boundary_id, area_inaccurate, latitude, longitude, population, bus_stop_quantity, postcode_districts) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)", [place.place_id, place.wiki_item, place.osm_id, place.area, place.boundary_id, place.area_inaccurate, place.latitude, place.longitude, place.population, place.bus_stop_quantity, place.postcode_districts ]],
                    ["INSERT INTO places_qualities (place_id, air_quality, air_quality_label, bus_stop_population_ratio, population_density) VALUES ($1, $2, $3, $4, $5)", [place.place_id, place.air_quality, place.air_quality_label, place.bus_stop_population_ratio, place.population_density ]]
                  ],
                  ...place
                });
            } else {
                res({
                  statements: [
                    ["UPDATE places SET last_updated = $1, rating = $2 WHERE place_id = $3", [ct, place.rating, place.place_id]],
                    ["UPDATE places_properties SET area = $1, latitude = $2, longitude = $3, population = $4, bus_stop_quantity = $5, postcode_districts = $6 WHERE place_id = $7", [place.area, place.latitude, place.longitude, place.population, place.bus_stop_quantity, place.postcode_districts, place.place_id]],
                    ["UPDATE places_qualities SET air_quality = $1, air_quality_label = $2, bus_stop_population_ratio = $3, vehicle_population_ratio = $4, population_density = $5 WHERE place_id = $6", [place.air_quality, place.air_quality_label, place.bus_stop_population_ratio, place.vehicle_population_ratio, place.population_density, place.place_id]]
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
  let qualities_range = {
    max_air_quality: 0,
    min_air_quality: 500,
    max_population_density: 0,
    min_population_density: 99999,
    max_vehicle_population_ratio: 0,
    min_vehicle_population_ratio: 999,
    max_bus_stop_population_ratio: 0,
    min_bus_stop_population_ratio: 9999
  }

  return Promise.all(
    places.map(async (place, i) => {
      let result = await fillStatement(ct, place, isUpdating, i, places.length);
      if(result.name !== 'London') {
        Object.keys(qualities_range).forEach((k, i) => {
          let key = k.slice(4);
          if(i % 2 == 0) {
            if(result[key] > qualities_range[k]) qualities_range[k] = result[key];
          } else {
            if(result[key] < qualities_range[k]) qualities_range[k] = result[key];
          }
        });
      }

      return result;
    })
  ).then((data) => {
    data.qualities_range = qualities_range;

    return data;
  })
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

const handleRating = async (places) => {
  return new Promise(async (res, rej) => {

    // https://stackoverflow.com/questions/25835591/how-to-calculate-percentage-between-the-range-of-two-values-a-third-value-is
    places = places.map(place => {
      let AQIPercentage = 100 - CalculateData.rangePercentage(places.qualities_range.min_air_quality, places.qualities_range.max_air_quality, place.air_quality);
      let PDPercentage = 100 - CalculateData.rangePercentage(places.qualities_range.min_population_density, places.qualities_range.max_population_density, place.population_density);
      let BSRPercentage = 100 - CalculateData.rangePercentage(places.qualities_range.min_bus_stop_population_ratio, places.qualities_range.max_bus_stop_population_ratio, place.bus_stop_population_ratio);
      let VRPercentage = 100;
      if(place.vehicle_population_ratio !== null) {
         VRPercentage = 100 - CalculateData.rangePercentage(places.qualities_range.min_vehicle_population_ratio, places.qualities_range.max_vehicle_population_ratio, place.vehicle_population_ratio);
      }

      let totalPercentage;
      if(place.name == 'London') {
        totalPercentage = ((AQIPercentage + PDPercentage) / 200) * 100;
      } else {
        totalPercentage = ((AQIPercentage + PDPercentage + BSRPercentage + VRPercentage) / 400) * 100;
      }

      place.rating = Math.round(((totalPercentage / 20) + Number.EPSILON) * 100) / 100;
      place.statements.push(["UPDATE places SET rating = $1 WHERE place_id = $2", [place.rating, place.place_id]]);
      return place;
    });

    res(places);
  });
}

const workWithPlaces = async (places) => {
  return new Promise(async (res, rej) => {
    console.log('');
    console.log('Using place data for extra work');
    await handleBoundaries(places).catch(err => console.error(err));
    places = handleRating(places).catch(err => console.error(err));

    res(places);
  });
}

const ChangeDatabase = async () => {
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
  closed.changePlaces(statements).then(results => {
      console.log('Places changed successfully');
  }).catch(err => {
      console.error('BATCH FAILED ' + err);
  });
}
export default ChangeDatabase;
