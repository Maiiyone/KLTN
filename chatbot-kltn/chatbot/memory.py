from collections import defaultdict, deque
from typing import Deque


class ConversationMemory:
    def __init__(self, max_turns: int = 10) -> None:
        self._storage: dict[str, Deque[str]] = defaultdict(lambda: deque(maxlen=max_turns))

    def append(self, session_id: str, role: str, content: str) -> None:
        self._storage[session_id].append(f"{role}: {content}")

    def get_context(self, session_id: str) -> str:
        return "\n".join(self._storage[session_id])

    def reset(self, session_id: str) -> None:
        if session_id in self._storage:
            del self._storage[session_id]
