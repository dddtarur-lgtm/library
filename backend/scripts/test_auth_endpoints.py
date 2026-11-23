import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

import django
django.setup()

from rest_framework.test import APIClient
from apps.core.jwt import generate_access_token, AUDIENCE_PLATFORM, AUDIENCE_LIBRARY
from django.contrib.auth import get_user_model
from apps.libraries.models import Library

User = get_user_model()
sa = User.objects.get(email="admin@lmsplatform.com")
sa_token = generate_access_token(sa.id, audience=AUDIENCE_PLATFORM)

client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f"Bearer {sa_token}")

print("=== TESTING PLATFORM DASHBOARD & REPORTS ===")
endpoints = [
    "/api/v1/platform/dashboard/kpis/",
    "/api/v1/platform/dashboard/pending-requests/",
    "/api/v1/platform/dashboard/grace-locked/",
    "/api/v1/platform/dashboard/expiring-plans/",
    "/api/v1/platform/dashboard/recent-payments/",
    "/api/v1/platform/dashboard/email-health/",
    "/api/v1/platform/reports/revenue/",
    "/api/v1/platform/reports/growth/",
    "/api/v1/platform/reports/plan-distribution/",
    "/api/v1/platform/reports/student-status/",
    "/api/v1/platform/reports/expiry-forecast/",
    "/api/v1/platform/reports/occupancy/",
    "/api/v1/platform/reports/usage/",
    "/api/v1/platform/libraries/",
    "/api/v1/platform/library-requests/",
    "/api/v1/platform/plans/",
    "/api/v1/platform/support/",
]

for ep in endpoints:
    r = client.get(ep)
    print(f"{ep} -> {r.status_code}")
    if r.status_code != 200:
        print("  Error:", r.content[:200])
    else:
        d = r.json()
        print(f"  OK! Type: {type(d).__name__}, keys: {list(d.keys())[:4] if isinstance(d, dict) else len(d)}")
