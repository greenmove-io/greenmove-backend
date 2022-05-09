
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

const bicycleParkingPopulationRatio = (bicycleParkingCount, population) => {
  return Math.round(((population / bicycleParkingCount) + Number.EPSILON) * 100) / 100;
}

const routeRatio = (routeLength, area) => {
  return Math.round(routeLength / (area / 1000000));
}

const rangePercentage = (min, max, value) => {
  return ((value - min) * 100) / (max - min);
}

export default { AQIPercentage, populationDensity, PDPercentage, busStopPopulationRatio, vehiclePopulationRatio, bicycleParkingPopulationRatio, routeRatio, rangePercentage };
