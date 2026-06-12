import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.ai import router as ai_router
from datetime import datetime

app = FastAPI(
    title="MediAI AI-Service",
    description="Python FastAPI Microservice for OCR, NLP, and ML Inference",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Route
@app.get("/health")
@app.get("/ai/health") # Supporting both namespaces
def health_check():
    return {
        "status": "healthy",
        "service": "FastAPI ML/AI Service",
        "timestamp": datetime.now().isoformat()
    }

# Mount Routing
app.include_router(ai_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
