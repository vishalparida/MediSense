const express = require('express');
const router = express.Router();
const { User} = require('../models/User'); // Adjust path to your User model

router.get('/', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'Doctor' }).select('-password');

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors: doctors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;