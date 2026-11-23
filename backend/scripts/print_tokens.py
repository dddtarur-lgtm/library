import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

import django
django.setup()

from django.contrib.auth import get_user_model
from apps.core.jwt import generate_access_token, AUDIENCE_PLATFORM, AUDIENCE_LIBRARY

User = get_user_model()
u = User.objects.get(email="admin@lmsplatform.com")
token = generate_access_token(u.id, audience=AUDIENCE_PLATFORM)
print("SUPER_ADMIN_TOKEN=" + token)

lu = User.objects.get(email="apex.admin@apexstudy.com")
ltoken = generate_access_token(lu.id, audience=AUDIENCE_LIBRARY)
print("LIBRARY_ADMIN_TOKEN=" + ltoken)
