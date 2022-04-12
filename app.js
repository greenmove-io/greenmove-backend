import express from 'express';
import dao from './repositories/dao';
import { ChangeDatabase } from './utils';
import { cityRoutes, countyRoutes, pushRoutes } from './routes';

import cors from 'cors';
const app = express();
const corsOptions = {
  origin: ['http://localhost:3080', 'http://greenmove.io', 'http://greenmove.tk'],
  optionsSuccessStatus: 200
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));


// Database Setup
dao.setupDbForDev().then(res => {
  console.log(res);
  ChangeDatabase();
}).catch(err => {
  console.log(err);
});

app.use('/city', cityRoutes);
app.use('/county', countyRoutes);

app.use('/push', pushRoutes);

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
