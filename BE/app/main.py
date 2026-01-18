from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="API for Bach Hoa Xanh E-commerce",
    version="1.0.0",
    debug=settings.debug
)

# CORS middleware
# Note: If allow_origins=["*"], credentials must be False
# For development, we allow all origins but disable credentials
# For production, specify exact origins and enable credentials
allow_creds = settings.allow_credentials
if settings.allowed_origins == ["*"]:
    allow_creds = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=allow_creds,
    allow_methods=settings.allowed_methods,
    allow_headers=settings.allowed_headers,
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Bach Hoa Xanh API", "version": "1.0.0"}

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)
