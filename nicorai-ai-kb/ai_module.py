import os
import requests
import re
import uuid
import json
from dotenv import load_dotenv
import logging
from typing import Dict, Any
from knowledge_base import KnowledgeBase

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

if not PERPLEXITY_API_KEY:
    logger.error("PERPLEXITY_API_KEY is not set in .env file")
    raise ValueError("Missing PERPLEXITY_API_KEY")

# Simple in-memory cache
response_cache = {}

class AIUIGeneration:
    def __init__(self):
        try:
            self.kb = KnowledgeBase()
            logger.info("AIUIGeneration initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize KnowledgeBase: {str(e)}")
            raise

    def truncate_text(self, text: str, max_length: int = 1000) -> str:
        """Truncate text to max_length, preserving whole words."""
        if len(text) <= max_length:
            return text
        return text[:max_length].rsplit(' ', 1)[0] + '...'

    def call_perplexity_llm(self, query: str, context: str, mode: str = "text") -> Dict[str, Any]:
        """Call Perplexity API for text, viewSpec, or response type decision."""
        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }

        if mode == "decide_response_type":
            prompt = f"""You are NicorAI, an innovative AI assistant. For the query '{query}' and the following context, determine the best response type: "text" or "view". Return a JSON object with a single key "responseType".

            Context:
            {context}

            Instructions:
            - Choose "view" for queries requesting lists, tables, charts, cards, or structured data (e.g., 'services', 'case studies', 'technologies', 'show', 'list', 'display','card','table','chart').
            - Choose "text" for informational, conversational, or vague queries (e.g., 'what does NicorAI do?', 'how are you', 'hi','hello').
            - Return JSON only, e.g., {{"responseType": "view"}} or {{"responseType": "text"}}.
            """
        elif mode == "view":
            prompt = f"""You are NicorAI, an innovative AI assistant. For the query '{query}' and the following context, select the best view type (table, card, chart, or custom) and generate a JSON viewSpec. Return a JSON object with viewType and data. Ensure valid JSON.

            Context:
            {context}

            Instructions:
            - Use structured JSON from context (e.g., list of services or case studies) to populate viewSpec.
            - For table: {{"viewType": "table", "data": {{"columns": ["Name", "Description"], "rows": [["string", "string"], ...]}}}}
            - For card: {{"viewType": "card", "data": {{"cards": [{{"title": "string", "content": "string"}}]}}}}
            - For chart: {{"viewType": "chart", "data": {{"chartType": "bar", "labels": ["string", ...], "datasets": [{{"label": "string", "data": [number, ...]}}]}}}}
            - For custom: {{"viewType": "custom", "data": {{"items": [{{"title": "string", "details": "string", "metadata": {{}}}}]}}}}
            - Choose chart for queries with 'chart' or numerical data needs (e.g., case studies with impact metrics or description lengths); card for case studies without 'chart'; table for services/technologies; custom for flexible JSON or unique visualizations.
            - Ensure chart view for queries explicitly requesting 'chart', using numerical data (e.g., impact %) or description lengths if no metrics are available.
            - Return JSON only, no markdown or additional text.

            Example:
            {{"viewType": "chart", "data": {{"chartType": "bar", "labels": ["Project A", "Project B"], "datasets": [{{"label": "Impact", "data": [30, 15]}}]}}}}
            """
        else:  # text
            prompt = f"""You are NicorAI, an innovative AI assistant for NicorAI, specializing in custom AI agents, AR/VR solutions, and rapid MVP development. Using the provided context, answer the query '{query}' concisely, accurately, and in a professional yet approachable tone. Reflect NicorAI’s client-centric and cutting-edge values. For casual queries (e.g., 'how are you', 'hoy'), respond conversationally with enthusiasm. Return only the text response.

            Context:
            {context}
            """

        payload = {
            "model": "llama-3.1-sonar-small-128k-online",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500,
            "temperature": 0.7
        }

        # Check cache
        cache_key = f"{query}:{mode}"
        if cache_key in response_cache:
            logger.info(f"Cache hit for query: {query}, mode: {mode}")
            return response_cache[cache_key]

        try:
            logger.debug(f"Sending payload to Perplexity: {json.dumps(payload, indent=2)}")
            response = requests.post(PERPLEXITY_API_URL, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Handle JSON parsing for view and decide_response_type modes
            if mode in ["view", "decide_response_type"]:
                # Strip markdown code blocks
                content = re.sub(r'^```json\s*|\s*```$', '', content, flags=re.MULTILINE).strip()
                # Fallback: Extract JSON if embedded in text
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    content = json_match.group(0)
                try:
                    parsed = json.loads(content)
                    response_cache[cache_key] = parsed
                    return parsed
                except json.JSONDecodeError as e:
                    logger.warning(f"LLM output is not JSON: {content}, Error: {str(e)}")
                    response_cache[cache_key] = {"text": content}
                    return {"text": content}
            else:
                response_cache[cache_key] = {"text": content}
                return {"text": content}
        except requests.exceptions.RequestException as e:
            logger.error(f"Perplexity API error: {str(e)}")
            return {"text": "Sorry, something went wrong. Please try again!"}
        except Exception as e:
            logger.error(f"Error processing LLM response: {str(e)}")
            return {"text": "Sorry, something went wrong. Please try again!"}

    def validate_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Validate response format and fix if necessary."""
        required_keys = ["responseId", "responseType", "content", "metadata"]
        if not all(key in response for key in required_keys):
            logger.error(f"Invalid response format: {response}")
            return {
                "responseId": str(uuid.uuid4()),
                "responseType": "text",
                "content": {"text": "Invalid response format. Please try again!"},
                "metadata": {"modelUsed": "none", "tokensUsed": 0}
            }

        if response["responseType"] == "view":
            content = response["content"]
            if "viewType" not in content or "viewSpec" not in content:
                logger.warning(f"Invalid view response: {content}")
                content = {
                    "viewType": "table",
                    "viewSpec": {
                        "viewType": "table",
                        "data": {"columns": ["Info"], "rows": [["Response format error"]]}
                    }
                }
            if content["viewType"] != content["viewSpec"]["viewType"]:
                logger.warning(f"View type mismatch: {content['viewType']} vs {content['viewSpec']['viewType']}")
                content["viewSpec"]["viewType"] = content["viewType"]

        return response

    def generate_view_spec(self, query: str, items: list) -> Dict[str, Any]:
        """Generate viewSpec using structured data or Perplexity."""
        query_lower = query.lower()
        structured_items = [
            (item["metadata"].get("question", ""), json.loads(item["metadata"].get("structured_data", "[]")))
            for item in items if item["metadata"].get("structured_data")
        ]
        
        # Build context for Perplexity
        context = ""
        for item in items:
            answer = item["metadata"].get("answer", item["metadata"].get("text", ""))
            question = item["metadata"].get("question", "")
            if answer.startswith('['):
                try:
                    json_data = json.loads(answer)
                    if isinstance(json_data, list):
                        context += f"Question: {question}\nAnswer: {json.dumps(json_data)}\n\n"
                        continue
                except json.JSONDecodeError:
                    pass
            context += f"Question: {question}\nAnswer: {answer}\n\n"
        context = self.truncate_text(context)

        # Use Perplexity for view generation (handles table, card, chart, custom)
        llm_output = self.call_perplexity_llm(query, context, mode="view")
        if isinstance(llm_output, dict) and "viewType" in llm_output:
            return llm_output
        
        # Fallback for non-structured data or failed LLM output
        if structured_items:
            if "case studies" in query_lower or "projects" in query_lower:
                return {
                    "viewType": "card",
                    "data": {
                        "cards": [
                            {
                                "title": entry.get("name", f"Case Study {i+1}"),
                                "content": entry.get("description", "")
                            }
                            for i, item in enumerate(structured_items[:1])
                            for entry in item[1]
                        ]
                    }
                }
            else:  # Default to table for services, technologies
                return {
                    "viewType": "table",
                    "data": {
                        "columns": ["Name", "Description"],
                        "rows": [
                            [entry.get("name", f"Item {i+1}"), entry.get("description", "")]
                            for i, item in enumerate(structured_items[:1])
                            for entry in item[1]
                        ]
                    }
                }
        
        if "services" in query_lower:
            return {
                "viewType": "table",
                "data": {
                    "columns": ["Name", "Description"],
                    "rows": [
                        ["Custom AI Agents", "Automate tasks and analyze data with tailored AI solutions."],
                        ["AR/VR Experiences", "Create immersive simulations for training or entertainment."],
                        ["Rapid MVP Development", "Build functional apps in 4–12 weeks."]
                    ]
                }
            }
        elif "case studies" in query_lower or "projects" in query_lower:
            return {
                "viewType": "card",
                "data": {
                    "cards": [
                        {
                            "title": "Case Studies",
                            "content": self.truncate_text(items[0]["content"], 200)
                        }
                    ]
                }
            }
        elif "technologies" in query_lower:
            return {
                "viewType": "table",
                "data": {
                    "columns": ["Technology", "Purpose"],
                    "rows": [
                        ["Python, TensorFlow, PyTorch", "AI/ML development"],
                        ["JavaScript, React", "Web applications"],
                        ["Unity, Unreal Engine", "AR/VR solutions"]
                    ]
                }
            }
        else:
            return {
                "viewType": "table",
                "data": {
                    "columns": ["Question", "Answer"],
                    "rows": [
                        [item["metadata"].get("question", "Info"), self.truncate_text(item["content"], 200)]
                        for item in items[:3]
                    ]
                }
            }

    def generate_text_response(self, query: str, items: list) -> str:
        """Generate text response using Perplexity."""
        query_lower = query.lower()
        
        # Handle metadata-specific queries
        if "share capital" in query_lower:
            for item in items:
                if item["id"] == "kb_001" and item["metadata"].get("share_capital_authorized"):
                    return f"NicorAI’s authorized share capital is {item['metadata']['share_capital_authorized']}."
        
        # Build context for Perplexity
        context = ""
        for item in items:
            answer = item["metadata"].get("answer", item["metadata"].get("text", ""))
            question = item["metadata"].get("question", "")
            context += f"Question: {question}\nAnswer: {answer}\n\n"
        context = self.truncate_text(context)

        # Use Perplexity for text response
        llm_output = self.call_perplexity_llm(query, context, mode="text")
        return llm_output.get("text", "Sorry, something went wrong. Please try again!") if isinstance(llm_output, dict) else llm_output

    def generate_response(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Generate text or view response based on the request."""
        query = request["query"].strip()
        retrieval_params = request.get("retrievalParams", {"maxResults": 5, "minRelevanceScore": 0.3})
        requested_response_type = request.get("responseType")
        response_id = str(uuid.uuid4())

        # Handle casual queries
        casual_pattern = r"^(hi|hello|hey|hoy|how are you|how\'s it going|what\'s up|good morning|good evening|wish|sup)\W*$"
        if re.match(casual_pattern, query.lower(), re.IGNORECASE):
            context = "NicorAI is a company specializing in custom AI agents, AR/VR solutions, and rapid MVP development."
            llm_output = self.call_perplexity_llm(query, context, mode="text")
            text_response = llm_output.get("text", "Hey! I’m NicorAI, your friendly assistant. Curious about NicorAI? I’ve got you covered! 🌟") if isinstance(llm_output, dict) else llm_output
            response = {
                "responseId": response_id,
                "responseType": "text",
                "content": {"text": text_response},
                "metadata": {"modelUsed": "llama-3.1-sonar-small-128k-online", "tokensUsed": 100}
            }
            return self.validate_response(response)

        # Handle empty query
        if not query:
            response = {
                "responseId": response_id,
                "responseType": "text",
                "content": {
                    "text": "Please provide a query to learn more about NicorAI’s services, case studies, or company details!"
                },
                "metadata": {"modelUsed": "none", "tokensUsed": 0}
            }
            return self.validate_response(response)

        # Apply metadata filters based on query
        metadata_filter = None
        query_lower = query.lower()
        if "services" in query_lower:
            metadata_filter = {"type": "structured_data", "category": "services"}
        elif "case studies" in query_lower or "projects" in query_lower:
            metadata_filter = {"type": "structured_data", "category": "case_studies"}
        elif "share capital" in query_lower or "company" in query_lower:
            metadata_filter = {"type": "company_info"}
        elif "faq" in query_lower or "how" in query_lower:
            metadata_filter = {"type": "faq"}
        elif "technologies" in query_lower:
            metadata_filter = {"type": "structured_data", "category": "technologies"}

        # Retrieve items from Pinecone
        try:
            retrieved_items = self.kb.retrieve_from_pinecone(
                query,
                top_k=retrieval_params["maxResults"],
                min_relevance_score=retrieval_params["minRelevanceScore"],
                metadata_filter=metadata_filter
            )
            logger.debug(f"Retrieved items: {len(retrieved_items)} for query: {query}")
        except Exception as e:
            logger.error(f"Error retrieving from Pinecone: {str(e)}")
            response = {
                "responseId": response_id,
                "responseType": "text",
                "content": {"text": "Sorry, I couldn’t connect to the Knowledge Base. Please try again!"},
                "metadata": {"modelUsed": "none", "tokensUsed": 0}
            }
            return self.validate_response(response)

        if not retrieved_items:
            logger.info(f"No relevant items found for query: {query}")
            response = {
                "responseId": response_id,
                "responseType": "text",
                "content": {
                    "text": "Hmm, I don’t know that yet! 😅 But if you have questions about NicorAI, I’m all ears. Ask away!"
                },
                "metadata": {"modelUsed": "none", "tokensUsed": 0}
            }
            return self.validate_response(response)

        # Build context for Perplexity
        context = ""
        for item in retrieved_items:  # Fixed: Changed 'items' to 'retrieved_items'
            answer = item["metadata"].get("answer", item["metadata"].get("text", ""))
            question = item["metadata"].get("question", "")
            context += f"Question: {question}\nAnswer: {answer}\n\n"
        context = self.truncate_text(context)
        logger.debug(f"Built context for query '{query}': {context[:200]}...")

        # Decide response type if not provided
        response_type = requested_response_type
        if response_type is None:
            llm_decision = self.call_perplexity_llm(query, context, mode="decide_response_type")
            response_type = llm_decision.get("responseType", "text") if isinstance(llm_decision, dict) else "text"
            logger.debug(f"LLM decided responseType: {response_type}")

        if response_type not in ["text", "view"]:
            logger.warning(f"Invalid responseType '{response_type}', defaulting to text")
            response_type = "text"

        # Generate response
        if response_type == "view":
            view_spec = self.generate_view_spec(query, retrieved_items)
            response = {
                "responseId": response_id,
                "responseType": "view",
                "content": {
                    "viewType": view_spec["viewType"],
                    "viewSpec": view_spec
                },
                "metadata": {
                    "modelUsed": "paraphrase-mpnet-base-v2",
                    "tokensUsed": 0
                }
            }
        else:
            text_response = self.generate_text_response(query, retrieved_items)
            response = {
                "responseId": response_id,
                "responseType": "text",
                "content": {"text": text_response},
                "metadata": {
                    "modelUsed": "llama-3.1-sonar-small-128k-online",
                    "tokensUsed": 100  # Placeholder
                }
            }

        return self.validate_response(response)

if __name__ == "__main__":
    try:
        ai = AIUIGeneration()
        test_cases = [
            {
                "query": "What does NicorAI do?",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3},
                "responseType": "text"
            },
            {
                "query": "What are NicorAI’s services?",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3}
                # Missing responseType to simulate frontend
            },
            {
                "query": "List case studies",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3},
                "responseType": "view"
            },
            {
                "query": "What is the share capital of NicorAI?",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3},
                "responseType": "text"
            },
            {
                "query": "How does NicorAI build AI agents?",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3},
                "responseType": "text"
            },
            {
                "query": "Show NicorAI technologies as table",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3},
                "responseType": "view"
            },
            {
                "query": "Show case studies as chart",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3},
                "responseType": "view"
            },
            {
                "query": "NicorAI projects",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3}
                # Missing responseType to simulate frontend
            },
            {
                "query": "Show technologies as custom",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3},
                "responseType": "view"
            },
            {
                "query": "hi",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3},
                "responseType": "text"
            },
            {
                "query": "how are you",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3},
                "responseType": "text"
            },
            {
                "query": "hoy",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.3},
                "responseType": "text"
            }
        ]

        for i, test_case in enumerate(test_cases, 1):
            logger.info(f"Running Test Case {i}: {test_case['query']}")
            response = ai.generate_response(test_case)
            print(json.dumps(response, indent=2))
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")