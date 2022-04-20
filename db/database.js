const options = {
  // query(e) {
  //   console.log(e.query);
  // }
};
const pgp = require('pg-promise')(options);

const {
    DATABASE_URL
} = require('../config');

const db = pgp(DATABASE_URL);

module.exports = db;
