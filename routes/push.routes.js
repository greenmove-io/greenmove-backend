import { vehicleData } from '../controllers/push.controller.js';

import * as express from 'express';
const router = express.Router();

router.post('/vehicleData', vehicleData);

module.exports = router;
