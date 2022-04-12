import { pushPostcodes } from '../controllers/push.controller.js';

import * as express from 'express';
const router = express.Router();

router.post('/postcodeDistricts', pushPostcodes);

module.exports = router;
