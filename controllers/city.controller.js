import { open } from '../repositories/repository';
import BoundaryData from '../utils/BoundaryData';
import { numberWithCommas } from '../utils/functions';

export const getCities = async (req, res) => {
  let isGeoJSON = req.query.geojson_polygon;
  const cities = await open.getCities(!!+isGeoJSON).catch(err => console.error(err));

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
  let isGeoJSON = req.query.geojson_polygon;
  const city = await open.getCity(id);

  if(city == undefined) {
    return res.status(400).send({ status: 'fail', message: 'Could not find any a city with that ID.' });
  }

  city.pop = numberWithCommas(city.pop);

  if(!!+isGeoJSON) {

  }

  return res.status(200).send({ status: 'success', data: city });
}

export const searchCities = async (req, res) => {
  let name = req.query.name;
  let isGeoJSON = req.query.geojson_polygon;

  if(name == undefined || name == "" || /^ *$/.test(name)) {
    return res.status(400).send({ status: 'fail', message: 'Search data can not be blank' });
  }

  const city = await open.findCity('%' + name + '%');

  if(city == undefined || city.length < 1) {
    return res.status(400).send({ status: 'fail', message: 'Could not find any cities from your search parameters.' });
  }

  city.pop = numberWithCommas(city.pop);

  if(!!+isGeoJSON) {

  }

  return res.status(200).send({ status: 'success', data: city });
}
