
const CalculateRating = ({ overall_aqi }) => {
  let AQIpercentage = 100 - ((overall_aqi / 500) * 100);
  let rating = Math.round(((AQIpercentage / 20) + Number.EPSILON) * 100) / 100;

  return rating;
}
export default CalculateRating;
