import json
from typing import Any
from fastapi.responses import JSONResponse

class EnvelopeResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        return super().render({"data": content})