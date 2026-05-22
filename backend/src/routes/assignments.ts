import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import Assignment from '../models/Assignment';
import { generationQueue, redisConnection } from '../jobs/queue';
import { generateQuestionPaper } from '../services/geminiService';
import { getIO } from '../ws/websocketManager';

const router = Router();

// Keep original filename extension for file type detection
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for textbook PDFs
});

const uploadSingleFile = (req: Request, res: Response, next: any) => {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size allowed is 100MB.' });
      }
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: `Unknown upload error: ${err.message}` });
    }
    next();
  });
};

async function getCache(key: string): Promise<string | null> {
  try { return await redisConnection.get(key); } catch { return null; }
}
async function setCache(key: string, val: string, ttl = 60): Promise<void> {
  try { await redisConnection.setex(key, ttl, val); } catch { }
}
async function delCache(pattern: string): Promise<void> {
  try {
    const keys = await redisConnection.keys(pattern);
    if (keys.length) await redisConnection.del(...keys);
  } catch { }
}

/** Run generation directly (no Redis/BullMQ) — supports fallback & RAG */
async function runDirectGeneration(assignmentId: string) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) return;

  const io = getIO();
  if (io) {
    io.to(assignmentId).emit('job:processing', { assignmentId });
  }

  await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });

  try {
    const result = await generateQuestionPaper({
      title: assignment.title,
      subject: assignment.subject,
      grade: assignment.grade,
      dueDate: assignment.dueDate.toISOString(),
      questionTypes: assignment.questionTypes as any,
      additionalInstructions: assignment.additionalInstructions,
      filePath: assignment.fileUrl || undefined,
    });

    await Assignment.findByIdAndUpdate(assignmentId, { status: 'complete', result });

    if (io) {
      io.to(assignmentId).emit('job:complete', { assignmentId, result });
    }
  } catch (err: any) {
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'error', errorMessage: err.message });
    if (io) {
      io.to(assignmentId).emit('job:error', { assignmentId, error: err.message });
    }
    throw err;
  }
}

// GET /api/assignments
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cached = await getCache('assignments:list');
    if (cached) return res.json(JSON.parse(cached));
    const assignments = await Assignment.find().sort({ createdAt: -1 }).lean();
    await setCache('assignments:list', JSON.stringify(assignments), 30);
    res.json(assignments);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/assignments/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cached = await getCache(`assignments:${id}`);
    if (cached) {
      const d = JSON.parse(cached);
      if (d.status === 'complete' || d.status === 'error') return res.json(d);
    }
    const assignment = await Assignment.findById(id).lean();
    if (!assignment) return res.status(404).json({ error: 'Not found' });
    if (assignment.status === 'complete' || assignment.status === 'error') {
      await setCache(`assignments:${id}`, JSON.stringify(assignment), 3600);
    }
    res.json(assignment);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/assignments — create + queue generation
router.post('/', uploadSingleFile, async (req: Request, res: Response) => {
  try {
    const { title, subject, grade, dueDate, questionTypes, additionalInstructions } = req.body;
    if (!title || !subject || !grade || !dueDate) {
      return res.status(400).json({ error: 'title, subject, grade, dueDate are required' });
    }
    const parsedQTypes = typeof questionTypes === 'string' ? JSON.parse(questionTypes) : questionTypes;

    const assignment = new Assignment({
      title, subject, grade,
      dueDate: new Date(dueDate),
      questionTypes: parsedQTypes,
      additionalInstructions: additionalInstructions || '',
      fileUrl: req.file?.path,
      status: 'queued',
    });
    await assignment.save();

    // Try BullMQ first, fall back to in-process
    let queued = false;
    try {
      await generationQueue.add('generate', { assignmentId: assignment._id.toString() });
      queued = true;
    } catch { /* Redis unavailable */ }

    if (!queued) {
      setImmediate(async () => {
        try {
          await runDirectGeneration(assignment._id.toString());
        } catch (err: any) {
          console.error('❌ Direct generation failed:', err.message);
        }
      });
    }

    await delCache('assignments:list');
    res.status(201).json(assignment);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/assignments/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    await delCache(`assignments:${req.params.id}`);
    await delCache('assignments:list');
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/assignments/:id/regenerate
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ error: 'Not found' });

    await Assignment.findByIdAndUpdate(id, { status: 'queued', result: null, errorMessage: null });
    await delCache(`assignments:${id}`);
    await delCache('assignments:list');

    let queued = false;
    try {
      await generationQueue.add('generate', { assignmentId: id });
      queued = true;
    } catch { /* Redis unavailable */ }

    if (!queued) {
      setImmediate(async () => {
        try {
          await runDirectGeneration(id);
        } catch (err: any) {
          console.error('❌ Direct regeneration failed:', err.message);
        }
      });
    }

    res.json({ success: true, message: 'Regeneration started' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
