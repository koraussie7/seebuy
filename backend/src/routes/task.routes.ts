import { Router } from "express";
// Update your imports to include the new functions
import {
  createTask,
  getAllTasks,
  getTaskById,
  acceptTask,
  getMyTasks,
  completeTask,
} from "../controllers/task.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/", verifyToken, createTask);
router.get("/", verifyToken, getAllTasks);

// Add the new routes here:
router.get("/my-gigs", verifyToken, getMyTasks);
router.get("/:id", verifyToken, getTaskById);
router.put("/:id/accept", verifyToken, acceptTask);
router.put("/:id/complete", verifyToken, completeTask);

export default router;
