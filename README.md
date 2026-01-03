# PDFRetriever Pro: Intelligent Neural Document Interaction
### 🚀 Intel Unnati Project Submission

PDFRetriever Pro is a state-of-the-art document intelligence platform designed to transform static PDFs into interactive, queryable assets. By leveraging **Gemini 2.0 Flash** and **LangChain**, it provides multimodal reasoning, structural data extraction, and a secure multi-user environment.

## 📖 Overview
PDFRetriever Pro is an advanced tool designed to convert unstructured PDF documents (reports, manuals, policies) into a structured, searchable format. It enables precise extraction of text, tables, and images, making complex documents easy to navigate and query.

## 🏗️ Architecture
The system consists of three main components:
1.  **Ingestion Pipeline**: Uses **Gemini 2.0 Flash** to process PDFs. It handles OCR, follows document layout, and preserves the logical structure of the document.
2.  **Storage Layer**:
    *   **Vector Database (Chroma)**: Stores text sections and image descriptions for high-performance neural retrieval.
    *   **Relational Database (PostgreSQL/SQLite)**: Stores extracted tables and user session data. Features a zero-configuration SQLite fallback for easy local testing.
3.  **Search Interface**: A premium Streamlit dashboard featuring a chat-based RAG (Retrieval-Augmented Generation) system and dedicated modules for structural and multimodal analysis.

## ✨ Key Features

-   **Neural Interaction**: Chat with your documents using advanced RAG.
-   **Structural extraction**: Automatically identify and extract tables into queryable JSON/DataFrames.
-   **Multimodal Reasoning**: Full support for images, charts, and complex layouts using vision-capable AI.
-   **Secure Authentication**: Multi-user support with `bcrypt` encrypted password storage.
-   **Persistent Workspace**: Resumable chat sessions with full document state restoration.
-   **Layout Awareness**: Sections are broken down logically, preserving the context of chapters and sub-sections.
-   **Premium UI**: A modern, glassmorphism-based interface designed for a professional user experience.

## 🛠️ Technical Stack

-   **Frontend**: Streamlit
-   **LLM**: Google Gemini 2.0 Flash
-   **Orchestration**: LangChain
-   **Vector Store**: Chroma
-   **Database**: PostgreSQL (Production) / SQLite (Local Fallback)
-   **Authentication**: Bcrypt
-   **Key Libraries**: `pandas`, `sqlalchemy`, `pypdf`, `pdfplumber`, `psycopg2-binary`.

## 🚀 Quick Start

### Option 1: Docker (Recommended for Submission)
The easiest way to run the project with all dependencies and a managed database:
```bash
docker-compose up --build
```
Access the app at `http://localhost:8501`.

### Option 2: Local Installation (UV)
1.  **Clone & Install**:
    ```bash
    uv sync
    ```
2.  **Configure Environment**:
    Copy `.env.example` to `.env` and add your `GOOGLE_API_KEY`.
3.  **Run**:
    ```bash
    uv run streamlit run app/streamlit_app.py
    ```

### Option 3: Render (Cloud Deployment)
1.  **Push to GitHub**: Push your project repository to GitHub.
2.  **Deploy Blueprint**: Connect your repository to [Render](https://render.com) using the "Blueprint" option.
3.  **Configure**: Render will automatically detect `render.yaml` and provision the app and database.

## 📂 Project Structure

-   `app/streamlit_app.py`: Main UI and session management.
-   `app/functions.py`: Core logic for RAG, DB models, and Auth.
-   `db/`: Local storage for SQLite and session data.
-   `Dockerfile` & `docker-compose.yml`: Containerization logic.
-   `render.yaml`: Cloud orchestration Blueprint.

## 🤝 Acknowledgments
Submitted as part of the **Intel Unnati Program**. Designed for high-performance document analysis with zero operational cost utilizing Gemini's developer tier.
