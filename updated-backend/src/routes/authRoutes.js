const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const { User, Doctor, Facilitator } = require('../models/User');
const bcrypt = require('bcryptjs');

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
  const { email, password } = req.body;
  
  try {
    console.log(req.body)
    // 1. Find user (Explicitly selecting password because it's hidden in the model)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // 2. Check if password matches using bcrypt directly
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // 4. Return token and user (strip out the password for security)
    const { password: _, ...userData } = user.toObject();

    console.log(user)
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

module.exports = router;