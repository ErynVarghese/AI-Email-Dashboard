
# email_ai/microsoft_graph/mail_service.py

from email_ai.microsoft_graph.graph_client import get_graph_client_from_session_token
from asgiref.sync import async_to_sync

from email_ai.microsoft_graph.graph_client import get_graph_client_from_session_token

async def get_user_emails_raw(access_token: str):
    client = get_graph_client_from_session_token(access_token)

    response = await client.me.messages.get()
    print(response)               # Will print the model object
    print(response.value)         # List of Message objects
    print(response.serialize())   # Full raw dict version

    return response.serialize()   # returns as a plain Python dict

