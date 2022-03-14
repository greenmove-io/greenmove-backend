const sqlite3 = require('sqlite3');

const {
    DB_SOURCE
} = require('./config');

let db = new sqlite3.Database(DB_SOURCE, (err) => {
    if(err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database');
    }
});

module.exports = db;
