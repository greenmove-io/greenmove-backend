const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const readline = require('readline');
import { closed } from '../db/repository';
import { calculateRating, calculateAQI, calculatePopulationDensity } from './CalculateData';
import { PlaceFetch } from './FetchData';
import { createBlob, createTree, getBranch, addCommit, updateHead } from './GitHubAPI';
const CITY_DATA = require('../assets/json/uk-cities.json');

const {
  aqi_levels,
  GEOJSON_PRESET,
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
                place.place_id = crypto.randomBytes(8).toString("hex");

                res({
                  statements: {
                    core: ["INSERT INTO places (place_id, place_type, name, county, country, rating, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7)", [place.place_id, 'CITY', place.name, place.county, place.country, place.rating, ct]],
                    props: ["INSERT INTO places_properties (place_id, wiki_item, osm_id, area, boundary_id, area_inaccurate, latitude, longitude, population, postcode_districts) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [place.place_id, place.wiki_item, place.osm_id, place.area, place.boundary_id, place.area_inaccurate, place.latitude, place.longitude, place.population, place.postcode_districts ]],
                    quals: ["INSERT INTO places_qualities (place_id, air_quality, air_quality_label, population_density) VALUES ($1, $2, $3, $4)", [place.place_id, place.air_quality, place.air_quality_label, place.population_density ]]
                  },
                  ...place
                });
            } else {
                res({
                  statements: {
                    core: ["UPDATE places SET last_updated = $1, rating = $2 WHERE place_id = $3", [ct, place.rating, place.place_id]],
                    props: ["UPDATE places_properties SET area = $1, latitude = $2, longitude = $3, population = $4, postcode_districts = $5 WHERE place_id = $6", [place.area, place.latitude, place.longitude, place.population, place.postcode_districts, place.place_id]],
                    quals: ["UPDATE places_qualities SET air_quality = $1, air_quality_label = $2, population_density = $3 WHERE place_id = $4", [place.air_quality, place.air_quality_label, place.population_density, place.place_id]]
                  },
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
  .then((data) => {
    return(data);
  }).catch(err => {
    console.log('There was an error with a place: ', err);
  });
}

const workWithPlaces = async (places) => {
  console.log('');
  console.log('Using place data for extra work');

  let treeData = [];
  if(places[0].blob !== undefined) {
    places.map(place => {
      treeData.push({
        path: `places/boundaries/cities/${place.boundary_id}.json`,
        mode: "100644",
        type: "blob",
        sha: place.blob.sha
      });
    });

    let tree = await createTree(treeData).catch(err => console.error(err));
    let branch = await getBranch("heads/file-storage").catch(err => console.error(err));
    let commit = await addCommit(branch.object.sha, tree.sha, "Adding boundary data").catch(err => console.error(err));
    let update = await updateHead('heads/file-storage', commit.sha, false).catch(err => console.error(err));
  }
}

const ChangeDatabase = async () => {
  let data = await closed.checkPlacesData();
  const { is_data } = data[0];
  let places = CITY_DATA;

  if(!is_data) {
    console.log('Filling the database');
  } else {
    console.log(`All city data is set`);
    places = await closed.getAllPlaces();
  }

  let coreStmts = [];
  let propStmts = [];
  let qualStmts = [];

  const placesData = await setup(Date.now(), places, is_data);
  const workingWithPlaces = await workWithPlaces(placesData);

  for(let i = 0; i < placesData.length; i++) {
    if(placesData[i].statements !== undefined) {
      coreStmts.push(placesData[i].statements.core);
      propStmts.push(placesData[i].statements.props);
      qualStmts.push(placesData[i].statements.quals);
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
export default ChangeDatabase;
