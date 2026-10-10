"""FastAPI backend: chat with AI professor agents.

Run from this folder:  .venv/Scripts/python -m uvicorn main:app --reload --port 8000
"""

import os
from pathlib import Path

from dotenv import load_dotenv

os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")
load_dotenv(Path(__file__).parent / ".env")
load_dotenv(Path(__file__).parent.parent / ".env")  # project root works too

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402
from pydantic_ai.messages import ModelMessage, ModelRequest, UserPromptPart  # noqa: E402

import agents  # noqa: E402
from professors import PROFESSORS  # noqa: E402

app = FastAPI(title="Yale SOM Virtual: AI Professors")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)

# conversation memory per (professor, browser session); in-memory, resets on restart
SESSIONS: dict[tuple[str, str], list[ModelMessage]] = {}
MAX_HISTORY = 40


class ChatIn(BaseModel):
    session_id: str = Field(min_length=1, max_length=100)
    message: str = Field(min_length=1, max_length=4000)


class ChatOut(BaseModel):
    reply: str


def _prof(prof_id: str) -> dict:
    if prof_id not in PROFESSORS:
        raise HTTPException(404, f"No professor '{prof_id}'")
    return PROFESSORS[prof_id]


@app.get("/api/health")
def health():
    return {"ok": True, "model": agents.MODEL_NAME, "key_loaded": bool(os.getenv("PORTKEY_API_KEY"))}


@app.get("/api/professors")
def list_professors():
    return [{"id": k, "name": p["display_name"], "room": p["room"]} for k, p in PROFESSORS.items()]


@app.get("/api/professors/{prof_id}/prompt")
def show_prompt(prof_id: str):
    """The system prompt built from the database, handy for debugging a persona."""
    _prof(prof_id)
    return {"instructions": agents.build_instructions(prof_id)}


@app.post("/api/professors/{prof_id}/chat", response_model=ChatOut)
async def chat(prof_id: str, body: ChatIn):
    _prof(prof_id)
    try:
        agent = agents.get_agent(prof_id)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    key = (prof_id, body.session_id)
    try:
        result = await agent.run(body.message, message_history=SESSIONS.get(key))
    except Exception as e:  # surface model/gateway errors to the chat window
        raise HTTPException(502, f"The AI service had a problem: {e}")
    SESSIONS[key] = _trim(result.all_messages())
    return ChatOut(reply=result.output)


def _trim(msgs: list[ModelMessage]) -> list[ModelMessage]:
    """Keep recent history, cutting only where a user turn starts so tool calls stay paired."""
    if len(msgs) <= MAX_HISTORY:
        return msgs
    for i in range(len(msgs) - MAX_HISTORY, len(msgs)):
        m = msgs[i]
        if isinstance(m, ModelRequest) and any(isinstance(p, UserPromptPart) for p in m.parts):
            return msgs[i:]
    return msgs[-2:]


@app.delete("/api/professors/{prof_id}/chat/{session_id}")
def reset_chat(prof_id: str, session_id: str):
    SESSIONS.pop((prof_id, session_id), None)
    return {"ok": True}
