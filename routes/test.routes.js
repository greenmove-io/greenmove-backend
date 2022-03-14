import { testExample } from '../controllers/test.controller.js';

import * as express from 'express';
const router = express.Router();

router.get('/', testExample);

module.exports = router;
