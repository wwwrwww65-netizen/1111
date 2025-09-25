from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import base64

app = FastAPI(title="vision-nlp", version="0.1.0")

MAX_IMAGES = int(os.getenv("ANALYZE_MAX_IMAGES", "6"))
MAX_MB = float(os.getenv("ANALYZE_MAX_IMAGE_MB", "2"))

class ImageIn(BaseModel):
    name: Optional[str] = None
    dataUrl: str

class AnalyzeIn(BaseModel):
    text: Optional[str] = None
    images: Optional[List[ImageIn]] = []

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/analyze")
def analyze(inp: AnalyzeIn):
    images = inp.images or []
    if len(images) > MAX_IMAGES:
        raise HTTPException(status_code=400, detail=f"too_many_images (>{MAX_IMAGES})")
    # naive size check
    for im in images:
        try:
            header, b64 = im.dataUrl.split(",", 1) if "," in im.dataUrl else ("", im.dataUrl)
            size_mb = len(b64) * 3 / 4 / (1024*1024)
            if size_mb > MAX_MB:
                raise HTTPException(status_code=400, detail="image_too_large")
        except Exception:
            raise HTTPException(status_code=400, detail="invalid_image")
    # placeholder minimal result for wiring; real implementation to be added
    return {
        "ok": True,
        "result": {
            "name": {"value": None, "source": "rules", "confidence": 0.0},
            "description": {"value": None, "source": "rules", "confidence": 0.0},
            "brand": {"value": None, "source": "rules", "confidence": 0.0},
            "tags": {"value": [], "source": "rules", "confidence": 0.0},
            "sizes": {"value": [], "source": "rules", "confidence": 0.0},
            "colors": {"value": [], "source": "vision", "confidence": 0.0},
            "price_range": {"value": None, "source": "rules", "confidence": 0.0},
            "attributes": {"value": [], "source": "rules", "confidence": 0.0},
            "seo": {"value": {"title": None, "description": None, "keywords": []}, "source": "rules", "confidence": 0.0}
        }
    }

