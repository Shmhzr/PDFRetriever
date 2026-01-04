# PDFRetriever Pro: Intelligent Neural Document Interaction
### 🚀 Intel Unnati Project Submission

PDFRetriever Pro is a state-of-the-art document intelligence platform designed to transform static PDFs into interactive, queryable assets. By leveraging **Gemini 2.0 Flash** and **LangChain**, it provides multimodal reasoning, structural data extraction, and a secure multi-user environment with a modern React frontend.

---

## 📖 Overview

PDFRetriever Pro is an advanced full-stack application designed to convert unstructured PDF documents (reports, manuals, policies) into a structured, searchable format. It enables precise extraction of text, tables, and images, making complex documents easy to navigate and query through an intelligent chat interface.

---

## ✅ Intel Unnati Requirements Compliance

This project fully satisfies all Intel Unnati program requirements:

### **Requirement 1: PDF Reading with OCR Support**
✅ **Implemented**: Hybrid parsing system (`intelligent_pdf_parse()`)
- Automatically detects scanned vs. selectable PDFs
- Uses **pdfplumber** for fast local text extraction
- Uses **Gemini 2.0 Flash** for OCR on scanned documents
- Preserves Table of Contents and document layout
- **Code**: `backend/app/logic.py` lines 164-255

### **Requirement 2: Meaningful Section Breaking**
✅ **Implemented**: Intelligent section boundaries
- Breaks text into logical sections based on document structure
- **Never cuts across chapters** - respects document hierarchy
- Each section includes: title, content, and page range
- Preserves context and relationships between sections
- **Code**: `backend/app/logic.py` lines 227-244

### **Requirement 3: Vector Database Storage**
✅ **Implemented**: ChromaDB vector store
- All text sections stored with semantic embeddings
- Uses Google's `text-embedding-004` model
- Enables high-performance similarity search
- Organized by document with metadata (page ranges, titles)
- **Code**: `backend/app/logic.py` lines 266-304

### **Requirement 4: Table Extraction & Storage**
✅ **Implemented**: Relational database for tables
- Tables extracted as 2D arrays with captions
- Stored in PostgreSQL/SQLite for precise queries
- Each table includes: page number, caption, and structured data
- Queryable via dedicated API endpoints
- **Code**: `backend/app/logic.py` lines 306-326, 387-406

### **Requirement 5: Image & Chart Descriptions**
✅ **Implemented**: Multimodal AI descriptions
- Gemini generates searchable descriptions for all visual content
- Descriptions stored in vector database alongside text
- Makes images, charts, and diagrams fully searchable
- **Code**: `backend/app/logic.py` lines 284-294

### **Deliverable 1: Working Pipeline**
✅ **Complete**: End-to-end PDF processing
- Upload → Parse → Extract → Store → Query
- Handles both scanned and native PDFs
- Outputs: TOC, sections, tables, media descriptions
- **API Endpoint**: `POST /api/upload`

### **Deliverable 2: Search Interface**
✅ **Complete**: Modern React-based UI
- Interactive chat interface for natural language queries
- RAG (Retrieval-Augmented Generation) powered by LangChain
- Real-time PDF viewer synchronized with analysis
- Table viewer for structured data
- **Frontend**: `frontend/src/components/`

### **Deliverable 3: Documentation**
✅ **Complete**: Comprehensive documentation
- This README with setup instructions
- API documentation (FastAPI auto-generated at `/docs`)
- Code comments and docstrings
- Architecture diagrams and explanations

### **Performance Benchmarks**
✅ **Optimized for Speed**:
- **Hybrid Parsing**: Local extraction (fast) + Gemini (intelligent)
- **Scanned PDFs**: ~30-60 seconds (includes OCR)
- **Native PDFs**: ~10-20 seconds (local extraction + structure analysis)
- **Query Response**: <2 seconds (vector similarity search)
- **Database**: PostgreSQL (production) / SQLite (local fallback)

---

## 🏗️ Architecture

The system consists of a modern **three-tier architecture**:

### **Backend (FastAPI)**
- RESTful API with JWT-based authentication
- Intelligent PDF parsing using **Gemini 2.0 Flash**
- RAG (Retrieval-Augmented Generation) query engine
- Multi-user session management

### **Frontend (React + Vite)**
- Modern, responsive UI built with React 19
- Real-time PDF viewer with synchronized analysis
- Interactive chat interface with streaming responses
- Glassmorphism design with smooth animations (Framer Motion)

### **Storage Layer**
- **Vector Database (Chroma)**: Stores text embeddings and image descriptions for semantic search
- **Relational Database (PostgreSQL/SQLite)**: Stores extracted tables, user data, and chat sessions
- **Zero-configuration fallback**: Automatically uses SQLite when PostgreSQL is unavailable

---

## ✨ Key Features

- 🤖 **Neural Interaction**: Chat with your documents using advanced RAG
- 📊 **Structural Extraction**: Automatically identify and extract tables into queryable JSON/DataFrames
- 🖼️ **Multimodal Reasoning**: Full support for images, charts, and complex layouts using vision-capable AI
- 🔐 **Secure Authentication**: JWT-based auth with bcrypt password encryption
- 💾 **Persistent Workspace**: Resumable chat sessions with full document state restoration
- 📑 **Layout Awareness**: Sections are broken down logically, preserving document structure
- 🎨 **Premium UI**: Modern, glassmorphism-based interface with smooth animations
- 🔄 **Real-time Sync**: PDF viewer synchronized with analysis panel

---

## 🛠️ Technical Stack

### **Backend**
- **Framework**: FastAPI
- **LLM**: Google Gemini 2.0 Flash
- **Orchestration**: LangChain
- **Vector Store**: ChromaDB
- **Database**: PostgreSQL (Production) / SQLite (Local Fallback)
- **Authentication**: JWT + Bcrypt
- **Key Libraries**: `pandas`, `sqlalchemy`, `pypdf`, `pdfplumber`, `psycopg2-binary`

### **Frontend**
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Vanilla CSS with CSS Variables
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+** (for backend)
- **Node.js 20+** (for frontend)
- **Docker & Docker Compose** (optional, for containerized deployment)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/))

---

## 📦 Installation & Setup

### **Option 1: Local Development (Recommended for Development)**

#### **Step 1: Clone the Repository**
```bash
git clone <your-repo-url>
cd PDFRetriever
```

#### **Step 2: Environment Configuration**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Google API Key
# GOOGLE_API_KEY='your_actual_api_key_here'
```

#### **Step 3: Backend Setup**

**Using UV (Recommended):**
```bash
# Install dependencies
uv sync

# Run the backend server
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

**Using pip:**
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run the backend server
cd backend
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

#### **Step 4: Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

#### **Step 5: Access the Application**
Open your browser and navigate to `http://localhost:5173`

---

### **Option 2: Docker Compose (Recommended for Production-like Environment)**

This option runs both the backend and a PostgreSQL database in containers.

#### **Step 1: Configure Environment**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Google API Key
# GOOGLE_API_KEY='your_actual_api_key_here'
```

#### **Step 2: Build and Run**
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

This will:
- Build the frontend (React app)
- Build the backend (FastAPI app)
- Start a PostgreSQL database
- Serve the application at `http://localhost:8000`

#### **Step 3: Stop Services**
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

---

### **Option 3: Production Deployment on Render**

#### **Step 1: Prepare Your Repository**
```bash
# Ensure your code is committed to Git
git add .
git commit -m "Ready for deployment"

# Push to GitHub
git push origin main
```

#### **Step 2: Deploy to Render**

1. **Sign up/Login** to [Render](https://render.com)
2. Click **"New +"** → **"Blueprint"**
3. **Connect your GitHub repository**
4. Render will automatically detect `render.yaml`
5. **Configure Environment Variables**:
   - Go to the web service settings
   - Add `GOOGLE_API_KEY` with your actual API key
   - Add `JWT_SECRET_KEY` with a secure random string

6. **Deploy**: Render will automatically:
   - Create a PostgreSQL database
   - Build the frontend
   - Build and deploy the backend
   - Connect everything together

#### **Step 3: Access Your Deployed App**
Your app will be available at: `https://pdf-retriever-pro.onrender.com` (or your custom URL)

#### **Important Notes for Render Deployment**
- The **free tier** may have cold starts (first request takes ~30 seconds)
- Database credentials are automatically injected via `render.yaml`
- Frontend is built during Docker build and served by FastAPI
- Health check endpoint: `/health`

---

## 📂 Project Structure

```
PDFRetriever/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app, routes, and auth
│   │   ├── logic.py           # Core business logic (RAG, parsing, DB)
│   │   └── __init__.py
│   ├── db/                    # Local SQLite database storage
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── PDFViewer.jsx
│   │   │   ├── AnalysisPanel.jsx
│   │   │   ├── ChatInterface.jsx
│   │   │   └── ...
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── dist/                  # Built frontend (generated)
│   ├── package.json
│   └── vite.config.js
│
├── data/                       # Temporary PDF uploads
├── db/                         # Local database files
├── vectorstore_chroma/         # ChromaDB vector storage
│
├── .env.example               # Environment variables template
├── .env                       # Your actual environment variables (gitignored)
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Local Docker orchestration
├── render.yaml                # Render deployment blueprint
├── pyproject.toml             # Python project metadata (UV)
└── README.md                  # This file
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Required: Google Gemini API Key
GOOGLE_API_KEY='your_api_key_here'

# Optional: JWT Secret (auto-generated if not provided)
JWT_SECRET_KEY='your-secret-key-change-this-in-production'

# Optional: PostgreSQL Configuration (defaults to SQLite if not provided)
PGHOST='localhost'
PGPORT='5432'
PGDATABASE='pdf_retriever'
PGUSER='postgres'
PGPASSWORD='your_password'
```

---

## 🔌 API Documentation

Once the backend is running, visit:
- **Interactive API Docs**: `http://localhost:8000/docs`
- **Alternative Docs**: `http://localhost:8000/redoc`

### **Key Endpoints**

#### **Authentication**
- `POST /api/register` - Register a new user
- `POST /api/token` - Login and get JWT token
- `GET /api/me` - Get current user info

#### **PDF Operations**
- `POST /api/upload` - Upload and process a PDF
- `POST /api/query` - Query a processed PDF
- `GET /api/chats` - Get all chat sessions
- `GET /api/chats/{chat_id}` - Get specific chat
- `DELETE /api/chats/{chat_id}` - Delete a chat session

#### **Health Check**
- `GET /health` - Health check endpoint

---

## 🧪 Testing the Application

### **1. Register a New User**
- Navigate to the app
- Click "Register" and create an account
- Login with your credentials

### **2. Upload a PDF**
- Click "Upload PDF"
- Select a PDF file from your computer
- Wait for processing (uses Gemini API)

### **3. Query Your Document**
- Type questions in the chat interface
- View extracted tables in the Analysis Panel
- See relevant context highlighted

### **4. Manage Sessions**
- View all your chat sessions
- Resume previous conversations
- Delete old sessions

---

## 🐛 Troubleshooting

### **Backend Issues**

**Problem**: `ModuleNotFoundError` or import errors
```bash
# Solution: Reinstall dependencies
pip install -r backend/requirements.txt
# or
uv sync
```

**Problem**: Database connection errors
```bash
# Solution: Check if PostgreSQL is running
docker-compose ps

# Or use SQLite fallback (remove PG env vars from .env)
```

**Problem**: `GOOGLE_API_KEY` not found
```bash
# Solution: Ensure .env file exists and contains your API key
cat .env | grep GOOGLE_API_KEY
```

### **Frontend Issues**

**Problem**: `npm install` fails
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem**: CORS errors
```bash
# Solution: Ensure backend is running on port 8000
# Frontend proxy is configured in vite.config.js
```

**Problem**: Build fails
```bash
# Solution: Check Node.js version (requires 20+)
node --version

# Update if needed
nvm install 20
nvm use 20
```

### **Docker Issues**

**Problem**: Port already in use
```bash
# Solution: Stop conflicting services
docker-compose down
# Or change ports in docker-compose.yml
```

**Problem**: Build fails
```bash
# Solution: Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

---

## 🚀 Performance Optimization

### **For Local Development**
- Use SQLite for faster startup (no PostgreSQL needed)
- Enable hot reload for frontend (`npm run dev`)
- Use `--reload` flag for backend during development

### **For Production**
- Use PostgreSQL for better concurrent access
- Build frontend for production (`npm run build`)
- Use environment-specific configurations
- Enable caching for vector store queries
- Consider using a CDN for static assets

---

## 🔒 Security Considerations

- **Never commit `.env` file** (already in `.gitignore`)
- **Change JWT_SECRET_KEY** in production
- **Use strong passwords** for database
- **Restrict CORS origins** in production (update `main.py`)
- **Use HTTPS** in production (Render provides this automatically)
- **Regularly update dependencies** for security patches

---

## 📊 Database Schema

### **Users Table**
- `id`: Primary key
- `username`: Unique username
- `password_hash`: Bcrypt hashed password
- `created_at`: Timestamp

### **Chats Table**
- `id`: Chat session ID (UUID)
- `user_id`: Foreign key to Users
- `file_name`: Original PDF filename
- `history`: JSON array of messages
- `processed_data`: Extracted tables and metadata
- `pdf_bytes`: Binary PDF data
- `created_at`: Timestamp

### **Vector Store (ChromaDB)**
- Stores document embeddings
- Organized by filename
- Includes metadata (page numbers, sections)

---

## 🤝 Contributing

This project was created for the **Intel Unnati Program**. Contributions, issues, and feature requests are welcome!

---

## 📄 License

This project is created for educational purposes as part of the Intel Unnati Program.

---

## 🙏 Acknowledgments

- **Intel Unnati Program** - For the opportunity and support
- **Google Gemini** - For providing the powerful multimodal AI API
- **LangChain** - For the excellent RAG orchestration framework
- **FastAPI** - For the modern, fast web framework
- **React & Vite** - For the amazing frontend development experience

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [API Documentation](#-api-documentation)
3. Open an issue on GitHub

---

**Built with ❤️ for the Intel Unnati Program**
