from __future__ import annotations

import json
from typing import Any

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from core.config import Settings
from chatbot.prompts import (
    CONVERSATION_ANALYSIS_PROMPT,
    CONSOLIDATED_ANALYSIS_PROMPT,
    INTENT_PROMPT,
    KEYWORD_PROMPT,
    PRODUCT_RESPONSE_PROMPT,
)
from chatbot.response_cache import ResponseCache
from chatbot.api_metrics import get_metrics


class LLMAnalyzer:
    def __init__(self, settings: Settings) -> None:
        api_key = settings.google_api_key
        if not api_key:
            self.model = None
            return

        self.model = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=api_key,
            temperature=0,
        )
        # Initialize cache
        self.cache = ResponseCache(settings)
        self.intent_chain = (
            ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        INTENT_PROMPT,
                    ),
                    ("human", "{message}"),
                ]
            )
            | self.model
            | StrOutputParser()
        )
        self.keyword_chain = (
            ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        KEYWORD_PROMPT,
                    ),
                    ("human", "{message}"),
                ]
            )
            | self.model
            | StrOutputParser()
        )
        self.conversation_chain = (
            ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        CONVERSATION_ANALYSIS_PROMPT,
                    ),
                    (
                        "human",
                        "Recent messages:\n{messages}\n\nCurrent message: {current_message}",
                    ),
                ]
            )
            | self.model
            | StrOutputParser()
        )
        self.product_chain = (
            ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        PRODUCT_RESPONSE_PROMPT,
                    ),
                    (
                        "human",
                        "user_query: {query}\nproducts: {products}\nsuggested_products: {suggested_products}",
                    ),
                ]
            )
            | self.model
            | StrOutputParser()
        )
        self.consolidated_chain = (
            ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        CONSOLIDATED_ANALYSIS_PROMPT,
                    ),
                    ("human", "Recent Messages:\n{history}\n\nCurrent Message: {message}"),
                ]
            )
            | self.model
            | StrOutputParser()
        )

    @property
    def available(self) -> bool:
        return self.model is not None

    def classify_intent(self, message: str) -> str | None:
        if not self.available:
            return None
        result = self.intent_chain.invoke({"message": message})
        data = self._load_json(result)
        intent = data.get("intent") if isinstance(data, dict) else None
        print(f"[LLM] Intent data: {data}")
        return intent

    def extract_keywords(
        self, message: str
    ) -> tuple[list[str] | None, str | None, tuple[float | None, float | None]]:
        if not self.available:
            return None, None, (None, None)
        result = self.keyword_chain.invoke({"message": message})
        data = self._load_json(result) or {}
        print(f"[LLM] Keyword payload: {data}")
        keywords = data.get("keywords")
        summary = data.get("query")
        min_price = data.get("min_price")
        max_price = data.get("max_price")

        cleaned: list[str] | None = None
        if isinstance(keywords, list):
            cleaned = [str(keyword).strip() for keyword in keywords if str(keyword).strip()]

        summary_text = summary if isinstance(summary, str) and summary.strip() else None
        min_price_val = float(min_price) if isinstance(min_price, (int, float)) else None
        max_price_val = float(max_price) if isinstance(max_price, (int, float)) else None

        print(f"[LLM] Parsed keywords: {cleaned}, min_price={min_price_val}, max_price={max_price_val}")
        return cleaned, summary_text, (min_price_val, max_price_val)

    def analyze_conversation(self, recent_messages: list[dict], current_message: str) -> str | None:
        if not self.available or not recent_messages:
            return None

        try:
            messages_text = "\n".join(
                [
                    f"{msg.get('role', 'unknown')}: {msg.get('content', '')}"
                    for msg in recent_messages
                ]
            )
            payload = {
                "messages": messages_text,
                "current_message": current_message,
            }
            result = self.conversation_chain.invoke(payload)
            data = self._load_json(result) or {}
            context = data.get("context")
            if isinstance(context, str) and context.strip():
                print(f"[LLM] Conversation context: {context}")
                return context.strip()
            return None
        except Exception as e:
            print(f"[LLM] Error analyzing conversation: {e}")
            return None

    def analyze_input(
        self, recent_messages: list[dict], current_message: str
    ) -> dict[str, Any]:
        """
        Consolidated analysis: Intent, Keywords, Query, Price, and Context in ONE call.
        """
        if not self.available:
            return {
                "intent": None,
                "keywords": [],
                "query": None,
                "min_price": None,
                "max_price": None,
                "context_summary": None,
            }

        history_text = "\n".join(
            [f"{msg.get('role', 'unknown')}: {msg.get('content', '')}" for msg in recent_messages]
        ) if recent_messages else "No history."

        try:
            print(f"[LLM] Analyzing input with consolidated prompt...")
            result = self.consolidated_chain.invoke(
                {"history": history_text, "message": current_message}
            )
            data = self._load_json(result) or {}
            print(f"[LLM] Consolidated analysis result: {data}")
            return data
        except Exception as e:
            print(f"[LLM] Error in consolidated analysis: {e}")
            return {}

    def compose_product_response(
        self, *, query: str | None, products: list[dict], suggested_products: list[dict] | None = None, original_message: str | None = None
    ) -> str | None:
        if not self.available:
            return None

        # Determine cache context and TTL
        has_products = len(products) > 0 or len(suggested_products or []) > 0
        if has_products:
            context_type = "product"
            ttl = 3600  # 1 hour for product-based answers
        else:
            context_type = "advice"
            ttl = 604800  # 7 days for general advice/nutrition

        # Use original_message for cache key (more consistent than LLM-generated query)
        cache_key = original_message or query
        
        # Check cache first
        if self.cache and self.cache.available and cache_key:
            cached_response = self.cache.get_cached_response(cache_key, context_type)
            if cached_response:
                get_metrics().log_cache_hit()
                return cached_response
            else:
                get_metrics().log_cache_miss()

        def _filter_product(p: dict) -> dict:
            return {
                "name": p.get("product_name"),
                "price": p.get("price_text") or p.get("price"),
                "unit": p.get("unit"),
                "discount": p.get("discount_percent"),
            }

        filtered_products = [_filter_product(p) for p in products]
        filtered_suggested = [_filter_product(p) for p in (suggested_products or [])]

        payload = {
            "query": query or "",
            "products": json.dumps(filtered_products, ensure_ascii=False),
            "suggested_products": json.dumps(filtered_suggested, ensure_ascii=False),
        }
        
        # Calculate input size for metrics
        input_chars = len(str(payload))
        
        response = self.product_chain.invoke(payload)
        if isinstance(response, str):
            cleaned = response.strip()
            cleaned = self._remove_table_format(cleaned)
            
            # Log metrics
            get_metrics().log_llm_call(input_chars, len(cleaned))
            
            # Cache the response
            if self.cache and self.cache.available and cache_key and cleaned:
                self.cache.cache_response(cache_key, cleaned, context_type, ttl)
            
            return cleaned
        return None

    @staticmethod
    def _remove_table_format(text: str) -> str:
        """Remove table formatting from text response."""
        import re

        lines = text.split("\n")
        cleaned_lines = []
        in_table = False

        for line in lines:
            stripped = line.strip()
            if re.match(r"^[\|\-\s:]+$", stripped):
                in_table = True
                continue
            if "|" in stripped and stripped.count("|") >= 2:
                in_table = True
                parts = [p.strip() for p in stripped.split("|") if p.strip()]
                if parts:
                    cleaned_lines.append(", ".join(parts))
                continue
            if in_table and not stripped:
                in_table = False
                continue
            if not in_table:
                cleaned_lines.append(line)

        result = "\n".join(cleaned_lines).strip()
        result = re.sub(r"\n{3,}", "\n\n", result)
        return result

    @staticmethod
    def _load_json(payload: str) -> dict | None:
        raw = payload.strip()
        if raw.startswith("```"):
            lines = raw.splitlines()
            # drop opening fence line (e.g. ```json)
            lines = lines[1:]
            # drop closing fence if present
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            raw = "\n".join(lines).strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            print("[LLM] Failed to parse JSON payload", raw)
            return None

