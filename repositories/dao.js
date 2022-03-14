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
        db.serialize(() => {
            const stmts = [
                `CREATE TABLE IF NOT EXISTS users (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name text,
                  lat INTEGER,
                  lng INTEGER,
                  pop INTEGER,
                  air_quality
                )`,
            ];

            this.runBatch(stmts).then(results => {
                console.log('User tables created successfully');
            }).catch(err => {
                console.error('BATCH FAILED ' + err);
            });

            // db.get("SELECT user_id FROM users WHERE username =?", ['admin'], (err, res) => {
            //     if(!res) {
            //         let password = '&nuNGTNpqMW@d88g';
            //         bcrypt.hash(password, saltRounds, ((err, hash) => {
            //             if(!err) {
            //                 let userID = crypto.randomBytes(16).toString("hex");
            //                 let postID = crypto.randomBytes(8).toString("hex");
            //                 let currentTime = Date.now();
            //                 const stmts = [
            //                     `INSERT INTO users (user_id, username, password, verification) VALUES ('${userID}', 'admin', '${hash}', 1);`,
            //                     `INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ('${userID}', 'root', 'user');`,
            //                     `INSERT INTO posts (post_id, user_id, text, date_published) VALUES ('${postID}', '${userID}', 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eius, esse excepturi maxime fugiat eveniet est quos voluptatum illum. Ullam accusamus quas itaque quasi beatae laborum repudiandae maxime minima, ex provident!', ${currentTime});`
            //                 ];
            //
            //                 this.runBatch(stmts).then(results => {
            //                     console.log('User tables filled successfully');
            //                 }).catch(err => {
            //                     console.error('BATCH FAILED ' + err);
            //                 });
            //             } else {
            //                 console.log('Error with initial user setup');
            //             }
            //         }).bind(this));
            //     } else {
            //         console.log('Initial user already exists in database');
            //     }
            // });
        });
        // db.close();
    }
}
