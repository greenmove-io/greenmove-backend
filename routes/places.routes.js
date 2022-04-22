import { getPlaces, getPlaceNames, getPlace, getPlaceBoundary, searchPlaces, postVehicleData } from '../controllers/places.controller.js';

import * as express from 'express';
const router = express.Router();

router.get('/all', getPlaces);
router.get('/names/all', getPlaceNames);
router.get('/search', searchPlaces);
router.get('/:id', getPlace);
router.get('/:id/boundary', getPlaceBoundary);

router.post('/:id/vehicleQuantity', postVehicleData);


module.exports = router;
