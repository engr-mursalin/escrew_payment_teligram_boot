const jwt = require('jsonwebtoken');
const config = require('../../config');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    req.user = jwt.verify(token, config.adminJwtSecret);
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

