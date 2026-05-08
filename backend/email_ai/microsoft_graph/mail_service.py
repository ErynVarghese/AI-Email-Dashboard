# email_ai/microsoft_graph/mail_service.py
from typing import Any, Dict, List, Optional
from asgiref.sync import async_to_sync
from email_ai.microsoft_graph.graph_client import get_graph_client_from_session_token


async def get_user_emails_raw(access_token: str, top: int = 50) -> Dict[str, Any]:
    client = get_graph_client_from_session_token(access_token)
    resp = await client.me.messages.get()  

    items: List[Dict[str, Any]] = []
    for m in (getattr(resp, "value", None) or []):
        
        from_addr = None
        try:
            if getattr(m, "from_", None) and getattr(m.from_, "email_address", None):
                from_addr = m.from_.email_address.address
        except Exception:
            pass

        received_iso = None
        rd = getattr(m, "received_date_time", None)
        if rd:
            try:
                received_iso = rd.isoformat()
            except Exception:
                received_iso = str(rd)

        items.append({
            "id": getattr(m, "id", None),
            "subject": getattr(m, "subject", None),
            "from": from_addr,
            "receivedDateTime": received_iso,                
            "isRead": getattr(m, "is_read", None),
            "webLink": getattr(m, "web_link", None),
            "bodyPreview": getattr(getattr(m, "body", None), "content", None),
        })

  
    return {"value": items}

# --- read token from session ---
def _token_from_session(request) -> Optional[str]:
    return request.session.get("graph_access_token") or request.session.get("access_token")

# ---  wrapper for Django views ---
def list_recent_messages_from_request(request, top: int = 50) -> List[Dict[str, Any]]:
    token = _token_from_session(request)
    if not token:
        raise PermissionError("No Graph token in session")
    data = async_to_sync(get_user_emails_raw)(token, top)
    return data.get("value", [])[:top]

