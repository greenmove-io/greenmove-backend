
const AQIPercentage = (aqi, maxAQI) => {
   return 100 - ((aqi / 500) * 100);
}

const ratio = (v1, v2) => Math.round(v1 / v2);

const ratioTwoDecimal = (v1, v2, multiplier = 1) => Math.round((((v1 / v2) * multiplier) + Number.EPSILON) * 100) / 100;

const rating = (place, interquartiles) => {
  place['percentages'] = {};

  Object.keys(interquartiles).forEach(key => {
    if(place[key] >= interquartiles[key].Q1 && place[key] <= interquartiles[key].Q3) {
      place['percentages'][key] = rangePercentage(interquartiles[key].Q1, interquartiles[key].Q3, place[key]);
    } else if (place[key] < interquartiles[key].Q1) {
      place['percentages'][key] = 0;
    } else if (place[key] > interquartiles[key].Q3) {
      place['percentages'][key] = 100;
    }

    if(interquartiles[key].isLowerBetter) place['percentages'][key] = 100 - place['percentages'][key];
    if(place[key] == null) place['percentages'][key] = 100;
  });

  let totalPercentage = (Object.values(place.percentages).reduce((a, b) => a + b) / (Object.keys(place.percentages).length * 100)) * 100;

  return Math.round(((totalPercentage / 20) + Number.EPSILON) * 100) / 100;
}

// https://stackoverflow.com/questions/48719873/how-to-get-median-and-quartiles-percentiles-of-an-array-in-javascript-or-php
const std = (arr) => {
  const mu = arr.reduce((a, b) => a + b, 0) / arr.length;
  const diffArr = arr.map(a => (a - mu) ** 2);
  return Math.sqrt(diffArr.reduce((a, b) => a + b, 0) / (arr.length - 1));
}

const quantile = (arr, q) => {
  const sorted = arr.sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const res = pos - base;
  if(sorted[base + 1] !== undefined) {
    return sorted[base] + res * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

const IQR = (arr) => {
  const q1 = arr => quantile(arr, .25);
  const q2 = arr => quantile(arr, .50);
  const q3 = arr => quantile(arr, .75);

  return { STD: std(arr), Q1: q1(arr), Q2: q2(arr), Q3: q3(arr) };
}

// https://stackoverflow.com/questions/25835591/how-to-calculate-percentage-between-the-range-of-two-values-a-third-value-is
const rangePercentage = (min, max, value) => ((value - min) * 100) / (max - min);

export default { AQIPercentage, rangePercentage, ratio, ratioTwoDecimal, rating, quantile, IQR };
