"""
Internal API metrics tracking for chatbot.
Logs to console only - no API endpoints exposed.
"""
from datetime import datetime
from typing import Any


class APIMetrics:
    """Track API usage metrics internally."""
    
    def __init__(self) -> None:
        self.llm_calls = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.tokens_estimated = 0
        self.start_time = datetime.utcnow()
    
    def log_llm_call(self, input_chars: int = 0, output_chars: int = 0) -> None:
        """Log an LLM API call with estimated tokens."""
        self.llm_calls += 1
        # Rough estimate: 1 token ≈ 4 chars
        tokens = (input_chars + output_chars) // 4
        self.tokens_estimated += tokens
        print(f"[Metrics] LLM Call #{self.llm_calls} | Est. tokens: {tokens} | Total: {self.tokens_estimated}")
    
    def log_cache_hit(self) -> None:
        """Log a cache hit."""
        self.cache_hits += 1
        print(f"[Metrics] Cache HIT | Total hits: {self.cache_hits}")
    
    def log_cache_miss(self) -> None:
        """Log a cache miss."""
        self.cache_misses += 1
        print(f"[Metrics] Cache MISS | Total misses: {self.cache_misses}")
    
    def get_stats(self) -> dict[str, Any]:
        """Get current metrics stats."""
        uptime = (datetime.utcnow() - self.start_time).total_seconds()
        total_cache_requests = self.cache_hits + self.cache_misses
        hit_rate = (self.cache_hits / total_cache_requests * 100) if total_cache_requests > 0 else 0
        
        return {
            "llm_calls": self.llm_calls,
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "cache_hit_rate": f"{hit_rate:.1f}%",
            "tokens_estimated": self.tokens_estimated,
            "uptime_seconds": int(uptime),
        }
    
    def print_summary(self) -> None:
        """Print metrics summary to console."""
        stats = self.get_stats()
        print("\n" + "=" * 50)
        print("[Metrics Summary]")
        print(f"  LLM Calls: {stats['llm_calls']}")
        print(f"  Cache Hit Rate: {stats['cache_hit_rate']}")
        print(f"  Est. Tokens Used: {stats['tokens_estimated']}")
        print(f"  Uptime: {stats['uptime_seconds']}s")
        print("=" * 50 + "\n")


# Singleton instance
_metrics: APIMetrics | None = None


def get_metrics() -> APIMetrics:
    """Get the singleton metrics instance."""
    global _metrics
    if _metrics is None:
        _metrics = APIMetrics()
    return _metrics
