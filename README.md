# PDFRetriever Pro: Intelligent Neural Document Interaction
### 🚀 Intel Unnati Project Submission

PDFRetriever Pro is a state-of-the-art document intelligence platform designed to transform static PDFs into interactive, queryable assets. Leveraging **Gemini 2.0 Flash** and **LangChain**, it provides multimodal reasoning, structural data extraction, and a secure multi-user environment.

## ✨ Key Features

-   **Neural Interaction**: Chat with your documents using advanced RAG (Retrieval-Augmented Generation).
-   **Structural Extraction**: Automatically identify and extract tables into queryable JSON/DataFrames.
-   **Multimodal Reasoning**: Support for images and complex layouts within documents.
-   **Secure Authentication**: Multi-user support with encrypted password storage.
-   **Persistent Workspace**: Resumable chat sessions with full document state restoration.
-   **Premium UI**: A modern, glassmorphism-based interface designed for technical professionals.

## 🛠️ Technical Stack

-   **Frontend**: Streamlit (Neural Interaction Hub)
-   **LLM**: Google Gemini 2.0 Flash
-   **Orchestration**: LangChain
-   **Vector Store**: Chroma (Local Neural Retrieval)
-   **Database**: PostgreSQL (Centralized Persistence) with SQLite Fallback
-   **Auth**: Bcrypt-based Secure Authentication

## 🚀 Quick Start

### Option 1: Docker (Recommended for Submission)
The easiest way to run the project with all dependencies (including PostgreSQL):
```bash
docker-compose up --build
```
Access the app at `http://localhost:8501`.

### Option 2: Local Installation (UV)
If you prefer running without Docker:
1.  **Clone & Install**:
    ```bash
    uv sync
    ```
2.  **Configure Environment**:
    Copy `.env.example` to `.env` and add your `GOOGLE_API_KEY`. (PostgreSQL is optional; the app will fallback to SQLite if not configured).
3.  **Run**:
    ```bash
    uv run streamlit run app/streamlit_app.py
    ```

### Option 3: Render (Cloud Deployment)
1.  **Push to GitHub**: Push your project repository to GitHub.
2.  **Deploy Blueprint**:
    - Log in to [Render](https://render.com).
    - Click **New +** > **Blueprint**.
    - Connect your GitHub repository.
3.  **Configure**: Render will automatically detect `render.yaml` and setup both the app and a PostgreSQL database.
4.  **API Key**: In the Render Dashboard, go to your Web Service > **Environment** and add:
    - `GOOGLE_API_KEY`: Your Gemini API Key.

## 📂 Project Structure

-   `app/streamlit_app.py`: Main UI and session management.
-   `app/functions.py`: Core logic for RAG, DB models, and Auth.
-   `db/`: Local storage for SQLite and session data.
-   `Dockerfile` & `docker-compose.yml`: Containerization logic.

## 🤝 Acknowledgments
Submitted as part of the **Intel Unnati Program**. Designed for high-performance document analysis with zero operational cost (utilizing Gemini's developer tier).
