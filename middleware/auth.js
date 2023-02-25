const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') next();
  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return next(new HttpError('Ověřování selhalo!', 401));
    }

    const decToken = jwt.verify(
      token,
      '3KjTfTlnvG2KIOCL8h18ZUHd6NfKzgOJeFeB+vH6/7o'
    );

    req.userData = { userId: decToken.id };
    next();
  } catch (err) {
    return next(new HttpError('Ověřování selhalo!', 401));
  }
};
