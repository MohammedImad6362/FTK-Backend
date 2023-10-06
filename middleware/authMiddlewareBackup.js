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
    console.log("role", decoded)
    const userRole = decoded.userId.role;

    // Set the userRole in req object for later access
    req.userRole = userRole;
    next()

  } catch (err) {
    console.log("invalid", err)
    if (err.name === 'TokenExpiredError') {
      return res.status(401).send({ msg: 'Token has expired.' });
    }
    res.status(401).send({ msg: 'Invalid token.', err });
  }
};

const roleBasedAccess = [
  {
    role: 'SUPERADMIN',
    routes: [
      '/superadmin-only',
      '/user/reg-admin',
      '/user/admins',
      '/upd-admin/:id',
      '/del-admin/:id',
      '/institute/add',
      '/institute/',
      '/institute/:id',
      '/institute/upd/:id',
      '/institute/del/:id',
      '/level/add',
      '/level/',
      '/level/:id',
      '/level/upd/:id',
      '/level/del/:id',
      '/batch/add',
      '/batch/',
      '/batch/:id',
      '/batch/upd/:id',
      '/batch/del/:id',
      '/category/add',
      '/category/',
      '/category/:id',
      '/category/upd/:id',
      '/category/del/:id',
      '/activity/add',
      '/activity/',
      '/activity/:id',
      '/activity/upd/:id',
      '/activity/del/:id',
      '/video/add',
      '/video/',
      '/video/:id',
      '/video/upd/:id',
      '/video/del/:id',
    ]
  },
  {
    role: 'ADMIN',
    routes: [
      '/admin-only',
      '/batch/add',
      '/batch/',
      '/batch/:id',
      '/batch/upd/:id',
      '/batch/del/:id',
      '/user/add-student',
      '/user/students',
      '/user/student/:id',
      '/user/upd-student/:id',
      '/user/del-student/:id',
      '/user/add-parent',
      '/user/parents',
      '/user/parent/:id',
      '/user/upd-parent/:id',
      '/user/del-parent/:id',
      '/level/',
      '/level/:id',
      '/category/',
      '/category/:id',
      '/activity/',
      '/activity/:id',
      '/video/',
      '/video/:id',
    ]
  }
];

function checkAuthorization(req, res, next) {
  const userRole = req.userRole;
  const route = req.originalUrl;
  console.log("in check Auth", userRole, route)

  // Find the access configuration for the user's role in roleBasedAccess
  const userAccessConfig = roleBasedAccess.find(item => item.role === userRole);

  // If the user's role is not found in roleBasedAccess, it means the role is not allowed
  if (!userAccessConfig) {
    return res.status(403).json({ msg: 'Unauthorized', err: "user role doesn't match" });
  }

  // Check if the requested route is allowed for the user's role
  if (userAccessConfig.routes.includes(route)) {
    next(); // User is authorized to access the route, proceed to the next middleware or route handler
  }
  else {
    res.status(403).json({ msg: 'Unauthorized', err: 'server issue' });
  }
}


module.exports = { authMiddleware, checkAuthorization };
