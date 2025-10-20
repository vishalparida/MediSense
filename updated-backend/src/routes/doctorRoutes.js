import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { listDoctors } from "../controllers/doctorController.js";

const router = Router();
router.use(authenticate);
router.get("/", listDoctors);
export default router;
