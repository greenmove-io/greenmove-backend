import { getCounties } from '../controllers/county.controller.js';

import * as express from 'express';
const router = express.Router();

router.get('/all', getCounties);

module.exports = router;
