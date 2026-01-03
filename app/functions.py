import os
import uuid
import json
import sqlite3
import pandas as pd
from pathlib import Path
from io import BytesIO

import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from pydantic import BaseModel, Field
import re
import bcrypt
from sqlalchemy import create_engine, Column, String, Integer, JSON, ForeignKey, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

# Global configuration
GEMINI_MODEL_NAME = "gemini-2.0-flash" 

# --- PostgreSQL Setup ---
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

class Chat(Base):
    __tablename__ = 'chats'
    id = Column(String(255), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(255))
    file_name = Column(String(255))
    history = Column(JSON) # Stores chat history as JSONB
    processed_data = Column(JSON) # Stores parsed doc structure
    pdf_b64 = Column(Text) # Optional: Store B64 of PDF for restoration
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class TableData(Base):
    __tablename__ = 'extracted_tables'
    id = Column(String(255), primary_key=True)
    file_name = Column(String(255))
    user_id = Column(Integer, ForeignKey('users.id'))
    page = Column(Integer)
    caption = Column(String(512))
    data_json = Column(JSON)

def get_db_engine():
    pg_host = os.getenv("PGHOST")
    
    if pg_host:
        pg_port = os.getenv("PGPORT", "5432")
        pg_db = os.getenv("PGDATABASE", "pdf_retriever")
        pg_user = os.getenv("PGUSER", "postgres")
        pg_pass = os.getenv("PGPASSWORD", "your_password")
        db_url = f"postgresql://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"
    else:
        # Fallback to local SQLite for easier project submission
        db_path = Path("db") / "intel_unnati.db"
        db_path.parent.mkdir(parents=True, exist_ok=True)
        db_url = f"sqlite:///{db_path}"
    
    return create_engine(db_url)

def init_db():
    engine = get_db_engine()
    Base.metadata.create_all(engine)

def get_db_session():
    engine = get_db_engine()
    Session = sessionmaker(bind=engine)
    return Session()

# --- Authentication Logic ---
def register_user(username, password):
    session = get_db_session()
    try:
        if session.query(User).filter_by(username=username).first():
            return False, "User already exists"
        
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_user = User(username=username, password_hash=hashed)
        session.add(new_user)
        session.commit()
        return True, "Registration successful"
    except Exception as e:
        session.rollback()
        return False, str(e)
    finally:
        session.close()

def verify_user(username, password):
    session = get_db_session()
    try:
        user = session.query(User).filter_by(username=username).first()
        if user and bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return user
        return None
    finally:
        session.close()

def clean_filename(filename):
    """
    Strictly follows ChromaDB collection name rules:
    - 3-512 characters.
    - Contains [a-zA-Z0-9._-].
    - Starts and ends with [a-zA-Z0-9].
    """
    import re
    # Replace any character not in [a-zA-Z0-9._-] with an underscore
    cleaned = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    # Ensure it starts and ends with alphanumeric
    cleaned = re.sub(r'^[^a-zA-Z0-9]+', '', cleaned)
    cleaned = re.sub(r'[^a-zA-Z0-9]+$', '', cleaned)
    
    # Handle length constraints
    if len(cleaned) < 3:
        cleaned = f"col_{cleaned}" if cleaned else "default_collection"
    
    return cleaned[:512]

def get_gemini_client(api_key):
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(GEMINI_MODEL_NAME)

def _safe_json_load(text):
    """Robustly extract and load JSON from a string."""
    try:
        # Try direct load
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON block
        match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except:
                pass
        # Remove markdown code blocks
        clean_text = re.sub(r'```json\s*|\s*```', '', text)
        try:
            return json.loads(clean_text)
        except:
            raise ValueError("Could not parse JSON from Gemini response.")

import pdfplumber

def intelligent_pdf_parse(uploaded_file, api_key):
    """
    Optimized Hybrid Parse:
    1. Extracts raw text locally (fast).
    2. Uses Gemini only for complex structure (TOC, Tables, Media).
    3. Handles OCR automatically if local extraction fails.
    """
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        GEMINI_MODEL_NAME,
        generation_config={"response_mime_type": "application/json"}
    )
    file_bytes = uploaded_file.getvalue()
    
    # Fast local analysis with pdfplumber
    local_pages = []
    is_scanned = True
    try:
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                local_pages.append({"page": page.page_number, "text": text})
                if len(text.strip()) > 50:
                    is_scanned = False
    except Exception as e:
        print(f"Local parse failed: {e}")

    # Prompt Gemini for the "Intelligent" parts
    # If selectable, we don't ask for full content to save time.
    # If scanned, we MUST ask for content as part of OCR.
    schema = {
      "toc": [ { "title": "string", "page_number": "integer" } ],
      "section_definitions": [ { "title": "string", "page_start": "integer", "page_end": "integer" } ],
      "tables": [ { "caption": "string", "cells": [["string"]], "page": "integer" } ],
      "media": [ { "description": "string", "page": "integer" } ]
    }
    
    if is_scanned:
        schema["section_definitions"][0]["content"] = "string (full OCR text)"

    prompt = f"""
    Analyze this PDF. It is {'SCANNED (needs full OCR)' if is_scanned else 'SELECTABLE (native text available)'}.
    Provide a structured JSON output with this precisely: {json.dumps(schema)}

    Rules:
    - Extract the official Table of Contents (TOC).
    - Define logical section boundaries (e.g., Chapter 1: pages 1-5). DO NOT cut across chapters.
    - Preserve document layout and hierarchy in your structural analysis.
    - Extract all tables accurately as 2-dimensional arrays (rows/cells).
    - Provide brief, searchable descriptions for all images, graphs, and charts.
    {'- For "content", perform OCR and provide the full text of the section.' if is_scanned else '- Do NOT provide "content" for sections; I will use fast local extraction.'}
    Return ONLY raw JSON.
    """

    response = model.generate_content([
        prompt,
        {"mime_type": "application/pdf", "data": file_bytes}
    ])
    
    try:
        gemini_data = _safe_json_load(response.text)
        
        sections = []
        for defn in gemini_data.get("section_definitions", []):
            start = defn.get("page_start", 1)
            end = defn.get("page_end", start)
            
            if is_scanned:
                # Use OCR text from Gemini
                content = defn.get("content", "[OCR Failed]")
            else:
                # Use local text
                content_parts = [p["text"] for p in local_pages if start <= p["page"] <= end]
                content = "\n".join(content_parts)
            
            sections.append({
                "title": defn["title"],
                "content": content,
                "page_range": f"{start}-{end}"
            })
        
        return {
            "toc": gemini_data.get("toc", []),
            "sections": sections,
            "tables": gemini_data.get("tables", []),
            "media": gemini_data.get("media", [])
        }
    except Exception as e:
        return {"error": f"Speed optimization failed: {str(e)}", "raw": response.text}

def store_parsed_data(parsed_data, file_name, api_key, user_id=None, db_root="db"):
    """
    Stores text in Vector Store, Tables in SQLite, and metadata for UI.
    """
    base_path = Path(db_root)
    base_path.mkdir(parents=True, exist_ok=True)
    
    clean_name = clean_filename(file_name)
    
    # 1. Store Text Sections and Media Descriptions in Chroma
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=api_key)
    
    documents = []
    # Add sections
    for section in parsed_data.get("sections", []):
        if section["content"].strip():
            doc = Document(
                page_content=section["content"],
                metadata={
                    "source": file_name,
                    "type": "section",
                    "title": section.get("title", ""),
                    "page_range": str(section.get("page_range", ""))
                }
            )
            documents.append(doc)
    
    # Add media descriptions
    for item in parsed_data.get("media", []):
        doc = Document(
            page_content=item["description"],
            metadata={
                "source": file_name,
                "type": "media",
                "page": item.get("page", "")
            }
        )
        documents.append(doc)

    if documents:
        vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=embeddings,
            collection_name=clean_name,
            persist_directory=str(base_path / "vectorstore")
        )
    else:
        vectorstore = None

    # 2. Store Tables in PostgreSQL
    session = get_db_session()
    try:
        for table in parsed_data.get("tables", []):
            table_id = str(uuid.uuid4())
            data = table.get("cells") or table.get("data") or []
            new_table = TableData(
                id=table_id,
                file_name=file_name,
                user_id=user_id,
                page=table.get("page"),
                caption=table.get("caption"),
                data_json=data
            )
            session.add(new_table)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"Error storing tables in PG: {e}")
    finally:
        session.close()

    return vectorstore, "postgresql"

def get_embedding_function(api_key):
    return GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=api_key)

def load_vectorstore(file_name, api_key, db_root="db"):
    base_path = Path(db_root)
    clean_name = clean_filename(file_name)
    embedding_function = get_embedding_function(api_key)
    return Chroma(
        persist_directory=str(base_path / "vectorstore"),
        embedding_function=embedding_function,
        collection_name=clean_name
    )

# Structured response models for searching
class SearchResult(BaseModel):
    answer: str = Field(description="Direct answer to the user query based on the context.")
    context_used: str = Field(description="Snippet of the context that specifically supports the answer.")
    reasoning: str = Field(description="Logic used to arrive at the answer.")

def query_pdf(vectorstore, query, api_key):
    """General RAG query against the vector store."""
    llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL_NAME, google_api_key=api_key)
    
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})
    
    prompt_template = ChatPromptTemplate.from_template("""
    You are a helpful document assistant. Use the following context to answer the question.
    If the context doesn't contain the answer, say you don't know based on the provided text.
    
    Context: {context}
    
    Question: {question}
    
    Answer clearly and concisely.
    """)

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt_template
        | llm.with_structured_output(SearchResult)
    )

    result = rag_chain.invoke(query)
    return result

def get_tables_for_file(file_name, user_id=None):
    session = get_db_session()
    try:
        # We don't always have user_id if we didn't store it yet
        query = session.query(TableData).filter_by(file_name=file_name)
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        tables = query.all()
        # Convert to DataFrame for compatibility with existing UI
        data = []
        for t in tables:
            data.append({
                "page": t.page,
                "caption": t.caption,
                "data_json": json.dumps(t.data_json)
            })
        return pd.DataFrame(data)
    finally:
        session.close()

def save_chat(chat_history, file_name, user_id, chat_id=None, processed_data=None, pdf_bytes=None):
    """Saves a chat history and session context to PostgreSQL."""
    session = get_db_session()
    try:
        if not chat_id:
            chat_id = str(uuid.uuid4())
        
        # Simple title generation
        title = "New Chat"
        for msg in chat_history:
            if msg["role"] == "user":
                title = msg["content"][:30] + "..." if len(msg["content"]) > 30 else msg["content"]
                break

        pdf_b64 = None
        if pdf_bytes:
            import base64
            pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8')

        chat_obj = session.query(Chat).filter_by(id=chat_id).first()
        if chat_obj:
            chat_obj.title = title
            chat_obj.history = chat_history
            chat_obj.processed_data = processed_data
            chat_obj.pdf_b64 = pdf_b64
            chat_obj.timestamp = datetime.datetime.utcnow()
        else:
            new_chat = Chat(
                id=chat_id,
                user_id=user_id,
                title=title,
                file_name=file_name,
                history=chat_history,
                processed_data=processed_data,
                pdf_b64=pdf_b64
            )
            session.add(new_chat)
        
        session.commit()
        return chat_id
    except Exception as e:
        session.rollback()
        print(f"Error saving chat to PG: {e}")
        return chat_id
    finally:
        session.close()

def get_all_chats(user_id):
    """Retrieves all saved chat metadata for a user from PostgreSQL."""
    session = get_db_session()
    try:
        chats = session.query(Chat).filter_by(user_id=user_id).order_by(Chat.timestamp.desc()).all()
        return [{
            "chat_id": c.id,
            "title": c.title,
            "file_name": c.file_name,
            "timestamp": c.timestamp.isoformat()
        } for c in chats]
    finally:
        session.close()

def load_chat(chat_id):
    """Loads a specific chat session from PostgreSQL."""
    session = get_db_session()
    try:
        chat = session.query(Chat).filter_by(id=chat_id).first()
        if chat:
            return {
                "chat_id": chat.id,
                "title": chat.title,
                "file_name": chat.file_name,
                "history": chat.history,
                "processed_data": chat.processed_data,
                "pdf_b64": chat.pdf_b64
            }
        return None
    finally:
        session.close()

def delete_chat(chat_id):
    """Deletes a chat session from PostgreSQL."""
    session = get_db_session()
    try:
        chat = session.query(Chat).filter_by(id=chat_id).first()
        if chat:
            session.delete(chat)
            session.commit()
            return True
        return False
    finally:
        session.close()
