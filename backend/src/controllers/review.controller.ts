// backend/src/controllers/review.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params as { taskId: string };
    const { rating, comment } = req.body;
    const authorId = req.user?.userId;

    if (!authorId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    // Verify the task exists and is COMPLETED
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { client: true, provider: true },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (task.status !== 'COMPLETED') {
      res.status(400).json({ error: 'Can only review completed tasks' });
      return;
    }

    // Only client or provider can review
    if (authorId !== task.clientId && authorId !== task.providerId) {
      res.status(403).json({ error: 'You are not part of this task' });
      return;
    }

    // Determine who is being reviewed
    const subjectId = authorId === task.clientId ? task.providerId! : task.clientId;

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        taskId,
        authorId,
        subjectId,
      },
      include: {
        author: { select: { firstName: true, lastName: true } },
        subject: { select: { firstName: true, lastName: true } },
      },
    });

    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Review already exists for this task' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

export const getTaskReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params as { taskId: string };

    const review = await prisma.review.findUnique({
      where: { taskId },
      include: {
        author: { select: { firstName: true, lastName: true } },
        subject: { select: { firstName: true, lastName: true } },
      },
    });

    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    res.status(200).json({ review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
};

export const getUserReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };

    const reviews = await prisma.review.findMany({
      where: { subjectId: userId },
      include: {
        author: { select: { firstName: true, lastName: true } },
        task: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({ reviews, avgRating, count: reviews.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
};