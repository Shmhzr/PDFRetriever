from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
import jwt
from datetime import datetime, timedelta
from fastapi.staticfiles import StaticFiles
from . import logic

# --- Configuration ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

app = FastAPI(title="PDFRetriever API")

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve Frontend
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# --- Auth Helpers ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    password: str

class QueryRequest(BaseModel):
    chat_id: str
    query: str
    model: Optional[str] = None

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = logic.verify_user_by_username(username) # Need to implement this in logic.py
    if user is None:
        raise credentials_exception
    return user

# --- Endpoints ---

@app.on_event("startup")
async def startup_event():
    logic.init_db()

@app.post("/api/register")
async def register(user: UserCreate):
    success, msg = logic.register_user(user.username, user.password)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": "User registered successfully"}

@app.post("/api/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = logic.verify_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me")
async def read_users_me(current_user = Depends(get_current_user)):
    return {"username": current_user.username, "id": current_user.id}

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...), api_key: str = None, model: str = None, current_user = Depends(get_current_user)):
    if not api_key:
        raise HTTPException(status_code=400, detail="API Key is required")
    
    # Save file temporarily
    file_id = str(uuid.uuid4())
    file_path = f"tmp_{file_id}.pdf"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    try:
        # We need a file-like object for the logic functions
        class FileWrapper:
            def __init__(self, path, name):
                self.path = path
                self.name = name
            def getvalue(self):
                with open(self.path, "rb") as f:
                    return f.read()
            @property
            def name(self):
                return self._name
            @name.setter
            def name(self, val):
                self._name = val

        file_obj = FileWrapper(file_path, file.filename)
        
        parsed_data = logic.intelligent_pdf_parse(file_obj, api_key, model_name=model)
        if "error" in parsed_data:
            raise HTTPException(status_code=500, detail=parsed_data["error"])
        
        vectorstore, _ = logic.store_parsed_data(parsed_data, file.filename, api_key, current_user.id)
        
        # Save initial chat with PDF binary for persistence
        with open(file_path, "rb") as f:
            pdf_bytes = f.read()
            
        chat_id = logic.save_chat([], file.filename, current_user.id, processed_data=parsed_data, pdf_bytes=pdf_bytes)
        
        return {
            "chat_id": chat_id,
            "file_name": file.filename,
            "processed_data": parsed_data
        }
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/api/query")
async def query_pdf(request: QueryRequest, api_key: str = None, current_user = Depends(get_current_user)):
    if not api_key:
        raise HTTPException(status_code=400, detail="API Key is required")
    
    chat_data = logic.load_chat(request.chat_id)
    if not chat_data or chat_data['user_id'] != current_user.id:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    vectorstore = logic.load_vectorstore(chat_data['file_name'], api_key)
    result = logic.query_pdf(vectorstore, request.query, api_key, model_name=request.model)
    
    # Update history
    history = chat_data.get('history', [])
    history.append({"role": "user", "content": request.query})
    history.append({
        "role": "assistant", 
        "content": result.answer,
        "reasoning": result.reasoning,
        "context": result.context_used
    })
    
    logic.save_chat(history, chat_data['file_name'], current_user.id, chat_id=request.chat_id)
    
    return {
        "answer": result.answer,
        "reasoning": result.reasoning,
        "context": result.context_used,
        "history": history
    }

@app.get("/api/chats")
async def get_chats(current_user = Depends(get_current_user)):
    return logic.get_all_chats(current_user.id)

@app.get("/api/chats/{chat_id}")
async def get_chat(chat_id: str, current_user = Depends(get_current_user)):
    chat = logic.load_chat(chat_id)
    if not chat or chat['user_id'] != current_user.id:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@app.delete("/api/chats/{chat_id}")
async def delete_chat(chat_id: str, current_user = Depends(get_current_user)):
    chat = logic.load_chat(chat_id)
    if not chat or chat['user_id'] != current_user.id:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    success = logic.delete_chat(chat_id)
    return {"success": success}

# Serve Frontend - Mount at the end to avoid route conflicts
# Check if dist exists, otherwise serve a placeholder or error
frontend_dist = os.path.join(os.path.dirname(__file__), "../../frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    async def fallback():
        return {"message": "Frontend build not found. Please run 'npm run build' in the frontend directory."}
