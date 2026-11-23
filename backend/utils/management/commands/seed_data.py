"""Management command to seed initial development data."""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User
from apps.libraries.models import Branch, Library


class Command(BaseCommand):
    """Seed Super Admin, demo Library Owner, demo Library, and Main Branch."""

    help = 'Seed initial Super Admin and demo library data for local development.'

    @transaction.atomic
    def handle(self, *args, **options):
        # 1. Super Admin
        super_admin, sa_created = User.objects.get_or_create(
            email='admin@lmsplatform.com',
            defaults={
                'first_name': 'Super',
                'last_name': 'Admin',
                'username': 'superadmin',
                'role': 'SUPER_ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'email_verified': True,
                'status': 'ONLINE',
            },
        )
        if sa_created:
            super_admin.set_password('StrongPass123')
            super_admin.save(update_fields=['password'])
            self.stdout.write(self.style.SUCCESS('Created Super Admin: admin@lmsplatform.com'))
        else:
            self.stdout.write('Super Admin already exists: admin@lmsplatform.com')

        # 2. Demo Library Owner
        owner, owner_created = User.objects.get_or_create(
            email='owner@demolibrary.com',
            defaults={
                'first_name': 'Demo',
                'last_name': 'Owner',
                'username': 'demoowner',
                'role': 'LIBRARY_OWNER',
                'phone': '+919876543210',
                'email_verified': True,
                'status': 'ONLINE',
            },
        )
        if owner_created:
            owner.set_password('StrongPass123')
            owner.save(update_fields=['password'])
            self.stdout.write(self.style.SUCCESS('Created Demo Owner: owner@demolibrary.com'))
        else:
            self.stdout.write('Demo Owner already exists: owner@demolibrary.com')

        # 3. Demo Library
        library, lib_created = Library.objects.get_or_create(
            code='LIB-DEMO-001',
            defaults={
                'name': 'Demo Central Library',
                'owner': owner,
                'city': 'Ahmedabad',
                'state': 'Gujarat',
                'address': '101 Knowledge Park, CG Road, Ahmedabad',
                'phone': '+919876543210',
                'plan_status': 'Active',
                'library_status': 'Active',
                'email_connection_status': 'Connected',
            },
        )
        if owner.library_id != library.id:
            owner.library = library
            owner.save(update_fields=['library'])

        if lib_created:
            self.stdout.write(self.style.SUCCESS(f'Created Demo Library: {library.name}'))
        else:
            self.stdout.write(f'Demo Library already exists: {library.name}')

        # 4. Demo Main Branch
        branch, branch_created = Branch.objects.get_or_create(
            library=library,
            name='Main Branch',
            defaults={
                'address': '101 Knowledge Park, CG Road, Ahmedabad',
                'phone': '+919876543210',
                'is_main': True,
                'is_active': True,
                'floors_count': 2,
                'facilities': ['WiFi', 'AC', 'Lockers', 'Drinking Water'],
                'operating_hours': {'open': '07:00', 'close': '22:00', 'weeklyOff': 'None'},
            },
        )
        if branch_created:
            self.stdout.write(self.style.SUCCESS(f'Created Demo Branch: {branch.name}'))
        else:
            self.stdout.write(f'Demo Branch already exists: {branch.name}')

        self.stdout.write(self.style.SUCCESS('Seed data completed successfully.'))

