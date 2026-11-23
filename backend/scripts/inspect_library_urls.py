import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

import django
django.setup()

from apps.billing.urls import library_urlpatterns as billing_urls
from apps.libraries.urls import library_urlpatterns as lib_urls
from apps.seats.urls import urlpatterns as seat_urls

print("BILLING URLS:")
for p in billing_urls:
    print(" ", p.pattern)
    if hasattr(p, "url_patterns"):
        for sub in p.url_patterns:
            print("    sub:", sub.pattern)

print("LIBRARY URLS:")
for p in lib_urls:
    print(" ", p.pattern)
    if hasattr(p, "url_patterns"):
        for sub in p.url_patterns:
            print("    sub:", sub.pattern)

print("SEAT URLS:")
for p in seat_urls:
    print(" ", p.pattern)
    if hasattr(p, "url_patterns"):
        for sub in p.url_patterns:
            print("    sub:", sub.pattern)

