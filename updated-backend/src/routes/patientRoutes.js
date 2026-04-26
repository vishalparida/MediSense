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

// GET /api/patients/:id - Fetch a single patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'fullName specialization currentHospitalClinic');
      
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    res.status(200).json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/patients/:id - Update an existing patient
router.put('/:id', async (req, res) => {
  try {
    // Find the patient by ID and update with the new data from req.body
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true } // This tells Mongoose to return the updated document
    ).populate('assignedDoctor', 'fullName specialization currentHospitalClinic');

    if (!updatedPatient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      patient: updatedPatient
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;