import os
import uvicorn
from fastapi import FastAPI, Request
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Dict, Any, Optional
import logging
import traceback
from ai_module import AIUIGeneration

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="NicorAI API", description="RAG + LLM API for NicorAI", version="1.0")

# Initialize AIUIGeneration instance
try:
    ai_generator = AIUIGeneration()
    logger.info("AIUIGeneration initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize AIUIGeneration: {str(e)}")
    raise

# Define request body schema
class QueryRequest(BaseModel):
    query: str
    responseType: Optional[str] = None  # Allow None to match ai_module.py
    retrievalParams: Dict[str, Any] = {"maxResults": 5, "minRelevanceScore": 0.3}

@app.post("/api/query")
async def ai_query(request: QueryRequest, http_request: Request):
    try:
        logger.info(f"Received query: {request.query} at {http_request.url} with headers: {http_request.headers}")
        response = ai_generator.generate_response(request.dict())
        return response
    except Exception as e:
        logger.error(f"Error in ai-query endpoint: {str(e)}\n{traceback.format_exc()}")
        return {
            "responseId": "",
            "responseType": "text",
            "content": {"text": "Sorry, something went wrong on the server. Please try again!"},
            "metadata": {"modelUsed": "none", "tokensUsed": 0}
        }

@app.post("/")
async def root(http_request: Request):
    logger.warning(f"Misdirected POST request to root: {http_request.url} with headers: {http_request.headers}")
    return {
        "responseId": "",
        "responseType": "text",
        "content": {"text": "Invalid endpoint. Use POST /api/query for queries. Example: {'query': 'What does NicorAI do?'}."},
        "metadata": {"modelUsed": "none", "tokensUsed": 0}
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)