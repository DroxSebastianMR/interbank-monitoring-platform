from typing import Annotated
import hmac

from fastapi import APIRouter, Depends, Header, HTTPException

from app.core.config import Settings, get_settings
from app.schemas.assistant import AssistantRequest, AssistantResponse
from app.services.assistant_service import AssistantService

router = APIRouter(prefix="/v1/assistant", tags=["assistant"])


@router.post("/answer", response_model=AssistantResponse)
async def answer(
    payload: AssistantRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    x_internal_token: Annotated[str | None, Header()] = None,
) -> AssistantResponse:
    if settings.assistant_provider == "openrouter" and len(settings.ai_internal_token or "") < 32:
        raise HTTPException(status_code=503, detail="AI internal token is not configured")
    if settings.ai_internal_token and not hmac.compare_digest(x_internal_token or "", settings.ai_internal_token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return await AssistantService(settings).answer(payload)
