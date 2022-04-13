import { vehicles } from '../controllers/push.controller.js';

import * as express from 'express';
const router = express.Router();

router.post('/vehicles', vehicles);

module.exports = router;
