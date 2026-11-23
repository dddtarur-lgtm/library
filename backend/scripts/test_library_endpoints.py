import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

import django
django.setup()

from rest_framework.test import APIClient
from apps.core.jwt import generate_access_token, AUDIENCE_LIBRARY
from django.contrib.auth import get_user_model
from apps.libraries.models import Library, Branch

User = get_user_model()
la = User.objects.get(email="apex.admin@apexstudy.com")
lib = Library.objects.get(id=la.library_id)
branch = Branch.objects.filter(library=lib).first()
token = generate_access_token(la.id, audience=AUDIENCE_LIBRARY)

client = APIClient()
client.credentials(
    HTTP_AUTHORIZATION=f"Bearer {token}",
    HTTP_X_BRANCH_ID=str(branch.id)
)

print(f"Testing with Library: {lib.name}, Branch: {branch.name} ({branch.id})")
endpoints = [
    "/api/v1/library/dashboard/",
    "/api/v1/library/students/",
    "/api/v1/library/seats/",
    "/api/v1/library/attendance/",
    "/api/v1/library/cashbook/",
    "/api/v1/library/fee-dues/",
    "/api/v1/library/fee-plans/",
    "/api/v1/library/branches/",
    "/api/v1/library/reports/",
    "/api/v1/library/reports/revenue/",
    "/api/v1/library/reports/attendance/",
    "/api/v1/library/email-management/smtp/",
    "/api/v1/library/email-management/logs/",
    "/api/v1/library/support/",
]

for ep in endpoints:
    r = client.get(ep)
    print(f"{ep} -> {r.status_code}")
    if r.status_code != 200:
        print("  Error:", r.content[:200])
    else:
        d = r.json()
        print(f"  OK! Type: {type(d).__name__}, keys/count: {list(d.keys())[:4] if isinstance(d, dict) else len(d)}")
