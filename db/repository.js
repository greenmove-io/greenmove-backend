import dao from './dao';

export class open {
  static async getPlaces() {
    return dao.get(`
      SELECT
        places.places_id,
      	places.name,
        places.county,
        places.country,
        places.rating,
        places_properties.lat,
        places_properties.lng,
        places_properties.postcode_districts
      FROM places
      JOIN places_properties ON places_properties.places_id = places.places_id
      JOIN places_qualities ON places_qualities.places_id = places.places_id
    `);
  }

  static async getAllPlacesNames() {
    return dao.get(`
      SELECT
      	places.name
      FROM places
    `);
  }

  static async getPlaces(id) {
    return dao.get(`
      SELECT
      	places.name,
        places.county,
        places.country,
        places.rating,
        places_properties.lat,
        places_properties.lng,
        places_properties.pop,
        places_qualities.air_quality,
        places_qualities.air_quality_label
      FROM places
      JOIN places_properties ON places_properties.places_id = places.places_id
      JOIN places_qualities ON places_qualities.places_id = places.places_id
      WHERE places.places_id = $1
    `, [id]);
  }

  static async findPlaces(q) {
    return dao.get(`
      SELECT
        places.places_id,
        places.name,
        places.county,
        places.country,
        places.rating,
        places_properties.lat,
        places_properties.lng,
        places_properties.pop,
        places_qualities.air_quality,
        places_qualities.air_quality_label
      FROM
      	places
      JOIN places_properties ON places_properties.places_id = places.places_id
      JOIN places_qualities ON places_qualities.places_id = places.places_id
      WHERE (
        	places.name LIKE $1 OR
        	places.county LIKE $1
      )
    `, [q]);
  }

  static async getCounties() {
    return dao.get(`
      SELECT
        places.places_id,
      	places.name AS places_name,
        places.county,
        places.country,
        places.rating AS places_rating
      FROM places
    `);
  }
}

export class closed {
  static async changePlaces(stmts) {
    return dao.runBatch(stmts);
  }

  static async checkPlacesData() {
    return dao.get(`SELECT EXISTS (SELECT name FROM places) as is_data`);
  }

  static async getLastUpdated() {
    return dao.get(`SELECT last_updated FROM places`);
  }

  static async getPlaces(id) {
    return dao.get(`
      SELECT *
      FROM places
      JOIN places_properties ON places_properties.places_id = places.places_id
      JOIN places_qualities ON places_qualities.places_id = places.places_id
      WHERE places.places_id = $1
    `, [id]);
  }

  static async getAllPlaces() {
    return dao.get(`
      SELECT *
      FROM places
      JOIN places_properties ON places_properties.places_id = places.places_id
      JOIN places_qualities ON places_qualities.places_id = places.places_id
    `);
  }

  static async insertVehicleCount(quantity, id) {
    return dao.get(`UPDATE places_qualities SET number_vehicles = $1 WHERE places_id = $2`, [quantity, id]);
  }
}
