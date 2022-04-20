const options = {
  // query(e) {
  //   console.log(e.query);
  // }
};
const pgp = require('pg-promise')(options);

const {
    DB_URL
} = require('../config');

const db = pgp(DB_URL);

module.exports = db;
