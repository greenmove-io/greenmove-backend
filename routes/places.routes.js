import { getPlaces, getPlaceNames, getPlace, getPlaceBoundary, searchPlaces } from '../controllers/places.controller.js';

import * as express from 'express';
const router = express.Router();

router.get('/all', getPlaces);
router.get('/names/all', getPlaceNames);
router.get('/id/:id', getPlace);
router.get('/id/:id/boundary', getPlaceBoundary);
router.get('/search', searchPlaces);


module.exports = router;
