const options = {
  query(e) {
    console.log(e.query);
  }
};
const pgp = require('pg-promise')(options);

const {
    DB_SOURCE
} = require('../config');

const db = pgp(DB_SOURCE);

module.exports = db;
