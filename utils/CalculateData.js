
const AQIPercentage = (aqi, maxAQI) => {
   return 100 - ((aqi / 500) * 100);
}

const populationDensity = (pop, area) => {
  return Math.round(pop / (area / 1000000));
}

const PDPercentage = (populationDensity, maxPopulation) => {
  return 100 - ((populationDensity / maxPopulation) * 100);
}

const vehiclePopulationRatio = (vehicleCount, population) => {
  return Math.round(((population / vehicleCount) + Number.EPSILON) * 100) / 100;
}

const busStopPopulationRatio = (busStopCount, population) => {
  return Math.round(((population / busStopCount) + Number.EPSILON) * 100) / 100;
}

const rangePercentage = (min, max, value) => {
  return ((value - min) * 100) / (max - min);
}

const rating = ({ name, air_quality, population, area }) => {
  // let AQIPercentage = AQIPercentage(air_quality);
  // let AQIRating = Math.round(((AQIpercentage / 20) + Number.EPSILON) * 100) / 100;

  // let populationDensity = populationDensity(population, area);
  // let PDPercentage = PDPercentage(populationDensity, population);
  //
  // let totalPercentage = ((AQIPercentage + PDPercentage) / 200) * 100;
  // let rating = Math.round(((totalPercentage / 20) + Number.EPSILON) * 100) / 100;

  return 0;
}
export default { AQIPercentage, populationDensity, PDPercentage, busStopPopulationRatio, vehiclePopulationRatio, rangePercentage, rating };
