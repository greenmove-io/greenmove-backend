import { closed } from '../db/repository';

export const vehicleData = async (req, res) => {
  const { id, data } = req.query;

  if(data == undefined || isNaN(data) || data <= 0) return res.status(400).send({ status: 'fail', message: 'Please provide valid vehicle data' });

  const city = await closed.getCity(id).catch(err => console.error(err));

  if(!city) return res.status(400).send({ status: 'fail', message: 'Could not find a city with that ID' });

  await closed.insertVehicleCount(data, id).catch(err => console.error(err));

  return res.status(200).send({ status: 'success', data: `Inserted vehicle quantity of place with id: ${id} with a value of: ${data} successfully` });
}
