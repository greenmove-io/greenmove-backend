import dao from './dao';

export default class {
  static async insertCities(stmts) {
    return dao.runBatch(stmts);
  }

  static async checkCityData() {
    return dao.get(`SELECT EXISTS (SELECT name FROM cities) as isData`);
  }
}
