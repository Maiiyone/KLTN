from contextlib import contextmanager
from typing import Any
from uuid import uuid4

from chatbot.graph import build_graph
from chatbot.llm import LLMAnalyzer
from chatbot.memory import ConversationMemory
from chatbot.rag import QdrantRAG
from chatbot.redis_memory import RedisConversationMemory
from chatbot.state import ChatbotState
from core.config import get_settings
from db.database import SessionLocal
from schemas.schemas import MessageContext


class ChatbotService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.memory = ConversationMemory()
        self.analyzer = LLMAnalyzer(self.settings)
        self.rag = QdrantRAG(self.settings)
        self.redis_memory = RedisConversationMemory(self.settings)

    @contextmanager
    def _db(self):
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def create_session(self, user_id: int | None = None) -> str:
        session_id = str(uuid4())
        if user_id:
            self.memory.append(session_id, "system", f"session initialized for user {user_id}")
        print(f"[ChatbotService] Created session {session_id} for user {user_id}")
        return session_id

    def send_message(self, *, session_id: str, message: str, user_id: int | None = None) -> dict[str, Any]:
        print(f"[ChatbotService] Received message for session {session_id}: {message}")
        with self._db() as db:
            graph = build_graph(db, self.memory, self.analyzer, self.rag, self.redis_memory)
            state: ChatbotState = {
                "session_id": session_id,
                "user_id": user_id,
                "message": message,
            }
            result = graph.invoke(state)
            print(f"[ChatbotService] Graph completed for session {session_id}")
            tool_result = result.get("tool_result", {})
            context = MessageContext(
                products=tool_result.get("products"),
                suggested_products=tool_result.get("suggested_products"),
                orders=tool_result.get("orders"),
                profile=tool_result.get("profile"),
            )
            return {
                "reply": result.get("response", "I am not sure how to respond yet."),
                "session_id": session_id,
                "context": context.model_dump(exclude_none=True),
            }
