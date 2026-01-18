import hashlib
import json
import re
from typing import Any

import redis

from core.config import Settings


class ResponseCache:
    """Cache for LLM responses to reduce token usage on repeated queries."""
    
    def __init__(self, settings: Settings) -> None:
        self.redis_client: redis.Redis | None = None
        if settings.redis_url:
            try:
                self.redis_client = redis.from_url(settings.redis_url, decode_responses=True)
                print(f"[ResponseCache] Connected to Redis at {settings.redis_url}")
            except Exception as e:
                print(f"[ResponseCache] Failed to connect to Redis: {e}")
                self.redis_client = None
    
    @property
    def available(self) -> bool:
        return self.redis_client is not None
    
    def _normalize_query(self, query: str) -> str:
        """Normalize query for consistent cache keys."""
        if not query:
            return ""
        
        # Lowercase
        normalized = query.lower().strip()
        
        # Remove punctuation
        normalized = re.sub(r'[^\w\s]', ' ', normalized)
        
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        # Remove common Vietnamese stopwords
        stopwords = {'của', 'là', 'có', 'trong', 'cho', 'với', 'và', 'các', 'một', 'được', 'từ', 'để', 'này', 'như', 'về', 'tôi', 'bạn'}
        words = [w for w in normalized.split() if w not in stopwords]
        
        # Sort words alphabetically for consistency
        words.sort()
        
        return ' '.join(words)
    
    def _make_cache_key(self, query: str, context_type: str = "general") -> str:
        """Generate cache key from normalized query."""
        normalized = self._normalize_query(query)
        # Hash to keep key short
        query_hash = hashlib.md5(normalized.encode('utf-8')).hexdigest()[:16]
        return f"chatbot:cache:{context_type}:{query_hash}"
    
    def get_cached_response(self, query: str, context_type: str = "general") -> str | None:
        """Retrieve cached response if available."""
        if not self.available or not query:
            return None
        
        try:
            cache_key = self._make_cache_key(query, context_type)
            cached = self.redis_client.get(cache_key)
            
            if cached:
                print(f"[ResponseCache] Cache HIT for query: {query[:50]}...")
                return cached
            else:
                print(f"[ResponseCache] Cache MISS for query: {query[:50]}...")
                return None
                
        except Exception as e:
            print(f"[ResponseCache] Error retrieving cache: {e}")
            return None
    
    def cache_response(
        self, 
        query: str, 
        response: str, 
        context_type: str = "general",
        ttl: int = 3600
    ) -> None:
        """Store response in cache with TTL."""
        if not self.available or not query or not response:
            return
        
        try:
            cache_key = self._make_cache_key(query, context_type)
            self.redis_client.setex(cache_key, ttl, response)
            print(f"[ResponseCache] Cached response for {cache_key} (TTL: {ttl}s)")
        except Exception as e:
            print(f"[ResponseCache] Error caching response: {e}")
    
    def clear_cache_pattern(self, pattern: str = "chatbot:cache:*") -> int:
        """Clear cache entries matching pattern. Returns number of keys deleted."""
        if not self.available:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                count = self.redis_client.delete(*keys)
                print(f"[ResponseCache] Cleared {count} cache entries")
                return count
            return 0
        except Exception as e:
            print(f"[ResponseCache] Error clearing cache: {e}")
            return 0

    def invalidate_all(self) -> int:
        """Clear all cache entries. Returns count deleted."""
        return self.clear_cache_pattern("chatbot:cache:*")
    
    def invalidate_by_type(self, context_type: str) -> int:
        """Clear cache entries for specific context type (advice/product)."""
        return self.clear_cache_pattern(f"chatbot:cache:{context_type}:*")
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        if not self.available:
            return {"available": False, "entries": 0}
        
        try:
            keys = self.redis_client.keys("chatbot:cache:*")
            advice_keys = [k for k in keys if ":advice:" in k]
            product_keys = [k for k in keys if ":product:" in k]
            
            return {
                "available": True,
                "total_entries": len(keys),
                "advice_entries": len(advice_keys),
                "product_entries": len(product_keys),
            }
        except Exception as e:
            print(f"[ResponseCache] Error getting stats: {e}")
            return {"available": False, "error": str(e)}

