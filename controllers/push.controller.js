import { open } from '../repositories/repository';

export const pushPostcodes = async (req, res) => {
  console.log(req.body);

  return res.status(200).send({ status: 'success', data: 'cheese bites' });
}
