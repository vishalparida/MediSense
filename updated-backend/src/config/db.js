// Importing the Mongoose library
import mongoose from "mongoose";

// Importing the environment variables using the dotenv library
import dotenv from "dotenv";
dotenv.config();

// Defining a function to connect to the database
const connectDB = () => {
	// Connecting to the database using the provided URL from the environment variables
	mongoose
		.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		// If the connection is successful, log a success message
		.then(() => console.log("DB CONNECTION SUCCESS"))
		// If there are issues connecting to the database, log an error message and exit the process
		.catch((err) => {
			console.log(`DB CONNECTION ISSUES`);
			console.error(err.message);
			process.exit(1);
		});
};

// Exporting the dbConnect function for use in other files
// module.exports = connectDB;
export default connectDB;
