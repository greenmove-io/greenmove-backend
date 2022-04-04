
export const calculateAQI = (aqi) => {
  return 100 - ((aqi / 500) * 100);
}

export const calculateRating = ({ aqi }) => {
  let AQIpercentage = calculateAQI(aqi);

  let rating = Math.round(((AQIpercentage / 20) + Number.EPSILON) * 100) / 100;
  return rating;
}
