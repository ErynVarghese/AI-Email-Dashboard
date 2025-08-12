# email_ai/microsoftgraph/auth_helper.py
import msal
import os
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
TENANT_ID = os.getenv("TENANT_ID")
REDIRECT_URI = os.getenv("REDIRECT_URI")

# If you ONLY use personal Microsoft accounts (@outlook.com), use consumers:
AUTHORITY = "https://login.microsoftonline.com/consumers"
# If you want to allow both work/school and personal, use:
# AUTHORITY = "https://login.microsoftonline.com/common"
# (Avoid hard-coding a tenant GUID for MSAs.)

# Use short, delegated scopes (not resource-qualified URIs)
SCOPE = [
    "User.Read",
    "Mail.Read",
    "Mail.Send",
    "Calendars.ReadWrite",

]

def get_msal_app():
    return msal.ConfidentialClientApplication(
        client_id=CLIENT_ID,
        client_credential=CLIENT_SECRET,
        authority=AUTHORITY
    )

def build_auth_url():
    app = get_msal_app()
    return app.get_authorization_request_url(
        scopes=SCOPE,
        redirect_uri=REDIRECT_URI,
        prompt="consent"  # force consent once so Mail.Read is granted
       
    )

def get_token_from_code(auth_code):
    app = get_msal_app()
    result = app.acquire_token_by_authorization_code(
        code=auth_code,
        scopes=SCOPE,
        redirect_uri=REDIRECT_URI
    )
    return result
