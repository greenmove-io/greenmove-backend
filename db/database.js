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

const db = pgp({
  connectionString: DATABASE_URL,
  max: 30,
  ssl: IS_LOCAL_DEV ? null : {rejectUnauthorized: false}
});

module.exports = db;
