const fs = require('fs');
const path = require('path');
import { open, closed } from '../db/repository';
import BoundaryData from '../utils/BoundaryData';
import { numberWithCommas } from '../utils/functions';

export const getCities = async (req, res) => {
  const places = await open.getPlaces().catch(err => console.error(err));

  return res.status(200).send({ status: 'success', data: places });
}

export const getCityNames = async (req, res) => {
  const placeNames = await open.getAllPlaceNames();
  let data = [];
  placeNames.map(x => data.push(x.name));

  return res.status(200).send({ status: 'success', data: data });
}

export const getCity = async (req, res) => {
  const { id } = req.params;
  const place = await open.getPlace(id);

  if(place == undefined) {
    return res.status(400).send({ status: 'fail', message: 'Could not find any a city with that ID.' });
  }

  place.pop = numberWithCommas(place.pop);

  return res.status(200).send({ status: 'success', data: place });
}

export const searchCities = async (req, res) => {
  let name = req.query.name;

  if(name == undefined || name == "" || /^ *$/.test(name)) {
    return res.status(400).send({ status: 'fail', message: 'Search data can not be blank' });
  }

  const place = await open.findPlace('%' + name + '%');

  if(place == undefined || place.length < 1) {
    return res.status(400).send({ status: 'fail', message: 'Could not find any places from your search parameters.' });
  }

  place.pop = numberWithCommas(place.pop);

  return res.status(200).send({ status: 'success', data: place });
}

export const getCityBoundary = async (req, res) => {
  const { id } = req.params;

  const place = await closed.getPlace(id);

  if(place == undefined) {
    return res.status(400).send({ status: 'fail', message: 'Could not find any a place with that ID.' });
  }

  // const filepath = path.resolve(__dirname, '../assets/hidden/boundaries/city', `${city.city_boundary}.json`);
  // if(!fs.existsSync(filepath)) return res.status(400).send({ status: 'fail', message: 'There was an error trying to retrieve boundary data for this city' });
  //
  // let geojson = fs.readFileSync(filepath, 'utf8');

  return res.status(200).send({ status: 'success', data: "no boundaries found" });
}
