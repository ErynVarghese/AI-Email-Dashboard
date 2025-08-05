# email_ai/views.py
from django.shortcuts import redirect, render
from django.http import HttpResponse
from email_ai.microsoft_graph.auth_helper import build_auth_url, get_token_from_code

def login(request):
    auth_url = build_auth_url()
    return redirect(auth_url)

def callback(request):
    code = request.GET.get("code")
    if not code:
        return HttpResponse("No code returned", status=400)

    token_result = get_token_from_code(code)
    request.session['token'] = token_result  # Save for future use

    return HttpResponse("Login successful. Token saved in session.")
