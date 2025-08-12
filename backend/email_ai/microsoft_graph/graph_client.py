# email_ai/microsoft_graph/graph_client.py

from msgraph.graph_service_client import GraphServiceClient
from azure.core.credentials import AccessToken


# Custom credential wrapper for Graph SDK
class SessionTokenCredential:
    def __init__(self, access_token):
        self.access_token = access_token

    def get_token(self, *scopes, **kwargs):
        return AccessToken(self.access_token, float("inf"))


def get_graph_client_from_session_token(access_token: str):
    scopes = ["Mail.Read", "Mail.Send", "User.Read"]
    credential = SessionTokenCredential(access_token)
    return GraphServiceClient(credential, scopes)
