import { open } from '../repositories/repository';

export const getCities = async (req, res) => {
  const cities = await open.getCities();

  return res.status(200).send({ status: 'success', data: cities });
}

export const getCityNames = async (req, res) => {
  const cityNames = await open.getAllCityNames();

  return res.status(200).send({ status: 'success', data: cityNames });
}

export const getCity = async (req, res) => {
  const { id } = req.params;
  const city = await open.getCity(id);

  if(city == undefined) {
    return res.status(400).send({ status: 'fail', message: 'Could not find any a city with that ID.' });
  }

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

  return res.status(200).send({ status: 'success', data: city });
}
