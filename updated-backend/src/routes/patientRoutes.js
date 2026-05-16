const express = require("express");
const router = express.Router();
const { Patient } = require("../models/Patient"); // Adjust path to your Patient model
// GET /api/patients - Fetch patients (Filtered by facilitator OR doctor)
router.get("/", async (req, res) => {
  try {
    const { facilitatorId, doctorId } = req.query;

    // Build the query dynamically based on who is asking
    let query = {};
    if (facilitatorId) query.createdBy = facilitatorId;
    if (doctorId) query.assignedDoctor = doctorId;

    const patients = await Patient.find(query)
      .populate(
        "assignedDoctor",
        "fullName specialization currentHospitalClinic",
      )
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: patients.length,
      patients: patients,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}); 

const normalizeImages = (images) => {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => {
      if (typeof img === "string") {
        return { url: img, label: "Uploaded Image" };
      }
      if (typeof img === "object" && img !== null) {
        return {
          url: img.url || img.value || "",
          label: img.label || "Uploaded Image",
        };
      }
      return { url: String(img), label: "Uploaded Image" };
    })
    .filter((img) => img.url);
};

// POST /api/patients - Create a new patient
router.post("/", async (req, res) => {
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
      images: normalizeImages(req.body.images),
      aiSummary: req.body.aiSummary,
      assignedDoctor: req.body.assignedDoctor,
      createdBy: req.body.createdBy,
      status: "awaiting_doctor",
      priority: "Medium",
    });

    const savedPatient = await newPatient.save();

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      patient: savedPatient,
    });
  } catch (error) {
    console.error("Error saving patient:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/patients/:id - Fetch a single patient by ID
router.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate(
      "assignedDoctor",
      "fullName specialization currentHospitalClinic",
    );

    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    res.status(200).json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/patients/:id - Update an existing patient
// PUT /api/patients/:id
router.put('/:id', async (req, res) => {
  try {
    // ❌ Delete any code here that maps or alters req.body.images! ❌

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body, // Just pass the exact JSON from the frontend
      { new: true }
    ).populate('assignedDoctor');

    res.status(200).json({ success: true, patient: updatedPatient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;
