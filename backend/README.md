# Regulation-Searching Backend

Backend API service for Regulation-Searching system, built with FastAPI.

## Features

- **FastAPI Framework**: Modern, fast web framework for building APIs
- **Ollama LLM Integration**: Connect to external Ollama server for LLM inference
- **RAG System**: Retrieval-Augmented Generation for accurate responses
- **ChromaDB**: Vector database for document embeddings
- **JWT Authentication**: Secure user authentication
- **SQLite/PostgreSQL**: Flexible database options

## Project Structure

```
backend/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── chat.py         # Chat endpoints
│   │   ├── conversations.py # Conversation management
│   │   └── knowledge.py    # Knowledge base management
│   ├── core/               # Core functionality
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # Database connection
│   │   └── security.py     # Security utilities
│   ├── models/             # Database models
│   │   ├── user.py
│   │   └── conversation.py
│   ├── schemas/            # Pydantic schemas
│   │   ├── user.py
│   │   └── conversation.py
│   ├── services/           # Business logic
│   │   ├── llm/           # LLM service
│   │   ├── rag/           # RAG service
│   │   └── vector/        # Vector database service
│   └── main.py            # Application entry point
├── scripts/               # Utility scripts
│   ├── create_admin.py   # Create admin user
│   └── process_documents.py # Process documents
├── data/                 # Data directory
│   └── documents/        # Uploaded documents
├── requirements.txt      # Python dependencies
├── Dockerfile           # Docker configuration
└── .env.example         # Environment variables example
```

## Quick Start

### Prerequisites

- Python 3.11+
- Ollama server running (on another server)
- Docker (optional)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/unkaku-1/Regulation-Searching.git
cd Regulation-Searching/backend
```

2. **Create virtual environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Configure environment**

```bash
cp .env.example .env
# Edit .env file with your settings
nano .env
```

Important settings:
- `OLLAMA_BASE_URL`: URL of your Ollama server (e.g., http://192.168.1.100:11434)
- `OLLAMA_MODEL`: Model name (e.g., llama3.1:8b)
- `SECRET_KEY`: Generate a secure key

5. **Create admin user**

```bash
python scripts/create_admin.py
```

6. **Run the application**

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at http://localhost:8000

### Using Docker

1. **Configure environment**

```bash
cd ..  # Go to project root
cp backend/.env.example backend/.env
# Edit backend/.env file
```

2. **Start services**

```bash
docker-compose up -d
```

3. **Create admin user**

```bash
docker-compose exec backend python scripts/create_admin.py
```

## API Documentation

Once the application is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Usage

### 1. Upload Documents

Upload regulation documents to build the knowledge base:

```bash
# Place your documents in data/documents/
cp /path/to/your/regulation.pdf data/documents/

# Process documents
python scripts/process_documents.py
```

Or use the API endpoint:

```bash
curl -X POST "http://localhost:8000/api/knowledge/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

### 2. Chat with AI

```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the regulations about...?"}'
```

## Configuration

### Ollama Server

Make sure your Ollama server is accessible from the backend service. Update `OLLAMA_BASE_URL` in `.env`:

```env
OLLAMA_BASE_URL=http://your-server-ip:11434
```

### ChromaDB

ChromaDB runs as a separate service. The backend connects to it automatically when using Docker Compose.

### Embedding Model

The default embedding model is `BAAI/bge-large-zh-v1.5`. On first run, it will be downloaded automatically.

To use a different model, update `.env`:

```env
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

## Troubleshooting

### Cannot connect to Ollama

- Check if Ollama server is running
- Verify the `OLLAMA_BASE_URL` in `.env`
- Test connection: `curl http://your-ollama-server:11434/api/tags`

### ChromaDB connection error

- Ensure ChromaDB service is running
- Check Docker logs: `docker-compose logs chromadb`

### Model download fails

- Check internet connection
- Try downloading manually:
  ```python
  from sentence_transformers import SentenceTransformer
  model = SentenceTransformer('BAAI/bge-large-zh-v1.5')
  ```

## Development

### Run tests

```bash
pytest
```

### Code formatting

```bash
black app/
isort app/
```

### Type checking

```bash
mypy app/
```

## License

MIT License

