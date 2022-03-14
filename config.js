require('dotenv').config();

exports.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
exports.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
exports.VERIFICATION_TOKEN_SECRET = process.env.VERIFICATION_TOKEN_SECRET;

exports.ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || 15;
exports.REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || (60*24*30);
exports.VERIFICATION_TOKEN_EXPIRES = process.env.VERIFICATION_TOKEN_EXPIRES || (60*24);

exports.DB_SOURCE = process.env.DB_SOURCE || 'db.sqlite';
exports.BASE_URL = process.env.BASE_URL || 'http://localhost:3080';
exports.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
