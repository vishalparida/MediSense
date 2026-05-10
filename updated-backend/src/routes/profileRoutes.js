const express = require('express');
const router = express.Router();
const { User} = require('../models/User')
const { Patient } = require('../models/Patient')

// GET /api/profile/:id - Fetch user profile and their patient stats
// GET /api/profile/:id - Fetch user profile and their patient stats
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 1. Find the user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Fetch all patients created by this facilitator
    const allPatients = await Patient.find({ createdBy: userId });

    // 3. Calculate basic stats
    const totalPatients = allPatients.length;
    const completedCases = allPatients.filter(p => p.status === 'completed').length;
    const activeCases = totalPatients - completedCases;

    // 4. REAL-TIME AVERAGE RESPONSE CALCULATOR
    let avgResponseTime = "N/A";
    
    // Find only the patients that the doctor has actually responded to
    const respondedPatients = allPatients.filter(p => p.doctorResponse && p.doctorResponse.timestamp);

    if (respondedPatients.length > 0) {
      // Add up the time difference (in milliseconds) for every responded patient
      const totalTimeMs = respondedPatients.reduce((sum, p) => {
        const createdTime = new Date(p.createdAt).getTime();
        const responseTime = new Date(p.doctorResponse.timestamp).getTime();
        return sum + (responseTime - createdTime);
      }, 0);

      // Get the average in milliseconds
      const avgMs = totalTimeMs / respondedPatients.length;

      // Convert milliseconds to hours
      const avgHours = avgMs / (1000 * 60 * 60);

      // Format it nicely for the UI
      if (avgHours < 1) {
        // If it's less than an hour, show minutes
        const avgMins = Math.round(avgHours * 60);
        avgResponseTime = `${avgMins} mins`;
      } else {
        // Otherwise, show hours rounded to 1 decimal place
        avgResponseTime = `${avgHours.toFixed(1)} hours`;
      }
    }

    // 5. Send dynamic data back to frontend
    res.status(200).json({
      success: true,
      user: user,
      stats: {
        totalPatients,
        completedCases,
        activeCases,
        avgResponseTime // This is now live, calculated data!
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