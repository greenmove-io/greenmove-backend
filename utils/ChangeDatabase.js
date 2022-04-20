const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const readline = require('readline');
import { closed } from '../db/repository';
import { calculateRating, calculateAQI, calculatePopulationDensity } from './CalculateData';
import { PlaceFetch } from './FetchData';
import { createBlob, createTree, getBranch, addCommit } from './GitHubAPI';
// const CITY_DATA = require('../assets/json/uk-cities.json');

const CITY_DATA = [
  {
    "name": "Aberdeen",
    "country": "Scotland",
    "county": "Aberdeen"
  },
  {
    "name": "Bangor",
    "country": "Wales",
    "county": "Gwynedd"
  },
  {
    "name": "Bath",
    "country": "England",
    "county": "Somerset"
  },
  {
    "name": "Belfast",
    "country": "Northern Ireland",
    "county": "Antrim"
  },
  {
    "name": "Birmingham",
    "country": "England",
    "county": "West Midlands"
  },
  {
    "name": "Bradford",
    "country": "England",
    "county": "West Yorkshire"
  },
  {
    "name": "Bristol",
    "country": "England",
    "county": "Bristol"
  },
  {
    "name": "Cambridge",
    "country": "England",
    "county": "Cambridgeshire"
  }
]

const {
  required_props,
  aqi_levels,
  GEOJSON_PRESET
} = require('../config');

const fillStatement = async (ct, place, isUpdating, i, placesLength) => {
    return new Promise((res, rej) => {
      setTimeout(async () => {
        await PlaceFetch(place).then(async (placeData) => {
          if(placeData !== undefined) {
            for(let prop of required_props) {
              placeData[prop] ??= null;
            }

            readline.clearLine(process.stdout);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`Progress: (${placesLength - i}/${placesLength}) ${place.name}`);

            place = { ...place, ...placeData };
            place.rating = calculateRating(placeData);
            place.aqi_label = aqi_levels.find(x => x[0] > place.aqi)[1];

            if(place.population !== null && place.area !== null) {
              place.population_density = calculatePopulationDensity(place.population, place.area);
            } else {
              place.population_density = null;
            }

            const gj = GEOJSON_PRESET;
            gj.features = [];
            gj.features.push({ "type": "Feature", "properties": { "name": `${place.name}`, "id": `${place.place_id}`, "possibly_inaccurate": placeData.area_inaccurate }, "geometry": placeData.geometry });
            // await pushFile(`places/boundaries/cities/${placeID}-${place.name.replace(/ /g,"_")}-${place.county.replace(/ /g,"_")}-${place.country.replace(/ /g,"_")}.json`, gj, `Adding boundary data for ${place.name}, ${place.county}, ${place.country}`);
            place.blob = await createBlob(gj).catch(err => rej(err));

            // console.log(place);

            if(!isUpdating) {
                place.place_id = crypto.randomBytes(8).toString("hex");

                res({
                  statemnts: {
                    core: ["INSERT INTO places (place_id, place_type, name, county, country, rating, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7)", [place.place_id, 'CITY', place.name, place.county, place.country, place.rating, ct]],
                    props: ["INSERT INTO places_properties (place_id, wiki_item, osm_id, place_area, area_inaccurate, latitude, longitude, population, postcode_districts) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [place.place_id, place.item, place.osm_id, place.area, place.area_inaccurate, place.latitude, place.longitude, place.population, place.postcodes ]],
                    quals: ["INSERT INTO places_qualities (place_id, air_quality, air_quality_label, population_density) VALUES ($1, $2, $3, $4)", [place.place_id, place.aqi, place.aqi_label, place.population_density ]]
                  },
                  ...place
                });
            } else {
                res({
                  statemnts: {
                    core: ["UPDATE places SET last_updated = $1, rating = $2 WHERE place_id = $3", [ct, place.rating, place.place_id]],
                    props: ["UPDATE places_properties SET place_area = $1, latitude = $2, longitude = $3, population = $4, postcode_districts = $5 WHERE place_id = $6", [place.area, place.latitude, place.longitude, place.population, place.postcodes, place.place_id]],
                    quals: ["UPDATE places_qualities SET air_quality = $1, air_quality_label = $2, population_density = $3 WHERE place_id = $4", [place.aqi, place.aqi_label, place.population_density, place.place_id]]
                  }
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
  })

  // const gj = GEOJSON_PRESET;
  // gj.features = [];
  // gj.features.push({ "type": "Feature", "properties": { "name": `${place.name}`, "id": `${placeID}`, "possibly_inaccurate": placeData.area_inaccurate }, "geometry": placeData.geometry });
  // await pushFile(`places/boundaries/cities/${placeID}-${place.name.replace(/ /g,"_")}-${place.county.replace(/ /g,"_")}-${place.country.replace(/ /g,"_")}.json`, gj, `Adding boundary data for ${place.name}, ${place.county}, ${place.country}`);
}

const workWithPlaces = async (places) => {
  let treeData = [];

  places.map(place => {
    treeData.push({
      path: `places/boundaries/cities/${place.place_id}-${place.name.replace(/ /g,"_")}-${place.county.replace(/ /g,"_")}-${place.country.replace(/ /g,"_")}.json`,
      mode: "100644",
      type: "blob",
      sha: place.blob.sha
    });
  });

  let tree = await createTree(treeData).catch(err => console.error(err));
  let branch = await getBranch("file-storage").catch(err => console.error(err));
  let commit = await addCommit(branch.commit.sha, tree.sha, "Adding boundary data").catch(err => console.error(err));
  console.log(commit);
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

  // for(let i = 0; i < placesData.length; i++) {
  //   if(stmt !== undefined) {
  //     coreStmts.push(placesData[i].statement.core);
  //     propStmts.push(placesData[i].statement.props);
  //     qualStmts.push(placesData[i].statement.quals);
  //   }
  // }

  // console.log('place data: ', placesData);

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
export default ChangeDatabase;
