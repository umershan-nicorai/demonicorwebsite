import os
import json
import requests
import logging
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from time import sleep

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
STRAPI_API_TOKEN = os.getenv("STRAPI_API_TOKEN")
STRAPI_BASE_URL = os.getenv("STRAPI_BASE_URL", "http://localhost:1337/api")

# Validate environment variables
if not PINECONE_API_KEY:
    logger.error("PINECONE_API_KEY is not set in .env file")
    raise ValueError("Missing PINECONE_API_KEY")
if not STRAPI_API_TOKEN:
    logger.error("STRAPI_API_TOKEN is not set in .env file")
    raise ValueError("Missing STRAPI_API_TOKEN")

# Initialize Pinecone
try:
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index_name = "company-info"
    index = pc.Index(index_name)
    logger.info("Connected to Pinecone index: nicorai-faq")
except Exception as e:
    logger.error(f"Failed to connect to Pinecone: {str(e)}")
    raise

# Initialize sentence transformer
try:
    model = SentenceTransformer("paraphrase-mpnet-base-v2")
    logger.info("Loaded sentence transformer model")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    raise

def load_kb_data(file_path="nicorai_kb_data.json"):
    """Load JSON data from file."""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        logger.info(f"Loaded {len(data)} items from {file_path}")
        return data
    except FileNotFoundError:
        logger.error(f"File {file_path} not found")
        return []
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in {file_path}")
        return []
    except Exception as e:
        logger.error(f"Failed to load KB data: {str(e)}")
        return []

def validate_item(item):
    """Validate required fields for an item."""
    required_fields = ["ids", "type"]
    if not all(field in item for field in required_fields):
        missing = [field for field in required_fields if field not in item]
        logger.error(f"Item missing required fields: {missing}")
        return False
    if item["type"] == "faq":
        if not all(field in item for field in ["question", "answer"]):
            logger.error(f"FAQ item {item['ids']} missing question or answer")
            return False
    elif item["type"] in ["company_info", "structured_data"]:
        if "text" not in item and "structured_data" not in item:
            logger.error(f"Item {item['ids']} missing text or structured_data")
            return False
    if "metadata" not in item or not isinstance(item["metadata"], dict):
        logger.error(f"Item {item['ids']} missing or invalid metadata")
        return False
    return True

def push_to_strapi(item):
    """Push an item to Strapi (company-faqs or company-infoses)."""
    if not validate_item(item):
        logger.error(f"Skipping invalid item {item['ids']}")
        return False
    
    headers = {
        "Authorization": f"Bearer {STRAPI_API_TOKEN}",
        "Content-Type": "application/json"
    }
    endpoint = "faqses" if item["type"] == "faq" else "company-infoses"
    data = {"data": {}}
    
    # Common fields
    data["data"]["ids"] = item["ids"]
    data["data"]["metadata"] = item.get("metadata", {})
    data["data"]["type"] = item["type"]
    
    # FAQ-specific fields
    if item["type"] == "faq":
        data["data"]["question"] = item.get("question", "")
        data["data"]["answer"] = item.get("answer", "")
    # Company info/structured data-specific fields
    else:
        data["data"]["text"] = item.get("text", "")
        data["data"]["structured_data"] = item.get("structured_data", [])
    
    try:
        response = requests.post(f"{STRAPI_BASE_URL}/{endpoint}", headers=headers, json=data)
        response.raise_for_status()
        logger.info(f"Pushed item {item['ids']} to Strapi {endpoint}")
        return True
    except requests.exceptions.HTTPError as e:
        logger.error(f"Failed to push item {item['ids']} to Strapi {endpoint}: {response.status_code} {response.text}")
        return False
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to push item {item['ids']} to Strapi: {str(e)}")
        return False

def fetch_from_strapi(endpoint):
    """Fetch all items from a Strapi endpoint."""
    headers = {"Authorization": f"Bearer {STRAPI_API_TOKEN}"}
    items = []
    try:
        response = requests.get(f"{STRAPI_BASE_URL}/{endpoint}", headers=headers)
        response.raise_for_status()
        raw_data = response.json()
        
        # Handle Strapi v4 response format
        data = raw_data.get("data", []) if isinstance(raw_data, dict) else raw_data
        if not isinstance(data, list):
            logger.error(f"Unexpected data format from Strapi {endpoint}: {data}")
            return []
        
        for item in data:
            attributes = item.get("attributes", item)
            items.append({
                "ids": attributes.get("ids"),
                "question": attributes.get("question"),
                "answer": attributes.get("answer"),
                "text": attributes.get("text"),
                "structured_data": attributes.get("structured_data", []),
                "metadata": attributes.get("metadata", {}),
                "type": attributes.get("type")
            })
        
        logger.info(f"Fetched {len(items)} items from Strapi {endpoint}")
        return items
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch from Strapi {endpoint}: {str(e)}")
        return []

def flatten_metadata(metadata):
    """Flatten nested metadata for Pinecone."""
    flat_metadata = {}
    for key, value in metadata.items():
        if isinstance(value, dict):
            for sub_key, sub_value in value.items():
                flat_key = f"{key}_{sub_key}"
                if isinstance(sub_value, (str, int, float, bool)):
                    flat_metadata[flat_key] = sub_value
                else:
                    flat_metadata[flat_key] = str(sub_value)
        elif isinstance(value, list):
            flat_metadata[key] = [str(v) for v in value]
        elif isinstance(value, (str, int, float, bool)):
            flat_metadata[key] = value
        else:
            flat_metadata[key] = str(value)
    return flat_metadata

def generate_vectors(items):
    """Generate vectors for Pinecone with complete metadata."""
    vectors = []
    for item in items:
        text_to_embed = item.get("question", "") or item.get("text", "") or item.get("answer", "")
        if not text_to_embed:
            logger.warning(f"Skipping item {item['ids']} with no text to embed")
            continue
        try:
            embedding = model.encode(text_to_embed).tolist()
            # Include all relevant metadata
            metadata = flatten_metadata(item.get("metadata", {}))
            metadata["type"] = item.get("type")
            if item.get("text"):
                metadata["text"] = item.get("text")
            if item.get("answer"):
                metadata["answer"] = item.get("answer")
            if item.get("question"):
                metadata["question"] = item.get("question")
            if item.get("structured_data"):
                metadata["structured_data"] = json.dumps(item.get("structured_data"))
            
            vectors.append({
                "id": item["ids"],
                "values": embedding,
                "metadata": metadata
            })
        except Exception as e:
            logger.error(f"Failed to generate embedding for item {item['ids']}: {str(e)}")
    return vectors

def upsert_to_pinecone(vectors):
    """Upsert vectors to Pinecone."""
    try:
        if vectors:
            for attempt in range(3):
                try:
                    index.upsert(vectors=vectors)
                    logger.info(f"Upserted {len(vectors)} vectors to Pinecone")
                    break
                except Exception as e:
                    logger.warning(f"Upsert failed (attempt {attempt + 1}): {str(e)}")
                    if attempt == 2:
                        raise
                    sleep(2)
        else:
            logger.warning("No vectors to upsert")
    except Exception as e:
        logger.error(f"Failed to upsert to Pinecone: {str(e)}")
        raise

def main():
    # Load JSON data
    kb_data = load_kb_data()
    if not kb_data:
        logger.error("No data to sync, exiting")
        return

    # Push to Strapi
    failed_items = []
    for item in kb_data:
        if not push_to_strapi(item):
            failed_items.append(item["ids"])
            logger.warning(f"Continuing despite failure for item {item['ids']}")
    
    if failed_items:
        logger.error(f"Failed to push items: {failed_items}")

    # Fetch from Strapi
    faqs = fetch_from_strapi("faqses")
    company_infos = fetch_from_strapi("company-infoses")
    all_items = faqs + company_infos

    # Generate and upsert vectors
    vectors = generate_vectors(all_items)
    upsert_to_pinecone(vectors)

if __name__ == "__main__":
    try:
        main()
        logger.info("Sync completed successfully")
    except Exception as e:
        logger.error(f"Sync failed: {str(e)}")