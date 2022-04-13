require('dotenv').config();

exports.ACCESS_TOKEN = process.env.ACCESS_TOKEN;
exports.DB_SOURCE = process.env.DB_SOURCE || 'db.sqlite';
exports.BASE_URL = process.env.BASE_URL || 'http://localhost:3080';

exports.AQICN_API_URL = process.env.AQICN_API_URL;
exports.AQICN_API_KEY = process.env.AQICN_API_KEY;

exports.WIKIDATA_API_URL = process.env.WIKIDATA_API_URL;

exports.required_props = ['item', 'population', 'area', 'latitude', 'longitude', 'aqi'];
exports.aqi_levels = [[0, 'Good'], [50, 'Good'], [100, 'Moderate'], [150, 'Unhealthy for Sensitive Groups'], [200, 'Unhealthy'], [300, 'Very Unhealthy'], [500, 'Hazardous']];
