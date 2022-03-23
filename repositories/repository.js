import dao from './dao';

export class open {
  static async getCities() {
    return dao.all(`
      SELECT
        cities.city_id,
      	cities.name,
        cities.county,
        cities.country,
        cities.is_capital,
        cities.rating,
        city_data.lat,
        city_data.lng,
        city_data.pop,
        city_data.air_quality
      FROM cities
      JOIN city_data ON city_data.city_id = cities.city_id
    `);
  }

  static async getCity(id) {
    return dao.get(`
      SELECT
      	cities.name,
        cities.county,
        cities.country,
        cities.is_capital,
        cities.rating,
        city_data.lat,
        city_data.lng,
        city_data.pop,
        city_data.air_quality
      FROM cities
      JOIN city_data ON city_data.city_id = cities.city_id
      WHERE cities.city_id = ?
    `, [id]);
  }

  static async findCity(q) {
    return dao.get(`
      SELECT
        cities.name,
        cities.county,
        cities.country,
        cities.is_capital,
        cities.rating,
        city_data.lat,
        city_data.lng,
        city_data.pop,
        city_data.air_quality
      FROM
      	cities
      JOIN city_data ON city_data.city_id = cities.city_id
      WHERE (
        	cities.name LIKE ? OR
        	cities.county LIKE ?
      )
    `, [q]);
  }

  static async getCounties() {
    return dao.all(`
      SELECT
        cities.city_id,
      	cities.name AS city_name,
        cities.county,
        cities.country,
        cities.rating AS city_rating
      FROM cities
    `);
  }
}

export class closed {
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
