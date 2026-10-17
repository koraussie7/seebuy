// backend/src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.routes'; 
import taskRoutes from './routes/task.routes';
import userRoutes from './routes/user.routes';
import reviewRoutes from './routes/review.routes';
import { connectRedis } from './services/redis.service';
import { createServer } from 'http';
import { initSocketServer } from './services/socket.service'
const app = express();
const PORT = process.env.PORT || 4000;

const httpServer = createServer(app);

const corsOptions = {
  origin: ['https://golive.wiki', 'https://www.golive.wiki', 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json()); 

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Gig Marketplace API is running!' });
});

// Initialize Socket.io with the HTTP server
initSocketServer(httpServer);

// Use httpServer.listen instead of app.listen
connectRedis().then(() => {
  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}).catch(console.error);