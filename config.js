require('dotenv').config();

exports.DB_SOURCE = process.env.DB_SOURCE || 'db.sqlite';
exports.BASE_URL = process.env.BASE_URL || 'http://localhost:3080';

exports.OPENWEATHER_API_URL = process.env.OPENWEATHER_API_URL;
exports.OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
