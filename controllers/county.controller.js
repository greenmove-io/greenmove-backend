import { open } from '../db/repository';

export const getCounties = async (req, res) => {
  const counties = await open.getCounties();

  return res.status(200).send({ status: 'success',  data: counties });
}
