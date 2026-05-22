import { Worker, Job } from 'bullmq';
import { Server } from 'socket.io';
import { redisConnection } from './queue';
import { generateQuestionPaper, GenerationInput } from '../services/geminiService';
import Assignment from '../models/Assignment';

export interface GenerationJobData {
  assignmentId: string;
}

export function initWorker(io: Server) {
  let worker: Worker | null = null;

  try {
    worker = new Worker<GenerationJobData>(
      'ai-generation',
      async (job: Job<GenerationJobData>) => {
        const { assignmentId } = job.data;

        io.to(assignmentId).emit('job:processing', { assignmentId });
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) throw new Error('Assignment not found');

        const input: GenerationInput = {
          title: assignment.title,
          subject: assignment.subject,
          grade: assignment.grade,
          dueDate: assignment.dueDate.toISOString(),
          questionTypes: assignment.questionTypes as any,
          additionalInstructions: assignment.additionalInstructions,
          filePath: assignment.fileUrl || undefined, // pass filePath directly for RAG processing
        };

        const result = await generateQuestionPaper(input);

        await Assignment.findByIdAndUpdate(assignmentId, { status: 'complete', result });
        io.to(assignmentId).emit('job:complete', { assignmentId, result });
        return result;
      },
      { connection: redisConnection }
    );

    worker.on('failed', async (job, err) => {
      if (job) {
        const { assignmentId } = job.data;
        await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'error',
          errorMessage: err.message,
        });
        io.to(assignmentId).emit('job:error', { assignmentId, error: err.message });
      }
      console.error('❌ Job failed:', err.message);
    });

    console.log('✅ BullMQ Worker initialized');
  } catch (err: any) {
    console.warn('⚠️  BullMQ Worker not started (Redis unavailable):', err.message);
  }

  return worker;
}
