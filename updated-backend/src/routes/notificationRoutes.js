import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { listNotifications } from "../controllers/notificationController.js";

const router = Router();
router.use(authenticate);
router.get("/", listNotifications);
export default router;
