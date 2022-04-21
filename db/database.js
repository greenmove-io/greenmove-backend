const options = {
  // query(e) {
  //   console.log(e.query);
  // }
};
const pgp = require('pg-promise')(options);

const {
    DATABASE_URL,
    IS_LOCAL_DEV
} = require('../config');

let ssl = null;
if(!IS_LOCAL_DEV) ssl = { rejectUnauthorized: false };

const db = pgp({
  connectionString: DATABASE_URL,
  max: 30,
  ssl: { rejectUnauthorized: false }
});

module.exports = db;
