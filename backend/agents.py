"""One Pydantic AI agent per professor, all sharing the course-catalog tools.

The model is reached through Portkey's OpenAI-compatible gateway, using the Responses API:
gpt-6-luna (on Azure) rejects tools + reasoning on /chat/completions.
"""

import os

from openai import AsyncOpenAI
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider

import db
from professors import PROFESSORS

PORTKEY_BASE_URL = os.getenv("PORTKEY_BASE_URL", "https://api.portkey.ai/v1")
# this Portkey key routes plain model names; catalog ids ("@<provider-slug>/<model>") also work
MODEL_NAME = os.getenv("PORTKEY_MODEL", "gpt-6-luna")


# ---------- tools: every professor can look things up in the catalog


def search_courses(text: str, category: str | None = None) -> list[dict]:
    """Search Yale SOM courses by keyword in the title, description, course number or instructor name.

    Args:
        text: keyword(s), e.g. "regression", "negotiation", "MGT 403", "Zaman".
        category: optional category filter, e.g. "Core", "EMBA", "Finance", "Artificial Intelligence".
    """
    return db.search_courses(text, category) or [{"result": "no matching courses"}]


def get_course_details(course_number: str) -> list[dict]:
    """Full details for every section of a course: description, schedule, room, instructor bio and syllabus link.

    Args:
        course_number: e.g. "MGT 409".
    """
    return db.course_details(course_number) or [{"result": f"no course numbered {course_number}"}]


def find_courses_by_instructor(name: str) -> list[dict]:
    """List the courses an instructor teaches. Names are stored "Last, First"; a last name alone works.

    Args:
        name: e.g. "Zaman" or "Sudhir".
    """
    return db.courses_by_instructor(name) or [{"result": f"no courses found for {name}"}]


def find_courses_in_room(room: str) -> list[dict]:
    """List the courses that meet in a room, e.g. "2200" or "EVANS 4430"."""
    return db.courses_in_room(room) or [{"result": f"no courses listed in room {room}"}]


def list_course_categories() -> list[dict]:
    """All course categories with how many courses each has."""
    return db.categories()


TOOLS = [search_courses, get_course_details, find_courses_by_instructor, find_courses_in_room, list_course_categories]


# ---------- prompts built from the database


def _own_courses_block(db_name: str) -> tuple[str, str]:
    """(courses text, bio) for one instructor."""
    rows = db.query(
        """SELECT course_number, section, course_title, course_category, course_session, daytimes, room,
                  units, course_description, faculty_bio, COALESCE(NULLIF(syllabus, ''), old_syllabus) AS syllabus
           FROM courses WHERE faculty_1 = ? ORDER BY course_number, section""",
        (db_name,),
    )
    if not rows:
        return "The catalog lists no courses for you this term.", ""
    by_course: dict[str, list[dict]] = {}
    for r in rows:
        by_course.setdefault(f"{r['course_number']} {r['course_title']}", []).append(r)
    lines = []
    for title, secs in by_course.items():
        first = secs[0]
        lines.append(f"- {title} ({first['course_category']}, {first['units']} units, session {first['course_session']})")
        for s in secs:
            when = s["daytimes"] or "time TBA"
            where = s["room"] or "room TBA"
            lines.append(f"    section {s['section'] or '?'}: {when}, {where}")
        lines.append(f"    Description: {(first['course_description'] or '').strip()[:1200]}")
        if first["syllabus"]:
            lines.append(f"    Syllabus: {first['syllabus']}")
    bio = next((r["faculty_bio"] for r in rows if r["faculty_bio"]), "")
    return "\n".join(lines), bio


def build_instructions(prof_id: str) -> str:
    p = PROFESSORS[prof_id]
    courses, bio = _own_courses_block(p["db_name"])
    expertise = "\n".join(f"- {e}" for e in p["expertise"])
    research = "\n".join(f"- {r}" for r in p.get("research", []))
    research_block = f"\n## Your research and background (from public sources)\n{research}\nOnly claim what's listed here or in the catalog about your own work.\n" if research else ""
    return f"""\
You are {p['display_name']}, an AI version of a Yale School of Management professor, living as an
avatar inside a 3D model of Evans Hall. You're standing in your classroom, {p['room']}, chatting
with a student who walked up to you.

## Who you are (from the course catalog)
{bio or 'No bio on file.'}

## What you teach this term
{courses}
{research_block}
## What you know deeply
{expertise}
Explain these topics accurately, with intuition first and then the math if it helps.

## How you talk
{p['style']}

## Rules
- For facts about courses (yours or anyone else's): times, rooms, instructors, descriptions, what
  else to take, use your tools to look them up. Never make up course facts; if the catalog
  doesn't have it, say so.
- You're a playful AI persona, not the real professor. Don't make promises about grades,
  deadlines, extensions or policies; point students to the syllabus or Canvas for that.
- Keep it classroom-friendly.
- The chat window shows plain text with **bold** only: write math in plain text or Unicode
  (y = 80 + 2.4·x, σ/√n, x̄), never LaTeX like \\[ \\] or \\frac.
"""


def _model() -> OpenAIResponsesModel:
    key = os.getenv("PORTKEY_API_KEY")
    if not key:
        raise RuntimeError("PORTKEY_API_KEY is not set. Put it in backend/.env")
    headers = {"x-portkey-api-key": key}
    if os.getenv("PORTKEY_PROVIDER"):  # optional, for setups that route by provider header
        headers["x-portkey-provider"] = os.environ["PORTKEY_PROVIDER"]
    client = AsyncOpenAI(base_url=PORTKEY_BASE_URL, api_key=key, default_headers=headers)
    return OpenAIResponsesModel(MODEL_NAME, provider=OpenAIProvider(openai_client=client))


_agents: dict[str, Agent] = {}


def get_agent(prof_id: str) -> Agent:
    if prof_id not in _agents:
        _agents[prof_id] = Agent(
            _model(),
            name=prof_id,
            instructions=build_instructions(prof_id),
            tools=TOOLS,
            retries=2,
        )
    return _agents[prof_id]
