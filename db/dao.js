const db = require('./database');

export default class {
  static get(stmt, params) {
    return new Promise((res, rej) => {
      db.any(stmt, params).then(result => res(result[0])).catch(err => rej(err));
    });
  }

  static all(stmt, params) {
    return new Promise((res, rej) => {
      db.any(stmt, params).then(result => res(result)).catch(err => rej(err));
    });
  }

  static run(stmt, params) {
    return new Promise((res, rej) => {
      db.any(stmt, params).then(result => res(result)).catch(err => rej(err));
    });
  }

  static runBatch(stmts) {
    return new Promise((res, rej) => {
      db.tx(t => {
        let queries = [];
        stmts.map(stmt => queries.push(t.none(stmt[0], stmt[1])));
        return t.batch(queries);
      }).then(data => {
        res(data);
      }).catch(err => {
        rej(err);
      })
    });

  }

  static multi(stmt) {
    return new Promise((res, rej) => {
      db.multi(stmt).then(result => res(result)).catch(err => rej(err));
    });
  }
}
