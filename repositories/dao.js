const sqlite3 = require('sqlite3').verbose();
const db = require('../database.js');

export default class {
    static all(stmt, params) {
        return new Promise((res, rej) => {
            db.all(stmt, params, (error, result) => {
                if(error) {
                    return rej(error.message);
                }
                return res(result);
            });
        })
    }

    static get(stmt, params) {
        return new Promise((res, rej) => {
            db.get(stmt, params, (error, result) => {
                if(error) {
                    return rej(error.message);
                }
                return res(result);
            });
        })
    }

    static run(stmt, params) {
        return new Promise((res, rej) => {
            db.run(stmt, params, (error, result) => {
                if(error) {
                    return rej(error.message);
                }
                return res(result);
            });
        })
    }

    static runBatch(stmts) {
        let results = [];
        let batch = ['BEGIN', ...stmts, 'COMMIT'];
        return batch.reduce((chain, stmt) => chain.then(res => {
            results.push(res);
            return this.run(...[].concat(stmt));
        }), Promise.resolve())
        .catch(err => this.run('ROLLBACK').then(() => Promise.reject(err +
            ' in statement #' + results.length)))
        .then(() => results.slice(2));
    }

    static async setupDbForDev() {
      return new Promise((res, rej) => {
        db.serialize(() => {
            const stmts = [
                `CREATE TABLE IF NOT EXISTS cities (
                  city_id BLOB PRIMARY KEY,
                  name TEXT,
                  county TEXT,
                  country TEXT,
                  rating INTEGER,
                  last_updated INTEGER,
                  CONSTRAINT city_unique UNIQUE (city_id, name)
                )`,
                `CREATE TABLE IF NOT EXISTS city_properties (
                  city_id BLOB,
                  wiki_item TEXT,
                  city_area INTEGER,
                  city_boundary BLOB,
                  lat INTEGER,
                  lng INTEGER,
                  pop INTEGER,
                  postcode_districts TEXT,
                  FOREIGN KEY(city_id) REFERENCES cities(city_id) ON DELETE CASCADE
                )`,
                `CREATE TABLE IF NOT EXISTS city_qualities (
                  city_id BLOB,
                  air_quality INTEGER,
                  air_quality_label TEXT,
                  water_quality INTEGER,
                  greenspace INTEGER,
                  waste_recycling INTEGER,
                  number_cars INTEGER,
                  population_density INTEGER,
                  FOREIGN KEY(city_id) REFERENCES cities(city_id) ON DELETE CASCADE
                )`,
            ];

            this.runBatch(stmts).then(async (results) => {
              res(`Database has setup successfully`);
            }).catch(err => {
              rej(`BATCH TABLE CREATION FAILED: ${err}`);
            });

            db.run("PRAGMA foreign_keys = ON");
        });
        // db.close();
      });
    }
}
