import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initWebSocket } from './ws/websocketManager';
import { initWorker } from './jobs/generationWorker';
import assignmentRoutes from './routes/assignments';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigin = rawFrontendUrl.replace(/\/$/, '');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Allow matching stripped origin, localhost, or any vercel subdomain
    if (
      origin === allowedOrigin || 
      origin === 'http://localhost:3000' || 
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/assignments', assignmentRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.head('/api/health', (_, res) => res.status(200).end());

const io = initWebSocket(httpServer);
initWorker(io);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';
const PORT = parseInt(process.env.PORT || '4000');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    httpServer.listen(PORT, () => {
      console.log(`🚀 VedaAI Backend running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Starting without MongoDB (limited functionality)');
    httpServer.listen(PORT, () => {
      console.log(`🚀 VedaAI Backend running on http://localhost:${PORT}`);
    });
  });
