import json
from typing import Any

import redis

from core.config import Settings


class RedisConversationMemory:
    def __init__(self, settings: Settings) -> None:
        self.redis_client: redis.Redis | None = None
        if settings.redis_url:
            try:
                self.redis_client = redis.from_url(settings.redis_url, decode_responses=True)
                print(f"[RedisMemory] Connected to Redis at {settings.redis_url}")
            except Exception as e:
                print(f"[RedisMemory] Failed to connect to Redis: {e}")
                self.redis_client = None

    @property
    def available(self) -> bool:
        return self.redis_client is not None

    def _key(self, session_id: str) -> str:
        return f"chatbot:session:{session_id}:messages"
    
    def _user_key(self, user_id: int) -> str:
        """Key for user-based chat history (persistent across sessions)."""
        return f"chatbot:user:{user_id}:messages"

    def append(self, session_id: str, role: str, content: str, user_id: int | None = None) -> None:
        if not self.available:
            return

        try:
            message = {"role": role, "content": content, "timestamp": self._get_timestamp()}
            
            # Save to session key
            key = self._key(session_id)
            self.redis_client.lpush(key, json.dumps(message, ensure_ascii=False))
            self.redis_client.ltrim(key, 0, 49)
            self.redis_client.expire(key, 86400 * 7)
            
            # Also save to user key if user is logged in (persistent history)
            if user_id:
                user_key = self._user_key(user_id)
                self.redis_client.lpush(user_key, json.dumps(message, ensure_ascii=False))
                self.redis_client.ltrim(user_key, 0, 99)  # Keep more history for users
                self.redis_client.expire(user_key, 86400 * 30)  # 30 days for logged-in users
                print(f"[RedisMemory] Saved message for user {user_id}: {role}")
            else:
                print(f"[RedisMemory] Saved message for session {session_id}: {role}")
        except Exception as e:
            print(f"[RedisMemory] Error saving message: {e}")

    def get_recent_messages(self, session_id: str, limit: int = 5, user_id: int | None = None) -> list[dict[str, Any]]:
        if not self.available:
            return []

        try:
            # Use user key if logged in, otherwise use session key
            if user_id:
                key = self._user_key(user_id)
                print(f"[RedisMemory] Retrieving messages for user {user_id}")
            else:
                key = self._key(session_id)
            
            raw_messages = self.redis_client.lrange(key, 0, limit - 1)
            messages = []
            for raw_msg in raw_messages:
                try:
                    msg = json.loads(raw_msg)
                    messages.append(msg)
                except json.JSONDecodeError:
                    continue
            print(f"[RedisMemory] Retrieved {len(messages)} recent messages")
            return messages
        except Exception as e:
            print(f"[RedisMemory] Error retrieving messages: {e}")
            return []

    def get_all_messages(self, session_id: str) -> list[dict[str, Any]]:
        if not self.available:
            return []

        try:
            key = self._key(session_id)
            raw_messages = self.redis_client.lrange(key, 0, -1)
            messages = []
            for raw_msg in raw_messages:
                try:
                    msg = json.loads(raw_msg)
                    messages.append(msg)
                except json.JSONDecodeError:
                    continue
            return messages
        except Exception as e:
            print(f"[RedisMemory] Error retrieving all messages: {e}")
            return []

    def clear(self, session_id: str) -> None:
        if not self.available:
            return

        try:
            key = self._key(session_id)
            self.redis_client.delete(key)
            print(f"[RedisMemory] Cleared messages for session {session_id}")
        except Exception as e:
            print(f"[RedisMemory] Error clearing messages: {e}")

    @staticmethod
    def _get_timestamp() -> str:
        from datetime import datetime

        return datetime.utcnow().isoformat()

