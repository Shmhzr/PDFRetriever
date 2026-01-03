# PDFRetriever Pro: Documentation

## Overview
PDFRetriever Pro is an advanced tool designed to convert unstructured PDF documents (reports, manuals, policies) into a structured, searchable format. It leverages **Google Gemini 1.5 Flash** for multimodal parsing, enabling precise extraction of text, tables, and images.

## Architecture
The system consists of three main components:
1.  **Ingestion Pipeline**: Uses Gemini 1.5 Flash to process PDFs. It handles OCR, follows document layout, and preserves the Table of Contents.
2.  **Storage Layer**:
    *   **Vector Database (Chroma)**: Stores text sections and image descriptions for semantic search.
    *   **Relational Database (SQLite)**: Stores extracted tables in a structured format for precise querying.
3.  **Search Interface**: A premium Streamlit dashboard featuring a chat-based RAG (Retrieval-Augmented Generation) system and dedicated views for structured data.

## Key Features
*   **Multimodal Parsing**: Direct PDF processing including scanned documents (OCR).
*   **Layout Awareness**: Sections are broken down logically without cutting across chapters.
*   **Precise Table Extraction**: Tables are extracted as JSON and can be viewed or queried independently.
*   **Image Understanding**: Images and charts are described using AI, making them searchable via text queries.
*   **Table of Contents**: Automatically extracts and displays the TOC for easy navigation.

## Usage Instructions
1.  **Configuration**: Enter your Google API Key in the sidebar.
2.  **Upload**: Upload a PDF document.
3.  **Process**: Click "Process Document" to start the analysis.
4.  **Search**: Use the "Chat & Search" tab to ask questions about the document.
5.  **View Data**: Switch to the "Structured Tables" or "Images & Charts" tabs to see extracted assets.

## Dependencies
*   `streamlit`: UI Framework.
*   `google-generativeai`: Gemini API access.
*   `langchain`: RAG framework and Vector Store management.
*   `chromadb`: Vector storage.
*   `sqlite3`: Table storage.
