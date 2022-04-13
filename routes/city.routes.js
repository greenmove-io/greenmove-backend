import { getCities, getCityNames, getCity, getCityBoundary, searchCities } from '../controllers/city.controller.js';

import * as express from 'express';
const router = express.Router();

router.get('/all', getCities);
router.get('/names/all', getCityNames);
router.get('/id/:id', getCity);
router.get('/id/:id/boundary', getCityBoundary);
router.get('/search', searchCities);


module.exports = router;
