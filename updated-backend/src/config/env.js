import dotenv from "dotenv";
import Joi from "joi";
import path from "path";
import { fileURLToPath } from "url";

// Ensure .env is loaded relative to project root (updated-backend/.env) even if process.cwd() differs
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../../.env");
dotenv.config({ path: envPath });
// Fallback attempt (in case .env not found yet) will have already been performed by dotenv

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().default(5000),
  // MONGODB_URI is intentionally NOT validated here anymore (user requested removal of Joi check)
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default("7d"),
  CORS_ORIGINS: Joi.string().default("http://localhost:3000"),
}).unknown();

const { value: env, error } = envSchema.validate(process.env);
if (error) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment configuration:");
  // Provide more actionable feedback, especially for Mongo URI issues
  error.details.forEach((d) => {
    console.error(` - ${d.message}`);
  });
  process.exit(1);
}

// Use raw environment variable for Mongo URI (no Joi validation)
const rawMongoUri = process.env.MONGODB_URI;
if (!rawMongoUri) {
  // eslint-disable-next-line no-console
  console.warn(
    "⚠️  MONGODB_URI is not set. The application will start but DB operations will fail."
  );
}

export const config = {
  env: env.NODE_ENV,
  isDev: env.NODE_ENV === "development",
  port: env.PORT,
  mongoUri: rawMongoUri,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  cors: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
};
