from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from chatbot.service import ChatbotService
from core.config import get_settings
from schemas.schemas import MessageRequest, MessageResponse, SessionCreateRequest, SessionCreateResponse

app = FastAPI(title="Nông sản xanh Chatbot Service", version="0.1.0")
settings = get_settings()
chatbot_service = ChatbotService()

# Parse allowed_origins
origins = settings.allowed_origins
if isinstance(origins, str):
    if origins.strip() == "*":
        origins = ["*"]
    else:
        origins = [o.strip() for o in origins.split(",")]

# If allow_origins=["*"], allow_credentials must be False
allow_creds = True
if origins == ["*"]:
    allow_creds = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_creds,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_service() -> ChatbotService:
    return chatbot_service


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "chatbot", "port": settings.chatbot_port}


@app.post("/api/v1/chatbot/session", response_model=SessionCreateResponse)
def create_session(payload: SessionCreateRequest, service: ChatbotService = Depends(get_service)):
    session_id = service.create_session(user_id=payload.user_id)
    return SessionCreateResponse(session_id=session_id)


@app.post("/api/v1/chatbot/message", response_model=MessageResponse)
def send_message(payload: MessageRequest, service: ChatbotService = Depends(get_service)):
    response = service.send_message(
        session_id=payload.session_id,
        message=payload.message,
        user_id=payload.user_id,
    )
    if not response:
        raise HTTPException(status_code=500, detail="Chatbot is unavailable")
    return MessageResponse(**response)
