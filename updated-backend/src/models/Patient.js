import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: String,
    label: String,
  },
  { _id: false },
);

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, required: true },
    village: String,
    district: String,
    state: String,
    symptoms: { type: String, required: true },
    medicalHistory: String,
    // Add these inside your Patient Schema
  images: {
    type: [String], // Array of Cloudinary URLs
    default: []
  },
  aiImageAnalysis: {
    type: String,   // The diagnosis returned by the Vision AI
    default: null
  },
    status: {
      type: String,
      enum: ["awaiting_doctor", "video_scheduled", "completed"],
      default: "awaiting_doctor",
      index: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
      index: true,
    },
    aiSummary: String,
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    doctorResponse: {
      type: mongoose.Schema.Types.Mixed, // This allows the nested prescription/video data to save!
      default: null,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

patientSchema.index({ createdAt: -1 });

export const Patient = mongoose.model("Patient", patientSchema);
