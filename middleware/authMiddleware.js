const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  // Token comes in header: "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization']
  const token      = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = decoded   // attach admin info to request
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' })
    }
    return res.status(401).json({ error: 'Invalid token.' })
  }
}

module.exports = { verifyToken }
