from dataclasses import dataclass
import re

from fastapi import HTTPException, Request

from app.models.database import User

CLIENT_SESSION_HEADER = "x-client-session-id"
CLIENT_SESSION_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{15,127}$")


@dataclass(frozen=True)
class RequestScope:
    user_id: int | None
    guest_session_id: str | None
    kind: str


def get_client_session_id(request: Request) -> str | None:
    session_id = request.headers.get(CLIENT_SESSION_HEADER, "").strip()
    if not session_id:
        return None
    if not CLIENT_SESSION_PATTERN.fullmatch(session_id):
        raise HTTPException(400, "Invalid client session identifier.")
    return session_id


def get_request_scope(request: Request, current_user: User | None) -> RequestScope | None:
    if current_user is not None:
        return RequestScope(user_id=current_user.id, guest_session_id=None, kind="user")

    session_id = get_client_session_id(request)
    if session_id:
        return RequestScope(user_id=None, guest_session_id=session_id, kind="guest")

    return None


def require_request_scope(request: Request, current_user: User | None) -> RequestScope:
    scope = get_request_scope(request, current_user)
    if scope is None:
        raise HTTPException(401, "Authentication or a client session is required.")
    return scope
