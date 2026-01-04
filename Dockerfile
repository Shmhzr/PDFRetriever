# --- Build Stage (Node) ---
FROM node:20-slim AS build-stage

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Final Stage (Python) ---
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBIAN_FRONTEND noninteractive

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    tesseract-ocr \
    libtesseract-dev \
    poppler-utils \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend ./backend

# Copy built frontend from build-stage
COPY --from=build-stage /app/frontend/dist ./frontend/dist

# Create directory for local DB
RUN mkdir -p db

WORKDIR /app/backend

# Command to run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
