import { numberWithCommas } from '../utils/functions';
import CalculateData from '../utils/CalculateData';

export default class Place {
  constructor() {
    this.id = '';
    this.type = '';
    this.name = '';
    this.county = '';
    this.country = '';
    this.rating = 0;
    this.last_updated = 0;

    this.wiki_item = '';
    this.osm_id = 0;
    this.area = 0;
    this.boundary_id = '';
    this.boundary_last_updated = 0;
    this.area_inaccurate = false;
    this.latitude = 0;
    this.longitude = 0;
    this.population = 0;
    this.greenspace_area = 0;
    this.park_area = 0;
    this.bus_stop_quantity = 0;
    this.vehicle_quantity = 0;
    this.bicycle_parking_quantity = 0;
    this.walking_routes_quantity = 0;
    this.walking_routes_length = 0;
    this.cycling_routes_quantity = 0;
    this.cycling_routes_length = 0;
    this.postcode_districts = [];

    this.air_quality = 0;
    this.air_quality_label = '';
    this.water_quality = 0;
    this.greenspace = 0;
    this.greenspace_area_ratio = 0;
    this.waste_recycling = 0;
    this.park_area_ratio = 0;
    this.park_average_area = 0;
    this.park_population_ratio = 0;
    this.vehicle_population_ratio = 0;
    this.bus_stop_population_ratio = 0;
    this.bicycle_parking_population_ratio = 0;
    this.walking_routes_ratio = 0;
    this.cycling_routes_ratio = 0;
    this.population_density = 0;
  }

  format(place) {
    place.rating = Number(place.rating);
    place.last_updated = Number(place.last_updated);
    place.population = numberWithCommas(place.population);
    place.area = Math.round(((place.area / 1000000) + Number.EPSILON) * 100) / 100;
    place.air_quality = Number(place.air_quality);
    place.greenspace_area = Math.round(((place.greenspace_area / 1000000) + Number.EPSILON) * 100) / 100;
    place.park_area = Math.round(((place.park_area / 1000000) + Number.EPSILON) * 100) / 100;
    if(place.vehicle_quantity !== null) place.vehicle_quantity = numberWithCommas(place.vehicle_quantity);
    place.bus_stop_quantity = numberWithCommas(place.bus_stop_quantity);
    let decimalCount = 2;
    if(place.walking_routes_length < 100000) decimalCount = 4;
    place.walking_routes_length = +(place.walking_routes_length / 1000000).toFixed(decimalCount);
    decimalCount = 2;
    if(place.cycling_routes_length < 100000) decimalCount = 4;
    place.cycling_routes_length = +(place.cycling_routes_length / 1000000).toFixed(decimalCount);

    place.greenspace_area_ratio = Number(place.greenspace_area_ratio);
    place.park_area_ratio = Number(place.park_area_ratio);
    place.park_average_area = Number(place.park_average_area);
    place.park_population_ratio = numberWithCommas(place.park_population_ratio);
    place.vehicle_population_ratio = Number(place.vehicle_population_ratio);
    place.bus_stop_population_ratio = numberWithCommas(place.bus_stop_population_ratio);
    place.bicycle_parking_population_ratio = numberWithCommas(place.bicycle_parking_population_ratio);
    place.walking_routes_ratio = Number(place.walking_routes_ratio);
    place.cycling_routes_ratio = Number(place.cycling_routes_ratio);
    place.population_density = numberWithCommas(place.population_density);

    return place;
  }

  percentages(place, ranges, interquartiles, interquartilesOG) {
    place['percentages'] = {};

    Object.keys(interquartiles).forEach(key => {
      if(place[key] > interquartiles[key].Q3) {
        place['percentages'][key] = 100;
      } else if (place[key] > interquartiles[key].Q2) {
        place['percentages'][key] = 75;
      } else if (place[key] > interquartiles[key].Q1) {
        place['percentages'][key] = 50;
      } else {
        place['percentages'][key] = 25;
      }

      if(interquartilesOG[key].isLowerBetter) place['percentages'][key] = 100 - place['percentages'][key];
      if(place['percentages'][key] < 10) place['percentages'][key] = 15;
    });

    return place;
  }
}
