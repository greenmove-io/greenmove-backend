import { open } from '../repositories/repository';

export const searchCities = async (req, res) => {
  let name = req.query.name;

  if(name == undefined || name == "" || /^ *$/.test(name)) {
    return res.status(400).send({ status: 'fail', message: 'Search data can not be blank' });
  }

  const city = await open.findCity('%' + name + '%');

  if(city.length < 1) {
    return res.status(400).send({ status: 'fail', message: 'Could not find any cities from your search parameters.' });
  }

  return res.status(200).send({ status: 'success', data: city });
}
