import { Patient } from "../models/Patient.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listPatients = asyncHandler(async (req, res) => {
  const { status, priority, doctor, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (doctor) filter.assignedDoctor = doctor;
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { village: new RegExp(q, "i") },
      { district: new RegExp(q, "i") },
    ];
  }
  const patients = await Patient.find(filter)
    .populate("assignedDoctor", "name specialty avatar experience location")
    .sort({ createdAt: -1 });
  res.json(new ApiResponse({ patients }));
});

export const createPatient = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    createdBy: req.user._id,
    images: (req.body.images || []).map((url) => ({ url })),
  };
  const patient = await Patient.create(payload);
  res.status(201).json(new ApiResponse({ patient }, "patient_created"));
});

export const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate(
    "assignedDoctor",
    "name specialty avatar experience location"
  );
  if (!patient) throw new ApiError(404, "Patient not found");
  res.json(new ApiResponse({ patient }));
});

export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new ApiError(404, "Patient not found");
  Object.assign(patient, req.body);
  if (req.body.images) patient.images = req.body.images.map((url) => ({ url }));
  await patient.save();
  res.json(new ApiResponse({ patient }, "patient_updated"));
});

export const assignDoctor = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new ApiError(404, "Patient not found");
  const doctor = await User.findById(req.body.doctorId);
  if (!doctor || doctor.role !== "doctor")
    throw new ApiError(400, "Invalid doctor");
  patient.assignedDoctor = doctor._id;
  patient.status = "awaiting_doctor";
  await patient.save();
  res.json(new ApiResponse({ patient }, "doctor_assigned"));
});

export const regenerateReport = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new ApiError(404, "Patient not found");
  // Placeholder AI logic
  patient.aiSummary = `${
    patient.age
  }-year-old ${patient.gender.toLowerCase()} with ${patient.symptoms.toLowerCase()}. Updated AI summary generated at ${new Date().toISOString()}`;
  await patient.save();
  res.json(new ApiResponse({ patient }, "ai_report_regenerated"));
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new ApiError(404, "Patient not found");
  patient.status = status;
  await patient.save();
  res.json(new ApiResponse({ patient }, "status_updated"));
});
