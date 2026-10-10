"""Read-only access to the Yale SOM course catalog (data/yale_som.db)."""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "yale_som.db"

# columns the agents usually need; full rows add description, bio and syllabus
SUMMARY_COLS = "course_number, section, course_title, faculty_1, course_category, course_session, daytimes, room, units"


def _connect() -> sqlite3.Connection:
    con = sqlite3.connect(f"file:{DB_PATH.as_posix()}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con


def query(sql: str, params: tuple = ()) -> list[dict]:
    with _connect() as con:
        return [dict(r) for r in con.execute(sql, params)]


def search_courses(text: str, category: str | None = None, limit: int = 12) -> list[dict]:
    like = f"%{text.strip()}%"
    sql = f"""
        SELECT {SUMMARY_COLS} FROM courses
        WHERE (course_title LIKE ? OR course_description LIKE ? OR course_number LIKE ? OR faculty_1 LIKE ?)
    """
    params: list = [like, like, like, like]
    if category:
        sql += " AND course_category LIKE ?"
        params.append(f"%{category.strip()}%")
    sql += " ORDER BY course_number, section LIMIT ?"
    params.append(limit)
    return query(sql, tuple(params))


def course_details(course_number: str) -> list[dict]:
    """Every section of a course, with description, instructor bio and syllabus link."""
    num = course_number.upper().replace("MGMT", "MGMT ").replace("MGT", "MGT ").split()
    like = "%" + " ".join(num) + "%"
    rows = query(
        f"""SELECT {SUMMARY_COLS}, course_description, faculty_bio,
                   COALESCE(NULLIF(syllabus, ''), old_syllabus) AS syllabus
            FROM courses WHERE course_number LIKE ? ORDER BY section""",
        (like,),
    )
    for r in rows:
        r["course_description"] = (r["course_description"] or "")[:1500]
        r["faculty_bio"] = (r["faculty_bio"] or "")[:800]
    return rows


def courses_by_instructor(name: str) -> list[dict]:
    return query(f"SELECT {SUMMARY_COLS} FROM courses WHERE faculty_1 LIKE ? ORDER BY course_number, section", (f"%{name.strip()}%",))


def courses_in_room(room: str) -> list[dict]:
    digits = "".join(ch for ch in room if ch.isdigit()) or room.strip()
    return query(f"SELECT {SUMMARY_COLS} FROM courses WHERE room LIKE ? ORDER BY daytimes", (f"%{digits}%",))


def categories() -> list[dict]:
    return query("SELECT course_category AS category, COUNT(*) AS courses FROM courses WHERE course_category <> '' GROUP BY 1 ORDER BY 2 DESC")
