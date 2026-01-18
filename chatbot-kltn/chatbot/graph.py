import re

from langgraph.graph import END, START, StateGraph
from sqlalchemy.orm import Session

from chatbot.llm import LLMAnalyzer
from chatbot.memory import ConversationMemory
from chatbot.rag import QdrantRAG
from chatbot.redis_memory import RedisConversationMemory
from chatbot.state import ChatbotState
from chatbot.tools import get_user_orders, get_user_profile, search_products_by_keyword, suggest_products

INTENT_KEYWORDS = {
    "orders": ["order", "orders", "tracking", "shipment"],
    "profile": ["profile", "account", "information", "user"],
}

STOP_WORDS = {
    "i",
    "me",
    "my",
    "want",
    "to",
    "buy",
    "please",
    "show",
    "find",
    "need",
    "order",
    "product",
}


def _analyze_request(
    ai: LLMAnalyzer | None, redis_memory: RedisConversationMemory | None, state: ChatbotState
) -> ChatbotState:
    session_id = state.get("session_id", "")
    current_message = state.get("message", "")
    user_id = state.get("user_id")
    print(f"[LangGraph] Analyzing request for session {session_id}, user_id={user_id}")

    # 1. Fetch recent messages (use user_id if logged in for persistent history)
    recent_messages = []
    if redis_memory and redis_memory.available:
        recent_messages = redis_memory.get_recent_messages(session_id, limit=5, user_id=user_id)
        state["recent_messages"] = recent_messages
        print(f"[LangGraph] Retrieved {len(recent_messages)} recent messages")
    else:
        state["recent_messages"] = []
        print("[LangGraph] Redis memory unavailable")

    # 2. Consolidated API Call
    result = {}
    if ai and ai.available:
        result = ai.analyze_input(recent_messages, current_message)
    else:
        print("[LangGraph] AI unavailable, processing locally")

    # 3. Parse Results
    intent = result.get("intent")
    keywords = result.get("keywords")
    query = result.get("query")
    min_price = result.get("min_price")
    max_price = result.get("max_price")
    context = result.get("context_summary")

    # 4. Fallback Logic (if AI missed or unavailable)
    if not intent:
        lowered = current_message.lower()
        for candidate, kws in INTENT_KEYWORDS.items():
            if any(kw in lowered for kw in kws):
                intent = candidate
                break
        else:
            intent = "product_search"

    if not keywords and intent == "product_search":
        # Regex fallback
        words = re.findall(r"[a-zA-Z0-9]+", current_message.lower())
        keywords = [word for word in words if word not in STOP_WORDS]
        if not keywords:
            keywords = words
        if not query:
            query = current_message

    # 5. Update State
    state["intent"] = intent
    state["keywords"] = keywords or []
    state["product_query"] = query
    state["min_price"] = min_price
    state["max_price"] = max_price
    state["conversation_context"] = context
    
    print(f"[LangGraph] Resolved: Intent={intent}, Query={query}, KW={len(state['keywords'])}")
    return state


def run_tools(state: ChatbotState, db: Session, rag: QdrantRAG | None) -> ChatbotState:
    intent = state.get("intent")
    print(f"[LangGraph] Running tools for intent: {intent}")

    if intent == "orders":
        if state.get("user_id"):
            print("[LangGraph] Fetching order history")
            state["tool_result"] = {"orders": get_user_orders(db, state["user_id"])}
        else:
             print("[LangGraph] Order request without user_id")
             state["tool_result"] = {"orders": None} # None indicates need login/error

    elif intent == "profile":
        if state.get("user_id"):
            print("[LangGraph] Fetching user profile")
            state["tool_result"] = {"profile": get_user_profile(db, state["user_id"])}
        else:
            print("[LangGraph] Profile request without user_id")
            state["tool_result"] = {"profile": None} # None indicates need login

    else:
        # Default to product search (sql + rag)
        print("[LangGraph] Searching products (SQL + RAG)")
        keywords = state.get("keywords")
        query_text = state.get("product_query")
        min_price = state.get("min_price")
        max_price = state.get("max_price")

        products = []
        # Try RAG first if query is descriptive and RAG available
        if rag and rag.available and query_text and len(query_text.split()) > 2:
            print(f"[LangGraph] Attempting RAG search for: {query_text}")
            products = rag.search_products(query_text, limit=5, min_price=min_price, max_price=max_price)
        
        # Fallback or combine with SQL if RAG returned nothing
        if not products:
             print("[LangGraph] RAG empty or unavailable, using SQL Keyword search")
             products = search_products_by_keyword(
                db,
                keywords,
                min_price=min_price,
                max_price=max_price,
            )
        
        state["tool_result"] = {"products": products}

    print(f"[LangGraph] Tool result keys: {list((state.get('tool_result') or {}).keys())}")
    return state


def craft_response(
    state: ChatbotState,
    memory: ConversationMemory,
    ai: LLMAnalyzer | None,
    redis_memory: RedisConversationMemory | None,
    db: Session,
) -> ChatbotState:
    intent = state.get("intent")
    result = state.get("tool_result") or {}
    print(f"[LangGraph] Crafting response for intent: {intent}")

    if intent == "orders":
        orders = result.get("orders", [])
        if orders:
            reply = "Đây là các đơn hàng gần đây của bạn:"
        else:
            reply = "Bạn chưa có đơn hàng nào. Hãy đặt hàng để bắt đầu mua sắm nhé!"
    elif intent == "profile":
        profile = result.get("profile")
        if profile:
            reply = "Thông tin tài khoản của bạn:"
        else:
            reply = "Không tìm thấy thông tin tài khoản. Vui lòng kiểm tra lại."
    elif intent == "product_search":
        products = result.get("products", [])
        query_desc = state.get("product_query")
        original_message = state.get("message", "")  # Use original message for cache key
        
        if products:
            ai_reply = (
                ai.compose_product_response(
                    query=query_desc, 
                    products=products, 
                    suggested_products=[],
                    original_message=original_message
                )
                if ai and ai.available
                else None
            )
            if ai_reply:
                reply = ai_reply
            else:
                names = ", ".join(p["product_name"] for p in products if p.get("product_name"))
                prefix = f"Bạn đang tìm: {query_desc}. " if query_desc else ""
                reply = f"{prefix}Tôi tìm thấy các sản phẩm sau: {names}"
        else:
            suggested = suggest_products(db, limit=3) if db else []
            state["tool_result"]["suggested_products"] = suggested
            ai_reply = (
                ai.compose_product_response(
                    query=query_desc, 
                    products=[], 
                    suggested_products=suggested,
                    original_message=original_message
                )
                if ai and ai.available
                else None
            )
            if ai_reply:
                reply = ai_reply
            else:
                if suggested:
                    names = ", ".join(p["product_name"] for p in suggested if p.get("product_name"))
                    reply = (
                        f"Rất tiếc, tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn. "
                        f"Tuy nhiên, bạn có thể tham khảo một số sản phẩm phổ biến sau: {names}"
                    )
                else:
                    reply = (
                        "Rất tiếc, hiện tại không có sản phẩm phù hợp. "
                        "Bạn có thể thử tìm kiếm với từ khóa khác hoặc liên hệ hỗ trợ để được tư vấn thêm."
                    )
    else:
        reply = "Xin lỗi, tôi chưa hiểu rõ yêu cầu của bạn. Bạn có thể diễn đạt lại được không?"

    memory.append(state["session_id"], "assistant", reply)

    if redis_memory and redis_memory.available:
        session_id = state.get("session_id", "")
        user_id = state.get("user_id")
        user_message = state.get("message", "")
        redis_memory.append(session_id, "user", user_message, user_id=user_id)
        redis_memory.append(session_id, "assistant", reply, user_id=user_id)
        print(f"[LangGraph] Saved messages to Redis for session {session_id}, user_id={user_id}")

    print(f"[LangGraph] Reply generated: {reply}")
    state["response"] = reply
    return state


def build_graph(
    db: Session,
    memory: ConversationMemory,
    ai: LLMAnalyzer | None,
    rag: QdrantRAG | None = None,
    redis_memory: RedisConversationMemory | None = None,
) -> StateGraph:
    graph = StateGraph(ChatbotState)

    graph.add_node("analyze_request", lambda state: _analyze_request(ai, redis_memory, state))
    graph.add_node("run_tools", lambda state: run_tools(state, db, rag))
    graph.add_node("craft_response", lambda state: craft_response(state, memory, ai, redis_memory,db=db))

    graph.add_edge(START, "analyze_request")
    graph.add_edge("analyze_request", "run_tools")
    graph.add_edge("run_tools", "craft_response")
    graph.add_edge("craft_response", END)

    return graph.compile()


    

   