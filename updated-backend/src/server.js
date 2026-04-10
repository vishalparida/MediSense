const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

// Initialize the Express application
const app = express();

// ==========================================
// Middleware
// ==========================================
// 1. CORS: Allows your React frontend to make requests to this API
app.use(cors()); 

// 2. Body Parser: Allows Express to read JSON data sent in the request body (req.body)
app.use(express.json()); 


// ==========================================
// Database Connection
// ==========================================
const connectDB = async () => {
  try {
    // process.env.MONGO_URI comes from your .env file
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit the process with failure
  }
};
 
connectDB();


// ==========================================
// Route Imports & Mounting
// ==========================================
const authRoutes = require('./routes/authRoutes');
// const patientRoutes = require('./routes/patientRoutes');

// Tell Express to use these routes
app.use('/api/auth', authRoutes);

// app.use('/api/patients', patientRoutes);

// A simple fallback route to check if the API is running
app.get('/', (req, res) => {
  res.send('MediSense API is running perfectly...');
});


// ===================================== =====
// Start the Server
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});