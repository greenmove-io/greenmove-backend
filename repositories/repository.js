import dao from './dao';

export class open {
  static async getCities() {
    return dao.all(`
      SELECT
        cities.city_id,
      	cities.name,
        cities.county,
        cities.country,
        cities.rating,
        city_properties.lat,
        city_properties.lng
      FROM cities
      JOIN city_properties ON city_properties.city_id = cities.city_id
      JOIN city_qualities ON city_qualities.city_id = cities.city_id
    `);
  }

  static async getAllCityNames() {
    return dao.all(`
      SELECT
        cities.city_id,
      	cities.name
      FROM cities
    `);
  }

  static async getCity(id) {
    return dao.get(`
      SELECT
      	cities.name,
        cities.county,
        cities.country,
        cities.rating,
        city_properties.lat,
        city_properties.lng,
        city_properties.pop,
        city_qualities.air_quality,
        city_qualities.air_quality_label
      FROM cities
      JOIN city_properties ON city_properties.city_id = cities.city_id
      JOIN city_qualities ON city_qualities.city_id = cities.city_id
      WHERE cities.city_id = ?
    `, [id]);
  }

  static async findCity(q) {
    return dao.get(`
      SELECT
        cities.city_id,
        cities.name,
        cities.county,
        cities.country,
        cities.rating,
        city_properties.lat,
        city_properties.lng,
        city_properties.pop,
        city_qualities.air_quality,
        city_qualities.air_quality_label
      FROM
      	cities
      JOIN city_properties ON city_properties.city_id = cities.city_id
      JOIN city_qualities ON city_qualities.city_id = cities.city_id
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
    return dao.all(`
      SELECT *
      FROM cities
      JOIN city_properties ON city_properties.city_id = cities.city_id
      JOIN city_qualities ON city_qualities.city_id = cities.city_id
    `);
  }
}
