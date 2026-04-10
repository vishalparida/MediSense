const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const { User, Doctor, Facilitator } = require('../models/User');

// Helper function to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d', // Token lasts for 30 days
  });
};

// @desc    Register new user (Doctor or Facilitator)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res)  => {
  try {
    const { role, email } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // 2. Create the user based on their role
    let user;
    if (role === 'Doctor') {
      user = await Doctor.create(req.body);
    } else if (role === 'Facilitator') {
      user = await Facilitator.create(req.body);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    // 3. Send back success response with token
    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
})

// @desc    Authenticate a user (Login)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email and explicitly select the password field
    const user = await User.findOne({ email }).select('+password');

    // 2. Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        success: true,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role, // Helpful for frontend to know which dashboard to show
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
})

module.exports = router;