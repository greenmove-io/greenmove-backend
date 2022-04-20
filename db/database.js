const options = {
  // query(e) {
  //   console.log(e.query);
  // }
};
const pgp = require('pg-promise')(options);

const {
    DATABASE_URL
} = require('../config');

let ssl = null;
if (process.env.NODE_ENV === 'development') {
   ssl = {rejectUnauthorized: false};
}

const db = pgp({
  connectionString: DATABASE_URL,
  max: 30,
  ssl: { rejectUnauthorized: false }
});

module.exports = db;
