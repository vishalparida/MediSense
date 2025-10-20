import { Router } from "express";
import Joi from "joi";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  listPatients,
  createPatient,
  getPatient,
  updatePatient,
  assignDoctor,
  regenerateReport,
  updateStatus,
} from "../controllers/patientController.js";

const router = Router();

const createSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().required(),
  gender: Joi.string().valid("Male", "Female", "Other").required(),
  phone: Joi.string().required(),
  village: Joi.string().allow("", null),
  district: Joi.string().allow("", null),
  state: Joi.string().allow("", null),
  symptoms: Joi.string().required(),
  medicalHistory: Joi.string().allow("", null),
  images: Joi.array().items(Joi.string().uri()).default([]),
  priority: Joi.string().valid("High", "Medium", "Low").default("Medium"),
});

const updateSchema = createSchema.fork(
  ["name", "age", "gender", "phone", "symptoms"],
  (schema) => schema.optional()
);

const assignSchema = Joi.object({
  doctorId: Joi.string().required(),
});

const statusSchema = Joi.object({
  status: Joi.string()
    .valid("awaiting_doctor", "video_scheduled", "completed")
    .required(),
});

router.use(authenticate);

router.get("/", listPatients);
router.post(
  "/",
  authorize("facilitator", "admin"),
  validate(createSchema),
  createPatient
);
router.get("/:id", getPatient);
router.patch("/:id", validate(updateSchema), updatePatient);
router.post(
  "/:id/assign-doctor",
  authorize("facilitator", "admin"),
  validate(assignSchema),
  assignDoctor
);
router.post("/:id/regenerate-report", regenerateReport);
router.post("/:id/status", validate(statusSchema), updateStatus);

export default router;
