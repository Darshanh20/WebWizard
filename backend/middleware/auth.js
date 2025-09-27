const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No authentication token, authorization denied.' });

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) return res.status(401).json({ msg: 'Token verification failed, authorization denied.' });

    req.user = verified.id;
    req.role = verified.role;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const adminAuth = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Only administrators can perform this action.' });
  }
  next();
};

module.exports = { auth, adminAuth };
