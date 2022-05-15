import dao from './dao';

export class open {
  static async getPlaces() {
    return dao.all(`
      SELECT
        places.place_id,
      	places.name,
        places.county,
        places.country,
        places.rating
      FROM places
      ORDER BY places.name ASC
    `);
  }

  static async getAllPlaceNames() {
    return dao.all(`
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
        places.last_updated,
        places_properties.area,
        places_properties.area_inaccurate,
        places_properties.latitude,
        places_properties.longitude,
        places_properties.population,
        places_properties.greenspace_area,
        places_properties.park_area,
        places_properties.vehicle_quantity,
        places_properties.bus_stop_quantity,
        places_properties.walking_routes_length,
        places_properties.cycling_routes_length,
        places_properties.postcode_districts,
        places_qualities.air_quality,
        places_qualities.air_quality_label,
        places_qualities.water_quality,
        places_qualities.greenspace,
        places_qualities.greenspace_area_ratio,
        places_qualities.waste_recycling,
        places_qualities.park_area_ratio,
        places_qualities.park_average_area,
        places_qualities.park_population_ratio,
        places_qualities.vehicle_population_ratio,
        places_qualities.bus_stop_population_ratio,
        places_qualities.bicycle_parking_population_ratio,
        places_qualities.walking_routes_ratio,
        places_qualities.cycling_routes_ratio,
        places_qualities.population_density
      FROM places
      INNER JOIN places_properties ON places_properties.place_id = places.place_id
      INNER JOIN places_qualities ON places_qualities.place_id = places.place_id
      WHERE places.place_id = $1
    `, [id]);
  }

  static async findPlace(q) {
    return dao.get(`
      SELECT
      places.name,
      places.county,
      places.country,
      places.rating,
      places.last_updated,
      places_properties.area,
      places_properties.area_inaccurate,
      places_properties.latitude,
      places_properties.longitude,
      places_properties.population,
      places_properties.greenspace_area,
      places_properties.park_area,
      places_properties.vehicle_quantity,
      places_properties.bus_stop_quantity,
      places_properties.walking_routes_length,
      places_properties.cycling_routes_length,
      places_properties.postcode_districts,
      places_qualities.air_quality,
      places_qualities.air_quality_label,
      places_qualities.water_quality,
      places_qualities.greenspace,
      places_qualities.greenspace_area_ratio,
      places_qualities.waste_recycling,
      places_qualities.park_area_ratio,
      places_qualities.park_average_area,
      places_qualities.park_population_ratio,
      places_qualities.vehicle_population_ratio,
      places_qualities.bus_stop_population_ratio,
      places_qualities.bicycle_parking_population_ratio,
      places_qualities.walking_routes_ratio,
      places_qualities.cycling_routes_ratio,
      places_qualities.population_density
      FROM places
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

  static async getPlace(id) {
    return dao.get(`
      SELECT *
      FROM places
      INNER JOIN places_properties ON places_properties.place_id = places.place_id
      INNER JOIN places_qualities ON places_qualities.place_id = places.place_id
      WHERE places.place_id = $1
    `, [id]);
  }

  static async getAllPlaces() {
    return dao.all(`
      SELECT *
      FROM places
      INNER JOIN places_properties ON places_properties.place_id = places.place_id
      INNER JOIN places_qualities ON places_qualities.place_id = places.place_id
    `);
  }

  static async insertVehicleCount(quantity, id) {
    return dao.run(`UPDATE places_properties SET vehicle_quantity = $1 WHERE place_id = $2`, [quantity, id]);
  }
}
