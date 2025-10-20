import { Router } from "express";
import Joi from "joi";
import { register, login, me } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("admin", "doctor", "facilitator"),
  specialty: Joi.string().allow("", null),
  experience: Joi.string().allow("", null),
  location: Joi.string().allow("", null),
  avatar: Joi.string().uri().allow("", null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, me);

export default router;
