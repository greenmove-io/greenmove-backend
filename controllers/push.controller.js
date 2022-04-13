import { open } from '../repositories/repository';

export const pushPostcodes = async (req, res) => {
  const { postcodes } = req.body;

  if(postcodes == undefined || !Array.isArray(postcodes)) {
    return res.status(400).send({ status: 'fail', message: 'Please provide a list of valid postcodes' });
  }

  return res.status(200).send({ status: 'success', data: 'cheese bites' });
}
