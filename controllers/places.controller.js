import { open, closed } from '../db/repository';
import { numberWithCommas } from '../utils/functions';
import { GetBoundary } from '../utils/GitHubAPI';

export const getPlaces = async (req, res) => {
  let places = await open.getPlaces().catch(err => console.error(err));

  places = places.map(x => {
    x.population = numberWithCommas(x.population);
    x.area = Math.round(((x.area / 1000000) + Number.EPSILON) * 100) / 100;
    return x;
  });

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
  const place = await open.getPlace(id);

  if(place == undefined) return res.status(400).send({ status: 'fail', message: 'Could not find any place with that ID.' });

  place.population = numberWithCommas(place.population);
  place.area = Math.round(((place.area / 1000000) + Number.EPSILON) * 100) / 100;

  return res.status(200).send({ status: 'success', data: place });
}

export const getPlaceBoundary = async (req, res) => {
  const { id } = req.params;

  const place = await closed.getPlace(id).catch(err => console.error(err));

  if(place == undefined) return res.status(400).send({ status: 'fail', message: 'Could not find any place with that ID.' });

  let boundary = await GetBoundary(`places/boundaries/cities/${place.boundary_id}.json`, true).catch(err => console.error(err));

  return res.status(200).send({ status: 'success', data: boundary });
}

export const searchPlaces = async (req, res) => {
  let name = req.query.name;

  if(name == undefined || name == "" || /^ *$/.test(name)) return res.status(400).send({ status: 'fail', message: 'Search data can not be blank' });

  const place = await open.findPlace('%' + name + '%');

  if(place == undefined) return res.status(400).send({ status: 'fail', message: 'Could not find any places from your search parameters.' });

  place.population = numberWithCommas(place.population);
  place.area = Math.round(((place.area / 1000000) + Number.EPSILON) * 100) / 100;

  return res.status(200).send({ status: 'success', data: place });
}
