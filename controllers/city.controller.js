const fs = require('fs');
const path = require('path');
import { open, closed } from '../repositories/repository';
import BoundaryData from '../utils/BoundaryData';
import { numberWithCommas } from '../utils/functions';

export const getCities = async (req, res) => {
  const cities = await open.getCities().catch(err => console.error(err));

  return res.status(200).send({ status: 'success', data: cities });
}

export const getCityNames = async (req, res) => {
  const cityNames = await open.getAllCityNames();
  let data = [];
  cityNames.map(x => data.push(x.name));

  return res.status(200).send({ status: 'success', data: data });
}

export const getCity = async (req, res) => {
  const { id } = req.params;
  const city = await open.getCity(id);

  if(city == undefined) {
    return res.status(400).send({ status: 'fail', message: 'Could not find any a city with that ID.' });
  }

  city.pop = numberWithCommas(city.pop);

  return res.status(200).send({ status: 'success', data: city });
}

export const searchCities = async (req, res) => {
  let name = req.query.name;

  if(name == undefined || name == "" || /^ *$/.test(name)) {
    return res.status(400).send({ status: 'fail', message: 'Search data can not be blank' });
  }

  const city = await open.findCity('%' + name + '%');

  if(city == undefined || city.length < 1) {
    return res.status(400).send({ status: 'fail', message: 'Could not find any cities from your search parameters.' });
  }

  city.pop = numberWithCommas(city.pop);

  return res.status(200).send({ status: 'success', data: city });
}

export const getCityBoundary = async (req, res) => {
  const { id } = req.params;

  const city = await closed.getCity(id);

  if(city == undefined) {
    return res.status(400).send({ status: 'fail', message: 'Could not find any a city with that ID.' });
  }

  const filepath = path.resolve(__dirname, '../assets/hidden/boundaries/city', `${city.city_boundary}.json`);
  if(!fs.existsSync(filepath)) return res.status(400).send({ status: 'fail', message: 'There was an error trying to retrieve boundary data for this city' });

  let geojson = fs.readFileSync(filepath, 'utf8');

  return res.status(200).send({ status: 'success', data: JSON.parse(geojson) });
}
