"""Views for Section 18.2 Realtime Server-Sent Events (SSE)."""
import json
import time
from django.http import StreamingHttpResponse
from rest_framework import permissions, status
from rest_framework.views import APIView

from apps.core.jwt import decode_token


class RealtimeStreamView(APIView):
    """GET /v1/realtime/stream (SSE stream for live library & student updates)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.GET.get('token')
        auth_header = request.headers.get('Authorization', '')
        if not token and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        # Authenticate token if present
        claims = {}
        if token:
            try:
                claims = decode_token(token, expected_token_type='access')
            except Exception:
                claims = {}

        org_id = claims.get('org_id') or 'demo_org'
        user_id = claims.get('sub') or 'demo_user'
        aud = claims.get('aud') or 'library'

        def event_stream():
            # Initial connect handshake
            handshake = {
                'event': 'connected',
                'channel': f"{aud}:{org_id if aud == 'library' else user_id}",
                'timestamp': time.time(),
            }
            yield f"event: connect\ndata: {json.dumps(handshake)}\n\n"

            # Heartbeat comment
            yield ": heartbeat\n\n"

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
