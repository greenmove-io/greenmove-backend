import dao from './dao';

export class open {
  static async getPlaces() {
    return dao.get(`
      SELECT
        places.place_id,
      	places.name,
        places.county,
        places.country,
        places.rating,
        places_properties.latitude,
        places_properties.longitude,
        places_properties.postcode_districts
      FROM places
      INNER JOIN places_properties ON places_properties.place_id = places.place_id
      INNER JOIN places_qualities ON places_qualities.place_id = places.place_id
    `);
  }

  static async getAllPlaceNames() {
    return dao.get(`
      SELECT
      	places.name
      FROM places
    `);
  }

  static async getPlace(id) {
    return dao.get(`
      SELECT
      	places.name,
        places.county,
        places.country,
        places.rating,
        places_properties.latitude,
        places_properties.longitude,
        places_properties.population,
        places_qualities.air_quality,
        places_qualities.air_quality_label
      FROM places
      INNER JOIN places_properties ON places_properties.place_id = places.place_id
      INNER JOIN places_qualities ON places_qualities.place_id = places.place_id
      WHERE places.place_id = $1
    `, [id]);
  }

  static async findPlace(q) {
    return dao.get(`
      SELECT
        places.place_id,
        places.name,
        places.county,
        places.country,
        places.rating,
        places_properties.latitude,
        places_properties.longitude,
        places_properties.population,
        places_qualities.air_quality,
        places_qualities.air_quality_label
      FROM
      	places
      INNER JOIN places_properties ON places_properties.place_id = places.place_id
      INNER JOIN places_qualities ON places_qualities.place_id = places.place_id
      WHERE places.name ILIKE $1
    `, [q]);
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
      INNER JOIN places_properties ON places_properties.place_id = places.place_id
      INNER JOIN places_qualities ON places_qualities.place_id = places.place_id
      WHERE places.place_id = $1
    `, [id]);
  }

  static async getAllPlaces() {
    return dao.get(`
      SELECT *
      FROM places
      INNER JOIN places_properties ON places_properties.place_id = places.place_id
      INNER JOIN places_qualities ON places_qualities.place_id = places.place_id
    `);
  }

  static async insertVehicleCount(quantity, id) {
    return dao.get(`UPDATE places_qualities SET number_vehicles = $1 WHERE places_id = $2`, [quantity, id]);
  }
}
