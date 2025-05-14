import os
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class KnowledgeBase:
    def __init__(self):
        # Load environment variables
        load_dotenv()
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY")
        if not self.pinecone_api_key:
            logger.error("PINECONE_API_KEY is not set in .env file")
            raise ValueError("Missing PINECONE_API_KEY")

        # Initialize Pinecone
        try:
            self.pc = Pinecone(api_key=self.pinecone_api_key)
            self.index_name = "company-info"
            self.index = self.pc.Index(self.index_name)
            logger.info("Connected to Pinecone index: company-info")
        except Exception as e:
            logger.error(f"Failed to connect to Pinecone: {str(e)}")
            raise

        # Initialize sentence transformer
        try:
            self.model = SentenceTransformer("paraphrase-mpnet-base-v2")
            logger.info("Loaded sentence transformer model")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise

    def retrieve_from_pinecone(self, query, top_k=5, min_relevance_score=0.2, metadata_filter=None):
        """
        Retrieve relevant items from Pinecone based on a query.
        Args:
            query (str): The query string.
            top_k (int): Number of results to return.
            min_relevance_score (float): Minimum cosine similarity score.
            metadata_filter (dict): Optional Pinecone metadata filter.
        Returns:
            list: List of dictionaries with id, content, metadata, and relevanceScore.
        """
        try:
            # Encode the query
            query_embedding = self.model.encode(query, show_progress_bar=True).tolist()
            
            # Set default metadata filter if none provided
            if metadata_filter is None:
                metadata_filter = {}
            
            # Query Pinecone
            query_response = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=metadata_filter
            )
            
            # Process results
            results = []
            for match in query_response.get("matches", []):
                score = match.get("score", 0.0)
                if score < min_relevance_score:
                    continue
                
                metadata = match.get("metadata", {})
                item_type = metadata.get("type", "unknown")
                
                # Determine content based on type
                content = ""
                if item_type == "faq":
                    content = match.get("metadata", {}).get("answer", "")
                elif item_type in ["company_info", "structured_data"]:
                    content = match.get("metadata", {}).get("text", "")
                
                results.append({
                    "id": match.get("id"),
                    "content": content,
                    "metadata": metadata,
                    "relevanceScore": score
                })
            
            logger.info(f"Retrieved {len(results)} relevant items for query")
            return results
        
        except Exception as e:
            logger.error(f"Failed to retrieve from Pinecone: {str(e)}")
            return []