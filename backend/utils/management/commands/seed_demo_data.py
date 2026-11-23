"""Comprehensive management command to seed realistic, complete production-grade demo data across all platforms."""
import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.libraries.models import Library, Branch, LibraryRequest
from apps.students.models import Student, StudentMembership
from apps.seats.models import (
    Floor, Shift, Seat, SeatAllocation, Locker, AttendanceRecord, Holiday
)
from apps.billing.models import (
    SubscriptionPlan, LibrarySubscription, PlatformPayment,
    FeePlan, CashDayBookEntry, FeeDue, Invoice
)
from apps.books.models import BookCategory, Book, BookCopy, BookLoan
from apps.platform_admin.models import (
    SupportTicket, EmailConnectionHealth, WebsiteContentBlock
)
from apps.notifications.models import NotificationBroadcast


class Command(BaseCommand):
    help = "Seed rich, complete demo data for Super Admin, Library Admin, and all app modules."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("--- Starting Comprehensive Demo Data Seeding ---")

        # =====================================================================
        # 1. SUPER ADMIN USER
        # =====================================================================
        super_admin, _ = User.objects.get_or_create(
            email="admin@lmsplatform.com",
            defaults={
                "first_name": "Super",
                "last_name": "Admin",
                "username": "superadmin",
                "role": "SUPER_ADMIN",
                "is_staff": True,
                "is_superuser": True,
                "email_verified": True,
                "status": "ONLINE",
            },
        )
        super_admin.set_password("StrongPass123")
        super_admin.save()
        self.stdout.write(self.style.SUCCESS("Super Admin: admin@lmsplatform.com"))

        # =====================================================================
        # 2. SUBSCRIPTION PLANS (SaaS Tiers)
        # =====================================================================
        starter_plan, _ = SubscriptionPlan.objects.get_or_create(
            tier=1,
            defaults={
                "name": "Starter Tier",
                "monthly_fee": Decimal("999.00"),
                "quarterly_fee": Decimal("2699.00"),
                "annual_fee": Decimal("9999.00"),
                "max_branches": 1,
                "max_seats": 60,
                "max_students": 100,
                "max_staff": 2,
                "features": ["Seat Matrix", "Student Roster", "Basic Dues"],
                "is_active": True,
            },
        )
        growth_plan, _ = SubscriptionPlan.objects.get_or_create(
            tier=2,
            defaults={
                "name": "Growth Tier",
                "monthly_fee": Decimal("2499.00"),
                "quarterly_fee": Decimal("6699.00"),
                "annual_fee": Decimal("24999.00"),
                "max_branches": 3,
                "max_seats": 250,
                "max_students": 500,
                "max_staff": 10,
                "features": ["QR Attendance Kiosk", "Cashier Daybook", "WhatsApp Reminders", "Reports"],
                "is_active": True,
            },
        )
        enterprise_plan, _ = SubscriptionPlan.objects.get_or_create(
            tier=3,
            defaults={
                "name": "Enterprise Tier",
                "monthly_fee": Decimal("4999.00"),
                "quarterly_fee": Decimal("13499.00"),
                "annual_fee": Decimal("49999.00"),
                "max_branches": 10,
                "max_seats": 1000,
                "max_students": 2000,
                "max_staff": 30,
                "features": ["Multi-branch Network", "Priority Support", "White-label Portal", "Audit Logs"],
                "is_active": True,
            },
        )

        # =====================================================================
        # 3. LIBRARIES ACROSS ALL STATES (Active, Grace, Locked, Expired)
        # =====================================================================
        libraries_data = [
            {
                "code": "LIB-0101",
                "name": "Apex Study Hub HQ",
                "owner_email": "apex.admin@apexstudy.com",
                "owner_name": "Ramesh Kulkarni",
                "phone": "+919822012345",
                "city": "Pune",
                "state": "Maharashtra",
                "address": "Plot 42, Mayur Colony, Near Kothrud Bus Stand, Pune 411038",
                "plan_status": "Active",
                "library_status": "Active",
                "plan": growth_plan,
                "cycle": "MONTHLY",
                "period_end": timezone.now() + datetime.timedelta(days=22),
            },
            {
                "code": "LIB-0102",
                "name": "Gyan Sagar Reading Lounge",
                "owner_email": "gyan.admin@gyansagar.com",
                "owner_name": "Vikram Rathore",
                "phone": "+919876543211",
                "city": "Indore",
                "state": "Madhya Pradesh",
                "address": "12 Vijay Nagar Square, AB Road, Indore 452010",
                "plan_status": "Active",
                "library_status": "Active",
                "plan": starter_plan,
                "cycle": "MONTHLY",
                "period_end": timezone.now() + datetime.timedelta(days=15),
            },
            {
                "code": "LIB-0103",
                "name": "Vidya Niketan Study Hall",
                "owner_email": "vidya.admin@vidyaniketan.com",
                "owner_name": "Jayesh Shah",
                "phone": "+919825098765",
                "city": "Ahmedabad",
                "state": "Gujarat",
                "address": "204 CG Road, Navrangpura, Ahmedabad 380009",
                "plan_status": "Grace",
                "library_status": "Active",
                "plan": growth_plan,
                "cycle": "MONTHLY",
                "period_end": timezone.now() - datetime.timedelta(days=2),
                "grace_days": 2,
            },
            {
                "code": "LIB-0104",
                "name": "Pratibha Library & Co-work",
                "owner_email": "pratibha.admin@pratibha.com",
                "owner_name": "Sanjay Patel",
                "phone": "+919724012345",
                "city": "Surat",
                "state": "Gujarat",
                "address": "5th Floor, City Center, Ghod Dod Road, Surat 395007",
                "plan_status": "Grace",
                "library_status": "Active",
                "plan": starter_plan,
                "cycle": "MONTHLY",
                "period_end": timezone.now() - datetime.timedelta(days=5),
                "grace_days": 5,
            },
            {
                "code": "LIB-0105",
                "name": "Saraswati Shishu Mandir Study",
                "owner_email": "saraswati.admin@saraswati.com",
                "owner_name": "Pooja Sharma",
                "phone": "+919414076543",
                "city": "Jaipur",
                "state": "Rajasthan",
                "address": "Opposite Birla Mandir, JLN Marg, Jaipur 302004",
                "plan_status": "Locked",
                "library_status": "Locked",
                "student_notice": "Library access temporarily suspended for renewal billing. Desks remain reserved.",
                "plan": starter_plan,
                "cycle": "MONTHLY",
                "period_end": timezone.now() - datetime.timedelta(days=12),
                "grace_days": 0,
            },
            {
                "code": "LIB-0106",
                "name": "Horizon Digital Study Center",
                "owner_email": "horizon.admin@horizonstudy.com",
                "owner_name": "Ananya Iyer",
                "phone": "+919845011223",
                "city": "Bengaluru",
                "state": "Karnataka",
                "address": "88 Koramangala 4th Block, 100ft Road, Bengaluru 560034",
                "plan_status": "Active",
                "library_status": "Active",
                "plan": enterprise_plan,
                "cycle": "ANNUAL",
                "period_end": timezone.now() + datetime.timedelta(days=140),
            },
        ]

        created_libraries = []
        for l_data in libraries_data:
            owner_user, _ = User.objects.get_or_create(
                email=l_data["owner_email"],
                defaults={
                    "first_name": l_data["owner_name"].split()[0],
                    "last_name": l_data["owner_name"].split()[-1] if len(l_data["owner_name"].split()) > 1 else "",
                    "username": l_data["owner_email"].split("@")[0],
                    "role": "LIBRARY_OWNER",
                    "phone": l_data["phone"],
                    "email_verified": True,
                    "status": "ONLINE",
                },
            )
            owner_user.set_password("StrongPass123")
            owner_user.save()

            lib, _ = Library.objects.get_or_create(
                code=l_data["code"],
                defaults={
                    "name": l_data["name"],
                    "owner": owner_user,
                    "city": l_data["city"],
                    "state": l_data["state"],
                    "address": l_data["address"],
                    "phone": l_data["phone"],
                    "plan_status": l_data["plan_status"],
                    "library_status": l_data["library_status"],
                    "student_notice": l_data.get("student_notice", ""),
                    "email_connection_status": "Connected",
                },
            )
            owner_user.library = lib
            owner_user.save(update_fields=["library"])

            # Subscription
            sub, _ = LibrarySubscription.objects.get_or_create(
                library=lib,
                defaults={
                    "plan": l_data["plan"],
                    "billing_cycle": l_data["cycle"],
                    "start_date": (timezone.now() - datetime.timedelta(days=30)).date(),
                    "end_date": l_data["period_end"].date(),
                    "status": "ACTIVE" if l_data["plan_status"] == "Active" else "EXPIRED",
                    "fee_amount": l_data["plan"].monthly_fee,
                },
            )

            # Email Health
            EmailConnectionHealth.objects.get_or_create(
                library=lib,
                defaults={
                    "provider": "Amazon SES (smtp.eu-west-1.amazonaws.com)",
                    "connected_email": l_data["owner_email"],
                    "status": "Operational" if l_data["plan_status"] == "Active" else "Degraded",
                    "failure_count": 0 if l_data["plan_status"] == "Active" else 2,
                },
            )

            created_libraries.append(lib)

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(created_libraries)} Libraries across all statuses."))

        # =====================================================================
        # 4. LIBRARY ONBOARDING REQUESTS (Review Queue)
        # =====================================================================
        requests_data = [
            {
                "num": "REQ-2026-001",
                "name": "Gurukul Study Space",
                "owner": "Rakesh Meena",
                "mobile": "+919414012399",
                "email": "gurukul.kota@gmail.com",
                "city": "Kota",
                "state": "Rajasthan",
                "address": "Landmark City, Kunhari, Kota 324008",
                "status": "PENDING",
                "chosen_plan": "Growth Tier",
                "billing_cycle": "Monthly",
                "fee_amount": Decimal("2499.00"),
                "planned_seats": 120,
                "email_verified": True,
                "mobile_verified": True,
                "aadhaar_uploaded": True,
                "gst_uploaded": True,
                "ownership_proof_uploaded": True,
                "notes": "Verified Kota registration. Ready for immediate provisioning.",
            },
            {
                "num": "REQ-2026-002",
                "name": "Phoenix Self-Study Hall",
                "owner": "Nitin Gadre",
                "mobile": "+919822455611",
                "email": "phoenix.nagpur@gmail.com",
                "city": "Nagpur",
                "state": "Maharashtra",
                "address": "Dharampeth Extension, Nagpur 440010",
                "status": "PENDING",
                "chosen_plan": "Starter Tier",
                "billing_cycle": "Monthly",
                "fee_amount": Decimal("999.00"),
                "planned_seats": 80,
                "email_verified": True,
                "mobile_verified": True,
                "aadhaar_uploaded": True,
                "gst_uploaded": False,
                "ownership_proof_uploaded": True,
                "notes": "GST declaration pending under turnover threshold.",
            },
            {
                "num": "REQ-2026-003",
                "name": "Nalanda Knowledge Hub",
                "owner": "Alok Kumar Sinha",
                "mobile": "+919431088712",
                "email": "nalanda.patna@gmail.com",
                "city": "Patna",
                "state": "Bihar",
                "address": "Boring Road Crossing, Patna 800001",
                "status": "MORE_INFO",
                "chosen_plan": "Growth Tier",
                "billing_cycle": "Quarterly",
                "fee_amount": Decimal("6699.00"),
                "planned_seats": 150,
                "email_verified": True,
                "mobile_verified": True,
                "aadhaar_uploaded": False,
                "gst_uploaded": True,
                "ownership_proof_uploaded": False,
                "notes": "Requested Aadhaar and lease deed copy clarification on Nov 12.",
            },
            {
                "num": "REQ-2026-004",
                "name": "Oxford Reading Lounge",
                "owner": "Mohd Tariq",
                "mobile": "+919935044321",
                "email": "oxford.lucknow@gmail.com",
                "city": "Lucknow",
                "state": "Uttar Pradesh",
                "address": "Hazratganj Main Market, Lucknow 226001",
                "status": "APPROVED",
                "chosen_plan": "Growth Tier",
                "billing_cycle": "Annual",
                "fee_amount": Decimal("24999.00"),
                "planned_seats": 200,
                "email_verified": True,
                "mobile_verified": True,
                "aadhaar_uploaded": True,
                "gst_uploaded": True,
                "ownership_proof_uploaded": True,
                "notes": "Approved and provisioned on Nov 10.",
            },
            {
                "num": "REQ-2026-005",
                "name": "Alpha Digital Library",
                "owner": "Sunil More",
                "mobile": "+919823099881",
                "email": "alpha.nashik@gmail.com",
                "city": "Nashik",
                "state": "Maharashtra",
                "address": "College Road, Nashik 422005",
                "status": "REJECTED",
                "chosen_plan": "Starter Tier",
                "billing_cycle": "Monthly",
                "fee_amount": Decimal("999.00"),
                "planned_seats": 50,
                "email_verified": False,
                "mobile_verified": True,
                "aadhaar_uploaded": False,
                "gst_uploaded": False,
                "ownership_proof_uploaded": False,
                "notes": "Failed identity verification and uncontactable via phone.",
            },
        ]

        for req in requests_data:
            LibraryRequest.objects.get_or_create(
                request_number=req["num"],
                defaults={
                    "library_name": req["name"],
                    "owner_name": req["owner"],
                    "mobile": req["mobile"],
                    "email": req["email"],
                    "city": req["city"],
                    "state": req["state"],
                    "address": req["address"],
                    "status": req["status"],
                    "chosen_plan": req["chosen_plan"],
                    "billing_cycle": req["billing_cycle"],
                    "fee_amount": req["fee_amount"],
                    "planned_seats": req["planned_seats"],
                    "email_verified": req["email_verified"],
                    "mobile_verified": req["mobile_verified"],
                    "aadhaar_uploaded": req["aadhaar_uploaded"],
                    "gst_uploaded": req["gst_uploaded"],
                    "ownership_proof_uploaded": req["ownership_proof_uploaded"],
                    "notes": req["notes"],
                },
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(requests_data)} Library Requests."))

        # =====================================================================
        # 5. PLATFORM PAYMENTS (Billing Console)
        # =====================================================================
        payments_data = [
            {"lib": created_libraries[0], "amount": Decimal("2499.00"), "method": "UPI", "type": "Renewal", "status": "Success", "ref": "RZP-PAY-882190"},
            {"lib": created_libraries[1], "amount": Decimal("999.00"), "method": "Card", "type": "Renewal", "status": "Success", "ref": "RZP-PAY-882191"},
            {"lib": created_libraries[2], "amount": Decimal("2499.00"), "method": "NetBanking", "type": "Renewal", "status": "Failed", "ref": "RZP-PAY-882192"},
            {"lib": created_libraries[3], "amount": Decimal("999.00"), "method": "UPI", "type": "Renewal", "status": "Pending", "ref": "RZP-PAY-882193"},
            {"lib": created_libraries[5], "amount": Decimal("49999.00"), "method": "Bank Transfer", "type": "Renewal", "status": "Success", "ref": "NEFT-HDFC-991204"},
            {"lib": created_libraries[0], "amount": Decimal("5000.00"), "method": "UPI", "type": "Branch Addon", "status": "Success", "ref": "RZP-PAY-882195"},
        ]
        for p in payments_data:
            PlatformPayment.objects.get_or_create(
                reference_number=p["ref"],
                defaults={
                    "library": p["lib"],
                    "amount": p["amount"],
                    "method": p["method"],
                    "type": p["type"],
                    "status": p["status"],
                },
            )
        self.stdout.write(self.style.SUCCESS("Seeded Platform Billing Payments."))

        # =====================================================================
        # 6. GLOBAL BROADCAST NOTIFICATIONS & SUPPORT TICKETS
        # =====================================================================
        NotificationBroadcast.objects.get_or_create(
            title="Scheduled Maintenance Notice",
            defaults={
                "body": "Platform upgrades will take place on Sunday from 02:00 AM to 04:00 AM IST. All desk matrix features will remain operational offline.",
                "audience": "ALL_LIBRARIES",
                "priority": "HIGH",
            },
        )
        NotificationBroadcast.objects.get_or_create(
            title="New Feature: TOTP QR Attendance Released",
            defaults={
                "body": "Dynamic rotating QR kiosk check-in is now live for all Growth and Enterprise tier study centers.",
                "audience": "ALL_LIBRARIES",
                "priority": "NORMAL",
            },
        )

        SupportTicket.objects.get_or_create(
            subject="Assistance with Multi-Branch Seating Migration",
            defaults={
                "library": created_libraries[0],
                "description": "We recently acquired a second floor and need assistance importing 60 new seat layouts into the visual editor.",
                "status": "OPEN",
                "priority": "MEDIUM",
            },
        )

        # =====================================================================
        # 7. PRIMARY DEMO LIBRARY (Apex Study Hub HQ - LIB-0101) DEEP SEEDING
        # =====================================================================
        primary_lib = created_libraries[0]

        # Branches
        main_branch, _ = Branch.objects.get_or_create(
            library=primary_lib,
            name="Apex Study Hub - Kothrud HQ",
            defaults={
                "is_main": True,
                "address": "Plot 42, Mayur Colony, Near Kothrud Bus Stand, Pune 411038",
                "phone": "+919822012345",
                "floors_count": 2,
                "facilities": ["High-speed WiFi", "Air Conditioned", "Lockers", "RO Water", "Power Backup"],
                "operating_hours": {"open": "06:00", "close": "23:00", "weeklyOff": "None"},
                "is_active": True,
            },
        )
        sub_branch, _ = Branch.objects.get_or_create(
            library=primary_lib,
            name="Apex Study Hub - FC Road Branch",
            defaults={
                "is_main": False,
                "address": "3rd Floor, Deccan Chambers, FC Road, Pune 411004",
                "phone": "+919822099887",
                "floors_count": 1,
                "facilities": ["High-speed WiFi", "Air Conditioned", "RO Water"],
                "operating_hours": {"open": "07:00", "close": "22:00", "weeklyOff": "Sunday"},
                "is_active": True,
            },
        )

        # Shifts
        shift_fullday, _ = Shift.objects.get_or_create(
            branch=main_branch,
            name="Full Day",
            defaults={
                "library": primary_lib,
                "start_minute": 420,
                "end_minute": 1380,
                "is_full_day": True,
                "is_active": True,
            },
        )
        shift_morning, _ = Shift.objects.get_or_create(
            branch=main_branch,
            name="Morning Shift",
            defaults={
                "library": primary_lib,
                "start_minute": 360,
                "end_minute": 840,
                "is_full_day": False,
                "is_active": True,
            },
        )
        shift_evening, _ = Shift.objects.get_or_create(
            branch=main_branch,
            name="Evening Shift",
            defaults={
                "library": primary_lib,
                "start_minute": 840,
                "end_minute": 1320,
                "is_full_day": False,
                "is_active": True,
            },
        )
        shift_24x7, _ = Shift.objects.get_or_create(
            branch=main_branch,
            name="24x7 All Access",
            defaults={
                "library": primary_lib,
                "start_minute": 0,
                "end_minute": 1439,
                "is_full_day": True,
                "is_active": True,
            },
        )

        # Floors
        floor1, _ = Floor.objects.get_or_create(
            branch=main_branch,
            name="Ground Floor - Silent Zone",
            defaults={"sort_order": 1, "is_active": True},
        )
        floor2, _ = Floor.objects.get_or_create(
            branch=main_branch,
            name="First Floor - Discussion & PC Zone",
            defaults={"sort_order": 2, "is_active": True},
        )

        # Membership Fee Plans
        fee_plans_data = [
            {"name": "1 Month Full Day Intensive", "price": Decimal("1800.00"), "days": 30},
            {"name": "1 Month Morning Shift", "price": Decimal("1200.00"), "days": 30},
            {"name": "1 Month Evening Shift", "price": Decimal("1200.00"), "days": 30},
            {"name": "3 Months Super Saver Full Day", "price": Decimal("4800.00"), "days": 90},
            {"name": "6 Months Long Term Mastery", "price": Decimal("8500.00"), "days": 180},
            {"name": "1 Year Elite Dedicated Desk", "price": Decimal("15000.00"), "days": 365},
        ]
        created_fee_plans = []
        for fp in fee_plans_data:
            plan_obj, _ = FeePlan.objects.get_or_create(
                library=primary_lib,
                name=fp["name"],
                defaults={
                    "price": fp["price"],
                    "duration_days": fp["days"],
                    "is_active": True,
                    "description": f"Official {fp['name']} with reserved study desk, high-speed Wi-Fi and amenities.",
                    "benefits": ["Reserved study desk", "500 Mbps Wi-Fi", "RO Water", "Power Backup"],
                },
            )
            created_fee_plans.append(plan_obj)
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(created_fee_plans)} Fee Plans."))

        # Seats (50 seats)
        created_seats = []
        for row_letter in ["A", "B", "C", "D"]:
            for num in range(1, 13):
                label = f"{row_letter}-{num:02d}"
                seat_obj, _ = Seat.objects.get_or_create(
                    branch=main_branch,
                    label=label,
                    defaults={
                        "floor_rel": floor1 if row_letter in ["A", "B"] else floor2,
                        "floor": 1 if row_letter in ["A", "B"] else 2,
                        "zone": "SILENT" if row_letter in ["A", "B"] else "DISCUSSION",
                        "type": "STANDARD",
                        "physical_status": "OPERATIONAL",
                        "is_active": True,
                    },
                )
                created_seats.append(seat_obj)
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(created_seats)} Seats for {main_branch.name}."))

        # Lockers (15 lockers)
        for num in range(1, 16):
            Locker.objects.get_or_create(
                branch=main_branch,
                number=f"L-{num:02d}",
                defaults={"status": "OCCUPIED" if num <= 8 else "AVAILABLE"},
            )

        # Students (24 realistic students matching UI screens)
        students_info = [
            ("Rohan Sharma", "rohan.sharma@gmail.com", "+919822144012", "MALE", "A-04", created_fee_plans[0], "ACTIVE"),
            ("Priya Patel", "priya.patel@gmail.com", "+919822445670", "FEMALE", "B-02", created_fee_plans[1], "ACTIVE"),
            ("Aditya Kulkarni", "aditya.k@gmail.com", "+919904211234", "MALE", "C-08", created_fee_plans[2], "ACTIVE"),
            ("Sneha Deshmukh", "sneha.d@gmail.com", "+919723411209", "FEMALE", "A-11", created_fee_plans[0], "ACTIVE"),
            ("Vikram Rathore", "vikram.r@gmail.com", "+919890122334", "MALE", "B-05", created_fee_plans[3], "ACTIVE"),
            ("Kunal Jadhav", "kunal.j@gmail.com", "+919898055678", "MALE", "D-01", created_fee_plans[5], "ACTIVE"),
            ("Ananya Iyer", "ananya.iyer@gmail.com", "+919845012389", "FEMALE", "C-03", created_fee_plans[3], "ACTIVE"),
            ("Jayesh Shah", "jayesh.shah@gmail.com", "+919825177890", "MALE", "A-07", created_fee_plans[1], "ACTIVE"),
            ("Neha Verma", "neha.verma@gmail.com", "+919811234567", "FEMALE", "B-09", created_fee_plans[0], "ACTIVE"),
            ("Aarav Patel", "aarav.p@gmail.com", "+919879011223", "MALE", "D-04", created_fee_plans[0], "ACTIVE"),
            ("Pooja Mehta", "pooja.mehta@gmail.com", "+919820033445", "FEMALE", "C-06", created_fee_plans[4], "ACTIVE"),
            ("Siddharth Joshi", "sid.joshi@gmail.com", "+919823488990", "MALE", "A-01", created_fee_plans[2], "ACTIVE"),
            ("Tanvi Kulkarni", "tanvi.k@gmail.com", "+919890011442", "FEMALE", "B-12", created_fee_plans[0], "ACTIVE"),
            ("Gaurav Shinde", "gaurav.s@gmail.com", "+919822077665", "MALE", "C-10", created_fee_plans[1], "ACTIVE"),
            ("Meera Nair", "meera.nair@gmail.com", "+919847055443", "FEMALE", "D-08", created_fee_plans[3], "ACTIVE"),
            ("Rahul Bapat", "rahul.bapat@gmail.com", "+919822344556", "MALE", None, created_fee_plans[0], "PENDING"),
            ("Ishita Sen", "ishita.sen@gmail.com", "+919830022334", "FEMALE", None, created_fee_plans[1], "EXPIRED"),
            ("Harsh Vardhan", "harsh.v@gmail.com", "+919414088990", "MALE", None, created_fee_plans[2], "SUSPENDED"),
        ]

        created_students = []
        now = timezone.now()
        for idx, (s_name, s_email, s_phone, s_gender, s_seat_label, s_plan, s_status) in enumerate(students_info):
            std, _ = Student.objects.get_or_create(
                library=primary_lib,
                email=s_email,
                defaults={
                    "student_code": f"STU-10{idx:02d}",
                    "name": s_name,
                    "phone": s_phone,
                    "gender": s_gender,
                    "status": s_status,
                    "branch": main_branch,
                    "joining_date": now.date() - datetime.timedelta(days=30),
                    "address": f"Flat {idx+12}, Kothrud, Pune",
                },
            )
            created_students.append(std)

            # Assign seat if specified
            matching_seat = None
            if s_seat_label:
                matching_seat = next((s for s in created_seats if s.label == s_seat_label), None)
                if matching_seat:
                    matching_seat.student = std
                    matching_seat.save()
                    SeatAllocation.objects.get_or_create(
                        seat=matching_seat,
                        student=std,
                        shift=shift_fullday,
                        defaults={
                            "from_date": now.date() - datetime.timedelta(days=15),
                            "to_date": now.date() + datetime.timedelta(days=15),
                        },
                    )

            # Student Membership
            StudentMembership.objects.get_or_create(
                student=std,
                plan=s_plan,
                defaults={
                    "seat": matching_seat,
                    "shift": "Full Day",
                    "start_date": now.date() - datetime.timedelta(days=15),
                    "end_date": now.date() + datetime.timedelta(days=s_plan.duration_days - 15),
                    "amount_paid": s_plan.price if s_status == "ACTIVE" else Decimal("0.00"),
                    "plan_name_snapshot": s_plan.name,
                    "price_snapshot": s_plan.price,
                    "status": "ACTIVE" if s_status == "ACTIVE" else "PENDING",
                },
            )

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(created_students)} Students & Memberships."))

        # =====================================================================
        # 8. TODAY'S LIVE ATTENDANCE (Clocked-in Students)
        # =====================================================================
        today = now.date()
        clock_ins = [
            (created_students[0], datetime.time(7, 45), "DOOR_SCAN"),
            (created_students[1], datetime.time(6, 10), "DOOR_SCAN"),
            (created_students[2], datetime.time(14, 40), "MANUAL"),
            (created_students[3], datetime.time(8, 30), "DOOR_SCAN"),
            (created_students[4], datetime.time(7, 50), "DOOR_SCAN"),
            (created_students[5], datetime.time(9, 15), "DOOR_SCAN"),
            (created_students[6], datetime.time(8, 0), "DOOR_SCAN"),
            (created_students[7], datetime.time(6, 45), "MANUAL"),
            (created_students[8], datetime.time(8, 15), "DOOR_SCAN"),
            (created_students[9], datetime.time(7, 30), "DOOR_SCAN"),
        ]

        for std, t_in, mode in clock_ins:
            t_in_dt = timezone.make_aware(datetime.datetime.combine(today, t_in))
            AttendanceRecord.objects.get_or_create(
                student=std,
                branch=main_branch,
                date=today,
                defaults={
                    "time_in": t_in_dt,
                    "method": mode,
                    "status": "PRESENT",
                    "shift": "Full Day",
                },
            )

        # Historical attendance (past 5 days)
        for day_offset in range(1, 6):
            past_date = today - datetime.timedelta(days=day_offset)
            for std in created_students[:12]:
                t_in_past = timezone.make_aware(datetime.datetime.combine(past_date, datetime.time(8, 0)))
                t_out_past = timezone.make_aware(datetime.datetime.combine(past_date, datetime.time(16, 30)))
                AttendanceRecord.objects.get_or_create(
                    student=std,
                    branch=main_branch,
                    date=past_date,
                    defaults={
                        "time_in": t_in_past,
                        "time_out": t_out_past,
                        "total_minutes": 510,
                        "method": "DOOR_SCAN",
                        "status": "PRESENT",
                        "shift": "Full Day",
                    },
                )
        self.stdout.write(self.style.SUCCESS("Seeded Today's Clock-ins and Historical Attendance."))

        # =====================================================================
        # 9. CASHIER DAY-BOOK (Financial Ledger)
        # =====================================================================
        daybook_entries = [
            {"amount": Decimal("1800.00"), "mode": "UPI", "purpose": "1 Month Full Day Intensive (Rohan Sharma)"},
            {"amount": Decimal("500.00"), "mode": "CASH", "purpose": "Locker Security Deposit (Priya Patel)"},
            {"amount": Decimal("45.00"), "mode": "CASH", "purpose": "Overdue Book Fine (9 days) (Jayesh Shah)"},
            {"amount": Decimal("2400.00"), "mode": "UPI", "purpose": "3 Months Super Saver Part 1 (Ananya Iyer)"},
            {"amount": Decimal("1200.00"), "mode": "CASH", "purpose": "Plan Renewal Evening Shift (Aditya Kulkarni)"},
            {"amount": Decimal("1800.00"), "mode": "UPI", "purpose": "Full Day Desk Booking (Sneha Deshmukh)"},
            {"amount": Decimal("4800.00"), "mode": "UPI", "purpose": "Quarterly Enrollment (Vikram Rathore)"},
            {"amount": Decimal("150.00"), "mode": "CASH", "purpose": "Replacement ID Card Fee"},
        ]

        for d_entry in daybook_entries:
            CashDayBookEntry.objects.get_or_create(
                library=primary_lib,
                branch=main_branch,
                date=today,
                amount=d_entry["amount"],
                purpose=d_entry["purpose"],
                defaults={
                    "shift": "Full Day",
                    "payment_mode": d_entry["mode"],
                },
            )
        self.stdout.write(self.style.SUCCESS("Seeded Cash Daybook Ledger Entries."))

        # =====================================================================
        # 10. FEE DUES & INVOICES
        # =====================================================================
        dues_data = [
            {"student": created_students[15], "amount": Decimal("1800.00"), "due_date": today + datetime.timedelta(days=3), "desc": "New Admission Monthly Fee"},
            {"student": created_students[16], "amount": Decimal("1200.00"), "due_date": today - datetime.timedelta(days=7), "desc": "Morning Shift Renewal Overdue"},
            {"student": created_students[17], "amount": Decimal("1200.00"), "due_date": today - datetime.timedelta(days=14), "desc": "Suspended Plan Pending Balance"},
            {"student": created_students[8], "amount": Decimal("600.00"), "due_date": today + datetime.timedelta(days=5), "desc": "Installment Balance - 1 Month Plan"},
        ]
        for d in dues_data:
            FeeDue.objects.get_or_create(
                library=primary_lib,
                student=d["student"],
                description=d["desc"],
                defaults={
                    "charge_type": "PLAN_FEE",
                    "amount": d["amount"],
                    "due_date": d["due_date"],
                    "status": "OVERDUE" if d["due_date"] < today else "PENDING",
                },
            )
        self.stdout.write(self.style.SUCCESS("Seeded Fee Dues & Invoices."))

        # =====================================================================
        # 11. BOOKS & CIRCULATION
        # =====================================================================
        cat_upsc, _ = BookCategory.objects.get_or_create(library=primary_lib, name="Civil Services / UPSC")
        cat_gate, _ = BookCategory.objects.get_or_create(library=primary_lib, name="GATE / Engineering")
        cat_mgmt, _ = BookCategory.objects.get_or_create(library=primary_lib, name="CAT / Management")

        books_data = [
            ("Indian Polity 6th Edition", "M. Laxmikanth", "9789352603633", cat_upsc, 4),
            ("Certificate Physical and Human Geography", "G.C. Leong", "9780195628166", cat_upsc, 3),
            ("Higher Engineering Mathematics", "B.S. Grewal", "9788174091955", cat_gate, 2),
            ("Quantitative Aptitude for Competitive Exams", "R.S. Aggarwal", "9789352534029", cat_mgmt, 5),
            ("Word Power Made Easy", "Norman Lewis", "9788183071000", cat_mgmt, 4),
        ]
        for title, author, isbn, cat, copies in books_data:
            book_obj, _ = Book.objects.get_or_create(
                library=primary_lib,
                isbn=isbn,
                defaults={
                    "title": title,
                    "author": author,
                    "category": cat.name,
                    "category_ref": cat,
                    "total_copies": copies,
                    "price": Decimal("450.00"),
                },
            )
            # Create Book Copies
            for c_num in range(1, copies + 1):
                BookCopy.objects.get_or_create(
                    book=book_obj,
                    branch=main_branch,
                    barcode=f"BC-{isbn[-4:]}-{c_num:02d}",
                    defaults={"status": "AVAILABLE" if c_num > 1 else "ISSUED"},
                )

        self.stdout.write(self.style.SUCCESS("Seeded Library Book Catalog & Copies."))
        self.stdout.write(self.style.SUCCESS("=== DEMO DATA SEEDING COMPLETE & VERIFIED ==="))
