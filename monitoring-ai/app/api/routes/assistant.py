from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.schemas.assistant import AssistantRequest, AssistantResponse
from app.services.assistant_service import AssistantService

router = APIRouter(prefix="/v1/assistant", tags=["assistant"])


@router.post("/answer", response_model=AssistantResponse)
async def answer(
    payload: AssistantRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> AssistantResponse:
    return await AssistantService(settings).answer(payload)
