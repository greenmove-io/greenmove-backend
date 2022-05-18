import { open, closed } from '../db/repository';
import GitHubAPI from '../utils/GitHubAPI';
import { Place } from '../modules';

const {
  qualities_ranges: qualities_rangesOG,
  interquartiles: interquartilesOG
} = require('../config');

export const getPlaces = async (req, res) => {
  let places = await open.getPlaces().catch(err => console.error(err));

  return res.status(200).send({ status: 'success', data: places });
}

export const getPlaceNames = async (req, res) => {
  const placeNames = await open.getAllPlaceNames();
  let data = [];
  placeNames.map(x => data.push(x.name));

  return res.status(200).send({ status: 'success', data: data });
}

export const getPlace = async (req, res) => {
  const { id } = req.params;
  const result = await open.getPlace(id);

  if(result == undefined) return res.status(400).send({ status: 'fail', message: 'Could not find any place with that ID.' });

  let ranges = await closed.getQualitiesRanges(1);
  let interquartiles = await closed.getQualitiesInterquartiles(1);

  let PlaceHandler = new Place();
  let place = PlaceHandler.percentages(result, ranges.data, interquartiles.data, interquartilesOG);
  place = PlaceHandler.format(result);

  return res.status(200).send({ status: 'success', data: place });
}

export const getPlaceBoundary = async (req, res) => {
  const { id } = req.params;

  const result = await closed.getPlace(id).catch(err => console.error(err));

  if(result == undefined) return res.status(400).send({ status: 'fail', message: 'Could not find any place with that ID.' });

  let boundary = await GitHubAPI.GetBoundary(`places/boundaries/cities/${result.boundary_id}.json`, true).catch(err => console.error(err));

  return res.status(200).send({ status: 'success', data: boundary });
}

export const searchPlaces = async (req, res) => {
  let name = req.query.name;

  if(name == undefined || name == "" || /^ *$/.test(name)) return res.status(400).send({ status: 'fail', message: 'Search data can not be blank' });

  const result = await open.findPlace('%' + name + '%');

  if(result == undefined) return res.status(400).send({ status: 'fail', message: 'Could not find any places from your search parameters.' });

  let ranges = await closed.getQualitiesRanges(1);
  let interquartiles = await closed.getQualitiesInterquartiles(1);

  let PlaceHandler = new Place();
  let place = PlaceHandler.percentages(result, ranges.data, interquartiles.data, interquartilesOG);
  place = PlaceHandler.format(result);

  return res.status(200).send({ status: 'success', data: place });
}

export const postVehicleData = async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;

  if(data == undefined || isNaN(data) || data <= 0) return res.status(400).send({ status: 'fail', message: 'Please provide valid vehicle data' });

  const place = await closed.getPlace(id).catch(err => console.error(err));

  if(!place) return res.status(400).send({ status: 'fail', message: 'Could not find a city with that ID' });

  await closed.insertVehicleCount(data, id).catch(err => console.error(err));

  return res.status(200).send({ status: 'success', data: `Inserted vehicle quantity of place with id: ${id} with a value of: ${data} successfully` });
}
