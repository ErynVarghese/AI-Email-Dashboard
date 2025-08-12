# email_ai/views.py

from django.shortcuts import redirect
from django.http import JsonResponse, HttpResponse
from email_ai.microsoft_graph.auth_helper import build_auth_url, get_token_from_code

from django.http import JsonResponse


def login(request):
    auth_url = build_auth_url()
    return redirect(auth_url)

def callback(request):
    code = request.GET.get("code")
    if not code:
        return HttpResponse("No code returned", status=400)

    token_result = get_token_from_code(code)

    print("🔑 Access Token:", token_result.get("access_token", "None")[:50], "...")
    print("🧾 Scopes:", token_result.get("scope", "None"))


    if "access_token" not in token_result:
        return HttpResponse(f"Error retrieving token: {token_result.get('error_description', 'Unknown error')}", status=500)

    request.session['access_token'] = token_result["access_token"]
    print("✅ SESSION AFTER SET:", request.session.get('access_token'))

    # ✅ Redirect back to React
    return redirect("http://localhost:3000/email-page")  # ✅ This must match a frontend <Route>


import traceback

from asgiref.sync import sync_to_async

from django.http import JsonResponse
from asgiref.sync import sync_to_async
from email_ai.microsoft_graph.mail_service import get_user_emails_raw 
from django.http import JsonResponse
from asgiref.sync import async_to_sync
from email_ai.microsoft_graph.mail_service import get_user_emails_raw


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



