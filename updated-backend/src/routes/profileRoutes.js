const express = require('express');
const router = express.Router();
const { User} = require('../models/User')
const { Patient } = require('../models/Patient')

// GET /api/profile/:id - Fetch user profile and their patient stats
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 1. Find the user (exclude the password field for security)
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Calculate patient statistics for this specific facilitator
    const totalPatients = await Patient.countDocuments({ createdBy: userId });
    const completedCases = await Patient.countDocuments({ createdBy: userId, status: 'completed' });
    const activeCases = totalPatients - completedCases;

    // 3. Send data back to frontend
    res.status(200).json({
      success: true,
      user: user,
      stats: {
        totalPatients,
        completedCases,
        activeCases,
        avgResponseTime: "2.5 hours" // You can build a real calculator for this later!
      }
    });

  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ success: false, message: "Server error fetching profile" });
  }
});

module.exports = router;