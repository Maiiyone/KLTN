from typing import Any, TypedDict


class ChatbotState(TypedDict, total=False):
    session_id: str
    user_id: int | None
    message: str
    recent_messages: list[dict[str, Any]] | None
    conversation_context: str | None
    intent: str | None
    keywords: list[str] | None
    product_query: str | None
    min_price: float | None
    max_price: float | None
    tool_result: dict | None
    response: str | None
