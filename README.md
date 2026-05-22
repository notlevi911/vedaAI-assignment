# VedaAI: Assessment Creator

VedaAI is a full-stack application that helps educators create pedagogically aligned question papers and exam booklets from their documents. It uses hybrid vector and semantic retrieval pipelines powered by Gemini 2.5 Flash, Next.js, and Socket.io.

## Architecture Highlights

We designed VedaAI to be reliable under heavy load and network volatility. Here is how it works under the hood:

1. **Hybrid Retrieval Pipeline**: 
   * Primary Stage: We use semantic vector retrieval powered by the Gemini embedding model.
   * Local Failover: If the Gemini API key is missing, the system automatically falls back to local Ollama.
   * Zero Dependencies Failover: If all embedding services are unavailable, the system uses a BM25 inspired keyword saturation method to continue generating questions with exact match heuristics.

2. **Rate Limit Defenses**:
   * If the API returns a rate limit error, the backend pauses and waits exactly 12 seconds before retrying.
   * The system groups up to 80 text chunks into a single request, which drastically reduces API calls and helps avoid free tier limits.

3. **PDF Generation**:
   * The system generates multiple choice options and renders them in a standard A4 layout. It prints them cleanly to PDF format.

## Technology Stack

* **Frontend**: Next.js and Tailwind CSS for the user interface.
* **State Management**: Zustand for managing application state.
* **Real Time Updates**: Socket.io for bidirectional communication.
* **PDF Processing**: jsPDF and html2canvas for converting the DOM to PDF.
* **Backend**: Express and TypeScript.
* **Database**: MongoDB with Mongoose for storage.
* **Job Queue**: BullMQ and Redis for background processing.
* **AI Generation**: Gemini 2.5 Flash for language modeling and Gemini Embedding for vectors.

## Environment Variables

### Backend Configuration (backend/.env)

* `PORT`: The port for the Express server (default is 4000).
* `MONGODB_URI`: Your MongoDB connection string.
* `REDIS_HOST`: The host address of your Redis server.
* `REDIS_PORT`: The port of your Redis server.
* `GEMINI_API_KEY`: Your Google Gemini API key. Required for cloud usage.
* `FRONTEND_URL`: The origin URL used for CORS configuration.

### Frontend Configuration (frontend/.env.local)

* `NEXT_PUBLIC_BACKEND_URL`: The address of your backend Express API server.

## Development Setup

First, make sure Docker is running, then launch Redis and MongoDB:

```bash
docker compose up -d
```

Next, configure and start the backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Finally, start the frontend:

```bash
cd ../frontend
npm install
npm run dev
```

You can now open http://localhost:3000 in your browser to begin creating question papers.

## Cloud Deployment Guide

Deploying the stack is straightforward when using managed cloud databases.

### Setting Up MongoDB Atlas

1. Log in to MongoDB Atlas and create a Free Shared Cluster.
2. Under Database Access, create a user with read and write privileges.
3. Under Network Access, whitelist your deployment IP address.
4. Copy your connection string to use as your MONGODB_URI.

### Setting Up Upstash Redis

Since serverless functions require HTTP or TCP connections, we recommend Upstash for Redis.

1. Log in to Upstash and create a new Serverless Redis Database.
2. Copy the TCP Endpoint to use for your Redis configuration.

### Deploying the Backend on Render

We recommend deploying the backend on Render to support persistent WebSockets and background processing. 

1. Create a new Web Service on Render and connect your GitHub repository.
2. Set the build command to `npm install && npm run build` and the start command to `npm start`.
3. Add your environment variables in the Render dashboard, including MONGODB_URI, REDIS_URL, GEMINI_API_KEY, and FRONTEND_URL.
4. Once deployed, Render will provide a URL for your backend. Note that Render's free tier spins down after 15 minutes of inactivity. You can use a ping service like UptimeRobot to hit the `/api/health` endpoint every 5 minutes to keep it awake.

### Deploying the Frontend on Vercel

1. Import your frontend folder into a new Vercel project.
2. Add the NEXT_PUBLIC_BACKEND_URL environment variable, pointing it to your Render backend URL.
3. Deploy the project.

## API Reference

* `GET /api/assignments`: Fetches a list of all assignments.
* `POST /api/assignments`: Uploads files and queues a question paper generation.
* `GET /api/assignments/:id`: Returns the status and result of a specific paper.
* `DELETE /api/assignments/:id`: Deletes an assignment.
* `POST /api/assignments/:id/regenerate`: Triggers a regeneration of the questions.
* `GET /api/health`: A lightweight health check endpoint for the service.

Made with love for teachers and educators.
