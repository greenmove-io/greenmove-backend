import { searchCities } from '../controllers/city.controller.js';

import * as express from 'express';
const router = express.Router();

router.get('/searchCities', searchCities);

module.exports = router;
