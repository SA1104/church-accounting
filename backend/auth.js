const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'church-accounting-super-secret-key-1234';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
}

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await query.get(`
      SELECT u.*, g.name as group_name, o.name as organization_name 
      FROM users u 
      LEFT JOIN groups g ON u.group_id = g.group_id 
      LEFT JOIN organizations o ON g.organization_id = o.organization_id
      WHERE u.username = ? AND u.is_active = 1
    `, [username]);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        name: user.name,
        role: user.role,
        position: user.position,
        groupId: user.group_id,
        groupName: user.group_name,
        organizationName: user.organization_name,
        signature: user.signature
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        name: user.name,
        role: user.role,
        position: user.position,
        groupId: user.group_id,
        groupName: user.group_name,
        organizationName: user.organization_name,
        signature: user.signature
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  authenticateToken,
  requireRole,
  login
};
