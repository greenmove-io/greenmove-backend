
const {
  ACCESS_TOKEN
} = require('../config');

export const authMiddleware = (req, res, next) => {
  const token = req.header('Access-Token');
  if(!token) return next();

  if(token == ACCESS_TOKEN) {
    req.authenticated = true;
  }

  next();
}

export const authenticated = (req, res, next) => {
  if(req.authenticated) {
    return next();
  }

  res.status(401);
  res.json({
      status: 'fail',
      message: 'You are not authenticated'
  });
}
