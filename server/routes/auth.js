const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'All fields required' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already in use' });

  const user = await User.create({ name, email, password });
  res.status(201).json({ token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email } });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ message: 'Invalid credentials' });

  res.json({ token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email } });
});

// Get profile
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  res.json(user);
});

module.exports = router;
