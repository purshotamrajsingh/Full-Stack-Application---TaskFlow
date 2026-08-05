const express = require('express');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Admin-only: list all users (used for assigning tasks / members picker)
router.get('/', requireRole('admin', 'user'), async (req, res) => {
  const users = await User.find().select('name email role createdAt');
  res.json(users);
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});

module.exports = router;
