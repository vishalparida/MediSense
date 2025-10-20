import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { config } from "./config/env.js";

async function run() {
  await connectDB();
  const adminEmail = "admin@medisense.local";
  const doctorEmail = "doctor@medisense.local";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: "AdminPass123",
      role: "admin",
    });
    console.log("Created admin user:", adminEmail);
  } else {
    console.log("Admin exists, skipping");
  }
  const existingDoctor = await User.findOne({ email: doctorEmail });
  if (!existingDoctor) {
    await User.create({
      name: "Dr. Demo",
      email: doctorEmail,
      password: "DoctorPass123",
      role: "doctor",
      specialty: "General Medicine",
      experience: "5 yrs",
      location: "Remote",
    });
    console.log("Created doctor user:", doctorEmail);
  } else {
    console.log("Doctor exists, skipping");
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
