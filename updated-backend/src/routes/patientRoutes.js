const express = require('express');
const router = express.Router();
const { Patient } = require('../models/Patient'); // Adjust path to your Patient model


router.get('/', async (req, res) => {
  try {
    const { facilitatorId } = req.query;
    
    // If a facilitator ID is provided, only fetch their patients. Otherwise, fetch all.
    const query = facilitatorId ? { createdBy: facilitatorId } : {};

    const patients = await Patient.find(query)
      .populate('assignedDoctor', 'fullName specialization currentHospitalClinic') // Pull in doctor details
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: patients.length,
      patients: patients
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/patients - Create a new patient
router.post('/', async (req, res) => {
  try {
    const newPatient = new Patient({
      name: req.body.name,
      age: req.body.age,
      gender: req.body.gender,
      phone: req.body.phone,
      village: req.body.village,
      district: req.body.district,
      state: req.body.state,
      symptoms: req.body.symptoms,
      medicalHistory: req.body.medicalHistory,
      images: req.body.images, 
      aiSummary: req.body.aiSummary,
      assignedDoctor: req.body.assignedDoctor,
      createdBy: req.body.createdBy,
      status: "awaiting_doctor",
      priority: "Medium"
    });

    const savedPatient = await newPatient.save();
    
    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      patient: savedPatient
    });
  } catch (error) {
    console.error("Error saving patient:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;