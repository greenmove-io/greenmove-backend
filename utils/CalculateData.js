
export const calculateAQI = (aqi) => {
  return 100 - ((aqi / 500) * 100);
}

export const calculatePopulationDensity = (pop, area) => {
  return Math.round((pop / (area / 1000000)) * 100) / 100;
}

export const calculateRating = ({ aqi, population, area }) => {
  let AQIpercentage = calculateAQI(aqi);
  let AQIRating = Math.round(((AQIpercentage / 20) + Number.EPSILON) * 100) / 100
  let popDensity = calculatePopulationDensity(population, area);

  let rating = AQIRating;
  return rating;
}
