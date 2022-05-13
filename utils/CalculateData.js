
const AQIPercentage = (aqi, maxAQI) => {
   return 100 - ((aqi / 500) * 100);
}

const populationDensity = (pop, area) => {
  return Math.round(pop / (area / 1000000));
}

const PDPercentage = (populationDensity, maxPopulation) => {
  return 100 - ((populationDensity / maxPopulation) * 100);
}

const parkAreaRatio = (parkCount, area) => {
  return Math.round(((parkCount / (area / 1000000)) + Number.EPSILON) * 100) / 100;
}

const parkPopulationRatio = (parkCount, population) => {
  return Math.round(((population / parkCount) + Number.EPSILON) * 100) / 100;
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

const rangePercentage = (min, max, value) => {
  let p = ((value - min) * 100) / (max - min);
  if(p < 25) p = 25;

  return p;
}

export default { AQIPercentage, populationDensity, PDPercentage, parkAreaRatio, parkPopulationRatio, busStopPopulationRatio, vehiclePopulationRatio, bicycleParkingPopulationRatio, routeRatio, IQR, rangePercentage };
