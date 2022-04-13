import { open } from '../repositories/repository';

export const vehicles = async (req, res) => {
  const { vehicles } = req.body;

  if(vehicles == undefined || !Array.isArray(vehicles)) {
    return res.status(400).send({ status: 'fail', message: 'Please provide a list of valid vehicles' });
  }

  return res.status(200).send({ status: 'success', data: 'cheese bites' });
}
