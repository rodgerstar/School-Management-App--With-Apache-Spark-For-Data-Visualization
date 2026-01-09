const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];  // Bearer token
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = decoded;  // Attach user data (tenantId, branchId, role) for isolation
    next();
  });
};

// Generate a random API key (run this once, copy to .env or frontend)
const generateApiKey = () => crypto.randomBytes(32).toString('hex');

// Check header
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];  // Frontend sends this header

  if (!apiKey || apiKey !== process.env.API_KEY) {  // Compare to .env key
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }

  next();  // Proceed if valid
};

module.exports = { authMiddleware, generateApiKey, verifyToken };