import express from 'express';
import { ChangeDatabase } from './utils';
import { cityRoutes, pushRoutes } from './routes';
import { authMiddleware, authenticated } from './controllers/auth.controller';

const CITY_DATA = require('./assets/json/uk-cities.json');

import cors from 'cors';
const app = express();
const corsOptions = {
  origin: ['https://greenmove.io', 'https://greenmove.tk'],
  optionsSuccessStatus: 200
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(authMiddleware);

// Database Setup
ChangeDatabase();

app.use('/city', cityRoutes);

app.use('/push', authenticated, pushRoutes);

app.use((req, res, next) => {
    const error = new Error(`Cannot find ${req.originalUrl} on this server!`);
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500).send({
        status: 'fail',
        message: error.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3080;
app.listen(PORT, () => console.log(`Server listening on the port:: ${PORT}`));
