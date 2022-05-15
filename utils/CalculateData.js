
const AQIPercentage = (aqi, maxAQI) => {
   return 100 - ((aqi / 500) * 100);
}

const PDPercentage = (populationDensity, maxPopulation) => {
  return 100 - ((populationDensity / maxPopulation) * 100);
}

const ratio = (v1, v2) => Math.round(v1 / v2);

const ratioTwoDecimal = (v1, v2) => Math.round(((v1 / v2) + Number.EPSILON) * 100) / 100;

const rating = (place, interquartiles) => {
  let AQIPercentage, PDPercentage,
      BSRPercentage, VRPercentage,
      BPRPercentage, WRRPercentage,
      CRRPercentage, GRPercentage,
      PARPercentage, PPRPercentage,
      PAARPercentage;

  if(place.air_quality >= interquartiles.air_quality.Q1 && place.air_quality <= interquartiles.air_quality.Q3) {
    AQIPercentage = 100 - rangePercentage(interquartiles.air_quality.Q1, interquartiles.air_quality.Q3, place.air_quality);
  } else if (place.air_quality < interquartiles.air_quality.Q1) {
    AQIPercentage = 100;
  } else if (place.air_quality > interquartiles.air_quality.Q3) {
    AQIPercentage = 0;
  }

  if(place.population_density >= interquartiles.population_density.Q1 && place.population_density <= interquartiles.population_density.Q3) {
    PDPercentage = 100 - rangePercentage(interquartiles.population_density.Q1, interquartiles.population_density.Q3, place.population_density);
  } else if (place.population_density < interquartiles.population_density.Q1) {
    PDPercentage = 100;
  } else if (place.population_density > interquartiles.population_density.Q3) {
    PDPercentage = 0;
  }

  if(place.bus_stop_population_ratio >= interquartiles.bus_stop_population_ratio.Q1 && place.bus_stop_population_ratio <= interquartiles.bus_stop_population_ratio.Q3) {
    BSRPercentage = 100 - rangePercentage(interquartiles.bus_stop_population_ratio.Q1, interquartiles.bus_stop_population_ratio.Q3, place.bus_stop_population_ratio);
  } else if (place.bus_stop_population_ratio < interquartiles.bus_stop_population_ratio.Q1) {
    BSRPercentage = 100;
  } else if (place.bus_stop_population_ratio > interquartiles.bus_stop_population_ratio.Q3) {
    BSRPercentage = 0;
  }

  VRPercentage = 100;
  if(place.vehicle_population_ratio !== null) {
    if(place.vehicle_population_ratio >= interquartiles.vehicle_population_ratio.Q1 && place.vehicle_population_ratio <= interquartiles.vehicle_population_ratio.Q3) {
      VRPercentage = 100 - rangePercentage(interquartiles.vehicle_population_ratio.Q1, interquartiles.vehicle_population_ratio.Q3, place.vehicle_population_ratio);
    } else if (place.vehicle_population_ratio < interquartiles.vehicle_population_ratio.Q1) {
      VRPercentage = 100;
    } else if (place.vehicle_population_ratio > interquartiles.vehicle_population_ratio.Q3) {
      VRPercentage = 0;
    }
  }

  if(place.bicycle_parking_population_ratio >= interquartiles.bicycle_parking_population_ratio.Q1 && place.bicycle_parking_population_ratio <= interquartiles.bicycle_parking_population_ratio.Q3) {
    BPRPercentage = 100 - rangePercentage(interquartiles.bicycle_parking_population_ratio.Q1, interquartiles.bicycle_parking_population_ratio.Q3, place.bicycle_parking_population_ratio);
  } else if (place.bicycle_parking_population_ratio < interquartiles.bicycle_parking_population_ratio.Q1) {
    BPRPercentage = 100;
  } else if (place.bicycle_parking_population_ratio > interquartiles.bicycle_parking_population_ratio.Q3) {
    BPRPercentage = 0;
  }

  if(place.walking_routes_ratio >= interquartiles.walking_routes_ratio.Q1 && place.walking_routes_ratio <= interquartiles.walking_routes_ratio.Q3) {
    WRRPercentage = rangePercentage(interquartiles.walking_routes_ratio.Q1, interquartiles.walking_routes_ratio.Q3, place.walking_routes_ratio);
  } else if (place.walking_routes_ratio < interquartiles.walking_routes_ratio.Q1) {
    WRRPercentage = 0;
  } else if (place.walking_routes_ratio > interquartiles.walking_routes_ratio.Q3) {
    WRRPercentage = 100;
  }

  if(place.cycling_routes_ratio >= interquartiles.cycling_routes_ratio.Q1 && place.cycling_routes_ratio <= interquartiles.cycling_routes_ratio.Q3) {
    CRRPercentage = rangePercentage(interquartiles.cycling_routes_ratio.Q1, interquartiles.cycling_routes_ratio.Q3, place.cycling_routes_ratio);
  } else if (place.cycling_routes_ratio < interquartiles.cycling_routes_ratio.Q1) {
    CRRPercentage = 0;
  } else if (place.cycling_routes_ratio > interquartiles.cycling_routes_ratio.Q3) {
    CRRPercentage = 100;
  }

  if(place.greenspace_area_ratio >= interquartiles.greenspace_area_ratio.Q1 && place.greenspace_area_ratio <= interquartiles.greenspace_area_ratio.Q3) {
    GRPercentage = rangePercentage(interquartiles.greenspace_area_ratio.Q1, interquartiles.greenspace_area_ratio.Q3, place.greenspace_area_ratio);
  } else if (place.greenspace_area_ratio < interquartiles.greenspace_area_ratio.Q1) {
    GRPercentage = 0;
  } else if (place.greenspace_area_ratio > interquartiles.greenspace_area_ratio.Q3) {
    GRPercentage = 100;
  }

  if(place.park_area_ratio >= interquartiles.park_area_ratio.Q1 && place.park_area_ratio <= interquartiles.park_area_ratio.Q3) {
    PARPercentage = rangePercentage(interquartiles.park_area_ratio.Q1, interquartiles.park_area_ratio.Q3, place.park_area_ratio);
  } else if (place.park_area_ratio < interquartiles.park_area_ratio.Q1) {
    PARPercentage = 0;
  } else if (place.park_area_ratio > interquartiles.park_area_ratio.Q3) {
    PARPercentage = 100;
  }

  if(place.park_average_area >= interquartiles.park_average_area.Q1 && place.park_average_area <= interquartiles.park_average_area.Q3) {
    PAARPercentage = rangePercentage(interquartiles.park_average_area.Q1, interquartiles.park_average_area.Q3, place.park_average_area);
  } else if (place.park_average_area < interquartiles.park_average_area.Q1) {
    PAARPercentage = 0;
  } else if (place.park_average_area > interquartiles.park_average_area.Q3) {
    PAARPercentage = 100;
  }

  if(place.park_population_ratio >= interquartiles.park_population_ratio.Q1 && place.park_population_ratio <= interquartiles.park_population_ratio.Q3) {
    PPRPercentage = 100 - rangePercentage(interquartiles.park_population_ratio.Q1, interquartiles.park_population_ratio.Q3, place.park_population_ratio);
  } else if (place.park_population_ratio < interquartiles.park_population_ratio.Q1) {
    PPRPercentage = 100;
  } else if (place.park_population_ratio > interquartiles.park_population_ratio.Q3) {
    PPRPercentage = 0;
  }

  let totalPercentage;
  totalPercentage = ((AQIPercentage + PDPercentage + BSRPercentage + VRPercentage + BPRPercentage + WRRPercentage + CRRPercentage + GRPercentage + PARPercentage + PAARPercentage + PPRPercentage) / 1100) * 100;

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

export default { AQIPercentage, PDPercentage, ratio, ratioTwoDecimal, rating, quantile, IQR };
