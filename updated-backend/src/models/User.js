const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. Define the Base Options
// discriminatorKey tells Mongoose which field determines the user type
const baseOptions = {
  discriminatorKey: 'role', 
  collection: 'users',
  timestamps: true,
};

// 2. Create the Base User Schema (Shared Fields)
const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Please provide a phone number'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
    },
    state: {
      type: String,
      required: [true, 'Please select a state'],
    },
    languagesSpoken: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Hides password in general queries
    },
  },
  baseOptions
);

// Password Hashing Middleware (Runs before saving)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password Compare Method for Login
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compile the Base Model
const User = mongoose.model('User', UserSchema);

// ==========================================
// 3. Create the Doctor Discriminator
// ==========================================
const Doctor = User.discriminator(
  'Doctor',
  new mongoose.Schema({
    medicalLicenseNumber: {
      type: String,
      required: [true, 'Please provide a medical license number'],
    },
    yearsOfExperience: {
      type: Number,
      required: [true, 'Please provide years of experience'],
    },
    specialization: {
      type: String,
      required: [true, 'Please select a specialization'],
    },
    currentHospitalClinic: {
      type: String,
      required: [true, 'Please provide current hospital or clinic'],
    },
    city: {
      type: String,
      required: [true, 'Please provide a city'],
    },
    preferredConsultationHours: {
      type: String,
    },
  })
);

// ==========================================
// 4. Create the Facilitator Discriminator
// ==========================================
const Facilitator = User.discriminator(
  'Facilitator',
  new mongoose.Schema({
    district: {
      type: String,
      required: [true, 'Please provide a district'],
    },
    villageArea: {
      type: String,
      required: [true, 'Please provide a village or area'],
    },
    educationBackground: {
      type: String,
    },
    healthcareExperience: {
      type: String,
    },
  })
);

// Export the Base Model and the Discriminators
module.exports = { User, Doctor, Facilitator };