from pydantic import BaseModel
from typing import List, Dict, Any


class TextAnalysisOutput(BaseModel):
    response: str
    metadata: Dict[str, Any]
