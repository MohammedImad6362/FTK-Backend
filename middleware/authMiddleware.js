const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ msg: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secretKey = process.env.SECRET_KEY;
    const decoded = jwt.verify(token, secretKey);

    // Extract the role from the decoded token
    const userRole = decoded.userId.role;

    // Set the userRole in req object for later access
    req.userRole = userRole;
    next()

  } catch (err) {
    console.log("invalid", err)
    if (err.name === 'TokenExpiredError') {
      return res.status(401).send({ msg: 'Token has expired.' });
    }
    res.status(401).send({ msg: 'Invalid token.', error:err.message });
  }
};

// Middleware for Superadmins
function checkSuperAdmin(req, res, next) {
  if (req.userRole === 'SUPERADMIN') {
    next();
  } else {
    res.status(403).json({ msg: 'Unauthorized, only superadmin allowed', error:err.message });
  }
}

// Middleware for Admins
function checkAdmin(req, res, next) {
  if (req.userRole === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ msg: 'Unauthorized,  only admins are allowed', err: 'server issue' });
  }
}



module.exports = { authMiddleware, checkSuperAdmin, checkAdmin };
