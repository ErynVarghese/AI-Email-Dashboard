# email_ai/views.py

from django.shortcuts import redirect
from django.http import JsonResponse, HttpResponse
from email_ai.microsoft_graph.auth_helper import build_auth_url, get_token_from_code


import traceback
from asgiref.sync import sync_to_async
from email_ai.microsoft_graph.mail_service import get_user_emails_raw 

from django.views.decorators.http import require_GET
from asgiref.sync import async_to_sync
from email_ai.microsoft_graph.mail_service import list_recent_messages_from_request
from email_ai.ai.spam_detection.infer import score_messages

from django.views.decorators.http import require_POST

def login(request):
    auth_url = build_auth_url()
    return redirect(auth_url)

def callback(request):
    code = request.GET.get("code")
    if not code:
        return HttpResponse("No code returned", status=400)

    token_result = get_token_from_code(code)


    if "access_token" not in token_result:
        return HttpResponse(f"Error retrieving token: {token_result.get('error_description', 'Unknown error')}", status=500)



    request.session["access_token"] = token_result["access_token"]
    request.session["graph_access_token"] = token_result["access_token"]


    # Redirect back to React
    return redirect("http://localhost:3000/dashboard") 


def fetch_emails_view(request):
    try:
        access_token = request.session.get("access_token")
        if not access_token:
            return JsonResponse({"error": "No token in session"}, status=401)

        raw_emails = async_to_sync(get_user_emails_raw)(access_token)
        return JsonResponse({"messages": raw_emails.get("value", [])})

    except Exception as e:
        print(" ERROR in fetch_emails_view:", str(e))
        return JsonResponse({"error": str(e)}, status=500)



@require_GET
def emails_recent(request):
    """
    GET /api/emails/recent?label=spam&limit=20
    Returns: [{ id, subject, from, receivedDateTime, isRead, webLink, label, score }]
    """
    try:
        limit = int(request.GET.get("limit", "20"))
    except ValueError:
        limit = 20
    label = request.GET.get("label")  # "spam" | "ham" | None

    try:
        raw = list_recent_messages_from_request(request, top=max(50, limit * 3))
    except PermissionError:
        return JsonResponse({"detail": "Not authenticated to Graph"}, status=401)

    # === MODEL CHECK HAPPENS HERE ===
    texts = [
        f"{(m.get('subject') or '').strip()}\n\n{(m.get('bodyPreview') or m.get('body_preview') or '').strip()}"
        for m in raw
    ]
    scored = score_messages(texts, threshold=0.3) if raw else []
    # =================================

    items = []
    for m, s in zip(raw, scored):
         # get both shapes:
        # - flattened: "from": "sender@example.com"
        # - nested:    "from": {"emailAddress": {"address": "..."}}
        from_field = m.get("from")
        if isinstance(from_field, str):
            from_addr = from_field
        else:
            from_addr = (((from_field or {}).get("emailAddress") or {}).get("address"))

        items.append({
            "id": m.get("id"),
            "subject": m.get("subject"),
            "from": from_addr,
            "receivedDateTime": m.get("receivedDateTime") or m.get("received_date_time"),
            "isRead": m.get("isRead") or m.get("is_read"),
            "webLink": m.get("webLink") or m.get("web_link"),
            "bodyPreview": m.get("bodyPreview") or m.get("body_preview"),
            "label": s["label"],
            "score": round(float(s["score"]), 4),
        })

    if label in ("spam", "ham"):
        items = [x for x in items if x["label"] == label]

    return JsonResponse(items[:limit], safe=False)


@require_GET
def spam_metrics(request):
    # return 200 only if a Graph token is in the session
    authed = bool(request.session.get("graph_access_token") or request.session.get("access_token"))
    return JsonResponse({"authenticated": authed}, status=200 if authed else 401)

@require_POST
def logout(request):
    request.session.flush()
    return JsonResponse({"ok": True})