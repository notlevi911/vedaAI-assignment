# 🔮 VedaAI — Enterprise AI Assessment Creator

> A production-grade, highly resilient full-stack application that constructs pedagogically aligned question papers and exam booklets from documents using hybrid vector-semantic RAG pipelines. Powered by Gemini 2.5 Flash, Next.js 14/15, and Socket.io.

---

## 🚀 Key Highlights & Resilient Architecture

VedaAI is designed to run reliably under heavy enterprise load, rate limits, and network volatility:

1. **Smart Hybrid RAG Pipeline**:
   - **Stage 1 (Primary)**: Semantic vector retrieval powered by `gemini-embedding-2` via the new `@google/genai` SDK.
   - **Stage 2 (Local Failover)**: Automatic fallback to local Ollama (`nomic-embed-text`) if the Gemini API key is missing.
   - **Stage 3 (Zero-Dependencies Failover)**: Advanced BM25-inspired keyword saturation retrieval. If all embedding services are down/unavailable, the system continues generating with exact-match and TF-IDF semantic heuristics.
2. **Rate Limit Defenses (429 & 503 Backoff)**:
   - Intelligent backoff parsing: If the API returns a rate-limit error (`429 / RESOURCE_EXHAUSTED`), the backend pauses and waits exactly **12 seconds** before retrying.
   - True API Batching: Groups up to **80 text chunks** into a single request, reducing API calls by over **95%** and avoiding Free Tier rate limits.
3. **Strict API Routing Rules**:
   - If a `GEMINI_API_KEY` is present in the environment, the system will **never** trigger Ollama (avoiding local host resources/throttling). Ollama triggers *if and only if* no Gemini key is present in your environment.
4. **Rich MCQ Rendering & PDF Generation**:
   - Generates and stores multiple-choice options in a dedicated database schema.
   - Renders them in a gorgeous, standard A4 style layout with auto-lettering (`A.`, `B.`, `C.`, `D.`) and prints them perfectly to PDFs.

---

## 🏗️ System Blueprint

```
                     ┌──────────────────────────────────────────────────────┐
                     │                   Next.js Frontend                   │
                     │  Dashboard → Create → Assignment View (ExamPaper)    │
                     │  Zustand store │ Socket.io client │ REST API calls   │
                     └─────────────────────────┬────────────────────────────┘
                                               │ HTTP + WebSocket
                                               │ (Real-time updates)
                     ┌─────────────────────────▼────────────────────────────┐
                     │               Express Backend (TypeScript)           │
                     │  REST Routes → BullMQ Queue → Gemini 2.5 Flash       │
                     │  MongoDB (results) │ Redis (cache+jobs) │ Socket.io  │
                     └──────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack & Dependencies

| Component | Technology | Description |
|---|---|---|
| **Frontend** | Next.js 14/15, Tailwind CSS | React framework with custom styling system |
| **State** | Zustand | Single-source state store |
| **Real-time** | Socket.io | Bidirectional server-client updates |
| **PDF Processing** | jsPDF + html2canvas | Full-fidelity DOM-to-A4 conversion |
| **Backend** | Express + TypeScript | Type-safe REST server |
| **Database** | MongoDB (Mongoose) | Schema-validated persistent document storage |
| **Job Queue** | BullMQ + Redis | Background processing worker |
| **AI Generation** | Gemini 2.5 Flash | SOTA fast cloud LLM |
| **Embeddings** | Gemini Embedding 2 | Next-gen semantic vector generator |

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | Port for the Express server to listen on. |
| `MONGODB_URI` | `mongodb://localhost:27017/vedaai` | Connection string for MongoDB database. |
| `REDIS_HOST` | `localhost` | Host address of your Redis server. |
| `REDIS_PORT` | `6379` | Port of your Redis server. |
| `GEMINI_API_KEY` | — | **Required (for cloud usage)**: Google Gemini API key. |
| `FRONTEND_URL` | `http://localhost:3000` | Origin URL used for CORS configuration. |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` | Address of the VedaAI Express API server. |

---

## 🏁 Development Setup

### 1. Launch Services (Docker)
Ensure Docker is running and launch Redis and MongoDB:
```bash
docker compose up -d
```

### 2. Configure & Start Backend
```bash
cd backend
npm install
# Configure your env values
cp .env.example .env
npm run dev
```

### 3. Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to begin generating question papers!

---

## 🌍 Vercel & Production Cloud Deployment

Deploying the stack is simple when connecting to managed cloud databases:

### Step 1: Set Up MongoDB Atlas (Database)
1. Sign up/Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **Free Shared Cluster**.
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, whitelist your Vercel deployment IP address (or `0.0.0.0/0` to allow all deployment networks).
5. Copy your connection string: `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/vedaai?retryWrites=true&w=majority`.

### Step 2: Set Up Upstash Redis (Queue Cache)
Because Vercel uses serverless functions, you need a Redis host that connects over HTTP or TCP.
1. Sign up/Log in to [Upstash](https://upstash.com/).
2. Create a new **Serverless Redis Database**.
3. Copy the TCP Endpoint (e.g. `rediss://default:xxxx@xxxx.upstash.io:6379`).

### Step 3: Deploy Backend on Vercel
Vercel supports Express backends by utilizing serverless functions (`vercel.json`).
1. Create a `vercel.json` file inside your `backend/` directory:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/index.js"
       }
     ]
   }
   ```
2. Run `vercel` (via Vercel CLI) inside the `backend` folder, or import the backend repository on the Vercel dashboard.
3. Configure the **Environment Variables** in Vercel:
   - `MONGODB_URI`: *Your MongoDB Atlas connection URL*
   - `REDIS_HOST` & `REDIS_PORT`: *Your Upstash Redis connection details*
   - `GEMINI_API_KEY`: *Your Google Gemini API key*
   - `FRONTEND_URL`: *Your Vercel Frontend URL*

### Step 4: Deploy Frontend on Vercel
1. Import the `frontend` folder into Vercel.
2. Configure **Environment Variables**:
   - `NEXT_PUBLIC_BACKEND_URL`: *Your Vercel Backend Deploy URL*
3. Deploy!

---

## 📝 API Reference

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/assignments` | Fetches list of all assignments. |
| `POST` | `/api/assignments` | Uploads files and queues question paper generation. |
| `GET` | `/api/assignments/:id` | Returns status/result of a specific paper. |
| `DELETE` | `/api/assignments/:id` | Deletes an assignment. |
| `POST` | `/api/assignments/:id/regenerate` | Triggers regeneration of questions. |
| `GET` | `/api/health` | Service status health check. |

---

*Made with 🧡 for teachers and educators.*
