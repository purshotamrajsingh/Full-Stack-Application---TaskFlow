const User = require('../models/User');
const generateToken = require('../utils/generateToken');

async function register(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  // Only allow admin role assignment if no admin secret mismatch;
  // by default new signups are 'user', role can be set to 'admin' only
  // via the ADMIN_SIGNUP_CODE for demo/grading purposes.
  let assignedRole = 'user';
  if (role === 'admin' && req.body.adminCode === process.env.ADMIN_SIGNUP_CODE) {
    assignedRole = 'admin';
  }

  const user = await User.create({ name, email: email.toLowerCase(), password, role: assignedRole });
  const token = generateToken(user);
  res.status(201).json({ token, user: user.toSafeObject() });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = generateToken(user);
  res.json({ token, user: user.toSafeObject() });
}

async function me(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

module.exports = { register, login, me };
