import dao from './dao';

export default class {
  static async changeCities(stmts) {
    return dao.runBatch(stmts);
  }

  static async checkCityData() {
    return dao.get(`SELECT EXISTS (SELECT name FROM cities) as isData`);
  }

  static async getLastUpdated() {
    return dao.get(`SELECT last_updated FROM cities`);
  }

  static async getAllCities() {
    return dao.all(`SELECT city_id, name FROM cities`);
  }
}
