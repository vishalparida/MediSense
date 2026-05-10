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

// PUT /api/profile/:id - Update user profile
// PUT /api/profile/:id - Update user profile
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Explicitly map frontend data to database fields
    const updateFields = {
      fullName: req.body.name,
      phoneNumber: req.body.phone,
      villageArea: req.body.village,
      district: req.body.district,
      state: req.body.state,
      educationBackground: req.body.education,
      healthcareExperience: req.body.experience,
      languagesSpoken: req.body.languages,
    };

    // Clean up any undefined fields so we don't accidentally overwrite data
    Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

    // THE MAGIC BULLET: strict: false forces MongoDB to save these fields 
    // even if it thinks they are missing from the schema!
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true, strict: false } 
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ success: false, message: "Server error updating profile" });
  }
});

module.exports = router;