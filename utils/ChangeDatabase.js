const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const readline = require('readline');
import { closed } from '../db/repository';
import CalculateData from './CalculateData';
import { PlaceFetch, overpassAPI } from './FetchData';
import GitHubAPI from './GitHubAPI';
// const CITY_DATA = require('../assets/json/uk-cities.json');

const {
  aqi_levels,
  qualities_ranges,
  interquartiles,
  GEOJSON_PRESET,
  CITY_DATA
} = require('../config');

const fillStatement = async (ct, place, isUpdating, i, placesLength) => {
    return new Promise((res, rej) => {
      setTimeout(async () => {
        await PlaceFetch(place).then(async (place) => {
          readline.clearLine(process.stdout);
          readline.cursorTo(process.stdout, 0);
          process.stdout.write(`Progress: (${placesLength - i}/${placesLength}) ${place.name}`);

          if(!isUpdating) place.place_id = crypto.randomBytes(8).toString("hex");
          place.place_type = 'CITY';
          place.air_quality_label = aqi_levels.find(x => x[0] > place.air_quality)[1];
          place.population_density = CalculateData.ratio(place.population, (place.area / 1000000));
          place.greenspace_area_ratio = CalculateData.ratioTwoDecimal(place.area / place.greenspace_area);
          place.park_area_ratio = CalculateData.ratioTwoDecimal(place.park_area, place.area);
          place.park_population_ratio = CalculateData.ratioTwoDecimal(place.park_average_area, place.population);
          place.bus_stop_population_ratio = CalculateData.ratioTwoDecimal(place.bus_stop_quantity, place.population);
          if(place.vehicle_quantity !== null) place.vehicle_population_ratio = CalculateData.ratioTwoDecimal(place.vehicle_quantity, place.population);
          place.bicycle_parking_population_ratio = CalculateData.ratioTwoDecimal(place.bicycle_parking_quantity, place.population);
          place.walking_routes_ratio = CalculateData.ratioTwoDecimal(place.walking_routes_length, place.area);
          place.cycling_routes_ratio = CalculateData.ratioTwoDecimal(place.cycling_routes_length, place.area);

          if(place.geometry !== null) {
            let gj = GEOJSON_PRESET;
            gj.features = [];
            gj.features.push({ "type": "Feature", "properties": { "name": `${place.name}`, "id": `${place.place_id}`, "possibly_inaccurate": place.area_inaccurate }, "geometry": place.geometry });
            place.boundary_id ??= crypto.randomBytes(16).toString("hex");
            place.blob = await GitHubAPI.createBlob(gj).catch(err => rej(err));
          }

          console.log(place);

          if(!isUpdating) {
              res({
                statements: [
                  ["INSERT INTO places (place_id, place_type, name, county, country, rating, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7)", [place.place_id, place.place_type, place.name, place.county, place.country, place.rating, place.last_updated]],
                  [
                    "INSERT INTO places_properties (place_id, wiki_item, osm_id, area, boundary_id, area_inaccurate, latitude, longitude, population, greenspace_area, park_quantity, park_area, park_average_area, bus_stop_quantity, bicycle_parking_quantity, walking_routes_quantity, walking_routes_length, cycling_routes_quantity, cycling_routes_length, postcode_districts) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)",
                    [place.place_id, place.wiki_item, place.osm_id, place.area, place.boundary_id, place.area_inaccurate, place.latitude, place.longitude, place.population, place.greenspace_area, place.park_quantity, place.park_area, place.park_average_area, place.bus_stop_quantity, place.bicycle_parking_quantity, place.walking_routes_quantity, place.walking_routes_length, place.cycling_routes_quantity, place.cycling_routes_length, place.postcode_districts]
                  ],
                  [
                    "INSERT INTO places_qualities (place_id, air_quality, air_quality_label, park_area_ratio, park_population_ratio, bus_stop_population_ratio, bicycle_parking_population_ratio, walking_routes_ratio, cycling_routes_ratio, population_density) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
                    [place.place_id, place.air_quality, place.air_quality_label, place.park_area_ratio, place.park_population_ratio, place.bus_stop_population_ratio, place.bicycle_parking_population_ratio, place.walking_routes_ratio, place.cycling_routes_ratio, place.population_density ]
                  ]
                ],
                ...place
              });
          } else {
              res({
                statements: [
                  ["UPDATE places SET last_updated = $1, rating = $2 WHERE place_id = $3", [place.last_updated, place.rating, place.place_id]],
                  [
                    "UPDATE places_properties SET area = $1, latitude = $2, longitude = $3, population = $4, greenspace_area = $5, park_quantity = $6, park_area = $7, park_average_area = $8, bus_stop_quantity = $9, bicycle_parking_quantity = $10, walking_routes_quantity = $11, walking_routes_length = $12, cycling_routes_quantity = $13, cycling_routes_length = $14, postcode_districts = $15 WHERE place_id = $16",
                    [place.area, place.latitude, place.longitude, place.population, place.greenspace_area, place.park_quantity, place.park_area, place.park_average_area, place.bus_stop_quantity, place.bicycle_parking_quantity, place.walking_routes_quantity, place.walking_routes_length, place.cycling_routes_quantity, place.cycling_routes_length, place.postcode_districts, place.place_id]
                  ],
                  [
                    "UPDATE places_qualities SET air_quality = $1, air_quality_label = $2, park_area_ratio = $3, park_population_ratio = $4, bus_stop_population_ratio = $5, vehicle_population_ratio = $6, bicycle_parking_population_ratio = $7, walking_routes_ratio = $6, cycling_routes_ratio = $8, population_density = $9 WHERE place_id = $10",
                    [place.air_quality, place.air_quality_label, place.park_area_ratio, place.park_population_ratio, place.bus_stop_population_ratio, place.vehicle_population_ratio, place.bicycle_parking_population_ratio, place.walking_routes_ratio, place.cycling_routes_ratio, place.population_density, place.place_id]
                  ]
                ],
                ...place
              });
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
  return Promise.all(
    places.map(async (place, i) => {
      place.last_updated = ct;
      let result = await fillStatement(ct, place, isUpdating, i, places.length);
      // Object.keys(qualities_ranges).forEach((k, i) => {
      //   let key = k.slice(4);
      //   if(i % 2 == 0) {
      //     if(result[key] < qualities_ranges[k]) qualities_ranges[k] = result[key];
      //   } else {
      //     if(result[key] > qualities_ranges[k]) qualities_ranges[k] = result[key];
      //   }
      // });

      return result;
    })
  ).then((data) => {
    for(let key in interquartiles) {
      interquartiles[key].arr = data.map(a => a[key]);
      let iqrs = CalculateData.IQR(interquartiles[key].arr);
      interquartiles[key] = { ...iqrs };
    }

    return { data, qualities_ranges, interquartiles };
  })
  .catch(err => {
    console.log('There was an error with a place: ', err);
  });
}

const handleBoundaries = async (places) => {
  if(places.data[0].blob == null) return;
  return new Promise(async (res, rej) => {
    const reset = await GitHubAPI.ResetBranch('ce9a79458fa950dde6ef468486893a8ecb47e6e0').catch(err => rej(err));

    let treeData = [];
    places.data.map(place => {
      treeData.push({
        path: `places/boundaries/cities/${place.boundary_id}.json`,
        mode: "100644",
        type: "blob",
        sha: place.blob.sha
      });
    });

    console.log('PUSHING BOUNDARIES TO GITHUB...');
    const pushedBoundaries = await GitHubAPI.PushBoundary(treeData).catch(err => rej(err));

    res();
  });
}

const handleRating = async (places) => {
  return new Promise(async (res, rej) => {

    // https://stackoverflow.com/questions/25835591/how-to-calculate-percentage-between-the-range-of-two-values-a-third-value-is
    places = places.data.map(place => {
      let AQIPercentage, PDPercentage,
          BSRPercentage, VRPercentage,
          BPRPercentage, WRRPercentage,
          CRRPercentage;

      if(place.air_quality >= places.interquartiles.air_quality.Q1 && place.air_quality <= places.interquartiles.air_quality.Q3) {
        AQIPercentage = 100 - CalculateData.rangePercentage(places.interquartiles.air_quality.Q1, places.interquartiles.air_quality.Q3, place.air_quality);
      } else if (place.air_quality < places.interquartiles.air_quality.Q1) {
        AQIPercentage = 100;
      } else if (place.air_quality > places.interquartiles.air_quality.Q3) {
        AQIPercentage = 25;
      }

      if(place.population_density >= places.interquartiles.population_density.Q1 && place.population_density <= places.interquartiles.population_density.Q3) {
        PDPercentage = 100 - CalculateData.rangePercentage(places.interquartiles.population_density.Q1, places.interquartiles.population_density.Q3, place.population_density);
      } else if (place.population_density < places.interquartiles.population_density.Q1) {
        PDPercentage = 100;
      } else if (place.population_density > places.interquartiles.population_density.Q3) {
        PDPercentage = 25;
      }

      if(place.bus_stop_population_ratio >= places.interquartiles.bus_stop_population_ratio.Q1 && place.bus_stop_population_ratio <= places.interquartiles.bus_stop_population_ratio.Q3) {
        BSRPercentage = 100 - CalculateData.rangePercentage(places.interquartiles.bus_stop_population_ratio.Q1, places.interquartiles.bus_stop_population_ratio.Q3, place.bus_stop_population_ratio);
      } else if (place.bus_stop_population_ratio < places.interquartiles.bus_stop_population_ratio.Q1) {
        BSRPercentage = 100;
      } else if (place.bus_stop_population_ratio > places.interquartiles.bus_stop_population_ratio.Q3) {
        BSRPercentage = 25;
      }

      VRPercentage = 100;
      if(place.vehicle_population_ratio !== null) {
        if(place.vehicle_population_ratio >= places.interquartiles.vehicle_population_ratio.Q1 && place.vehicle_population_ratio <= places.interquartiles.vehicle_population_ratio.Q3) {
          VRPercentage = 100 - CalculateData.rangePercentage(places.interquartiles.vehicle_population_ratio.Q1, places.interquartiles.vehicle_population_ratio.Q3, place.vehicle_population_ratio);
        } else if (place.vehicle_population_ratio < places.interquartiles.vehicle_population_ratio.Q1) {
          VRPercentage = 100;
        } else if (place.vehicle_population_ratio > places.interquartiles.vehicle_population_ratio.Q3) {
          VRPercentage = 25;
        }
      }

      if(place.bicycle_parking_population_ratio >= places.interquartiles.bicycle_parking_population_ratio.Q1 && place.bicycle_parking_population_ratio <= places.interquartiles.bicycle_parking_population_ratio.Q3) {
        BPRPercentage = 100 - CalculateData.rangePercentage(places.interquartiles.bicycle_parking_population_ratio.Q1, places.interquartiles.bicycle_parking_population_ratio.Q3, place.bicycle_parking_population_ratio);
      } else if (place.bicycle_parking_population_ratio < places.interquartiles.bicycle_parking_population_ratio.Q1) {
        BPRPercentage = 100;
      } else if (place.bicycle_parking_population_ratio > places.interquartiles.bicycle_parking_population_ratio.Q3) {
        BPRPercentage = 25;
      }

      if(place.walking_routes_ratio >= places.interquartiles.walking_routes_ratio.Q1 && place.walking_routes_ratio <= places.interquartiles.walking_routes_ratio.Q3) {
        WRRPercentage = CalculateData.rangePercentage(places.interquartiles.walking_routes_ratio.Q1, places.interquartiles.walking_routes_ratio.Q3, place.walking_routes_ratio);
      } else if (place.walking_routes_ratio < places.interquartiles.walking_routes_ratio.Q1) {
        WRRPercentage = 25;
      } else if (place.walking_routes_ratio > places.interquartiles.walking_routes_ratio.Q3) {
        WRRPercentage = 100;
      }

      if(place.cycling_routes_ratio >= places.interquartiles.cycling_routes_ratio.Q1 && place.cycling_routes_ratio <= places.interquartiles.cycling_routes_ratio.Q3) {
        CRRPercentage = CalculateData.rangePercentage(places.interquartiles.cycling_routes_ratio.Q1, places.interquartiles.cycling_routes_ratio.Q3, place.cycling_routes_ratio);
      } else if (place.cycling_routes_ratio < places.interquartiles.cycling_routes_ratio.Q1) {
        CRRPercentage = 25;
      } else if (place.cycling_routes_ratio > places.interquartiles.cycling_routes_ratio.Q3) {
        CRRPercentage = 100;
      }

      let totalPercentage;
      totalPercentage = ((AQIPercentage + PDPercentage + BSRPercentage + VRPercentage + BPRPercentage + WRRPercentage + CRRPercentage) / 700) * 100;

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

  let ct = parseInt((new Date().getTime() / 1000).toFixed(0));
  places = await setup(ct, places, is_data);
  places = await workWithPlaces(places);

  // places.map(place => place.statements.map(stmt => statements.push(stmt)));
  // closed.changePlaces(statements).then(results => {
  //     console.log('Places changed successfully');
  // }).catch(err => {
  //     console.error('BATCH FAILED ' + err);
  // });
}
export default ChangeDatabase;
