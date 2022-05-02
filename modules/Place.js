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
    this.area_inaccurate = false;
    this.latitude = 0;
    this.longitude = 0;
    this.population = 0;
    this.postcode_districts = [];

    this.air_quality = 0;
    this.air_quality_label = '';
    this.water_quality = 0;
    this.greenspace = 0;
    this.waste_recycling = 0;
    this.vehicle_quanitity = 0;
    this.bus_stop_quantity = 0;
    this.population_density = 0;
  }

  calculateRating() {

  }

  format(place) {
    place.rating = Number(place.rating);
    place.last_updated = Number(place.last_updated);
    place.population = numberWithCommas(place.population);
    place.area = Math.round(((place.area / 1000000) + Number.EPSILON) * 100) / 100;
    place.air_quality = CalculateData.AQIPercentage(place.air_quality);
    if(place.vehicle_quantity !== null) place.vehicle_quantity = numberWithCommas(place.vehicle_quantity);
    place.bus_stop_quantity = numberWithCommas(place.bus_stop_quantity);
    place.population_density = numberWithCommas(place.population_density);
    return place;
  }
}
