// backend/src/routes/review.routes.ts
import { Router } from 'express';
import { createReview, getTaskReview, getUserReviews } from '../controllers/review.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// POST /api/reviews/:taskId - Create a review for a completed task
router.post('/:taskId', verifyToken, createReview);

// GET /api/reviews/task/:taskId - Get review for a specific task
router.get('/task/:taskId', getTaskReview);

// GET /api/reviews/user/:userId - Get all reviews for a user
router.get('/user/:userId', getUserReviews);

export default router;