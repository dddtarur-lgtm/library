# Super Admin Website: Implementation Plan

Prepared 5 November 2026. Sources: Super Admin Website Building Document v1.0 (4 Nov 2026), the "One Website, Two Admins" structure document, and the multi-tenant database files already produced (`01_schema_multitenant.sql`, `02_migrate_from_legacy.sql`).

## 1. Summary

- The Super Admin site is the `platform` area of one Next.js app that also hosts the Library Admin. One server, one theme, one login, and the role decides which area opens.
- The work is split into 8 phases (0 to 7). The order follows the structure document: sign in and roles, library requests and libraries, plans and billing, notifications and email, content and app, reports and support, system health. Phase 0 prepares the repository and database, and Phase 7 hardens and launches.
- Every phase ends with a demo and exit checks that can be tested. The next phase starts only when the exit checks pass, except where a phase is marked parallel.
- Rough size: 20 to 24 weeks for 3 developers plus part-time QA and a product owner. This is an assumption, not a measured estimate. Re-estimate after Phase 0.

| Phase | Name | Weeks | Result you can see |
| --- | --- | --- | --- |
| 0 | Foundation | 2 | One app runs, database is live, shared UI parts exist |
| 1 | Sign in, roles, permissions | 2 to 2.5 | Platform team can sign in safely and see only what their role allows |
| 2 | Libraries | 4 | Requests approved, libraries managed, lock and suspend work |
| 3 | Plans, billing, plan lifecycle | 4 | Libraries pay, get grace, get locked, and unlock on renewal |
| 4 | Notifications and email | 3 | Platform messages and library email connections work |
| 5 | Students, support, content, app | 3 (two parallel tracks) | Tickets, website content, public page review, app controls |
| 6 | Reports, settings, audit and health | 3 | Full reporting, all settings, audit and system health |
| 7 | Hardening and launch | 2 to 3 | Security, performance, pilot libraries, go live |

Scope note: this plan covers the Super Admin site fully. It covers the Library Admin, the student app, and public library pages only where the Super Admin depends on them (registration, billing and lock screen, Connect Email, public page submission, and the blocked message for students). The Library Admin has a very large screen list of its own (students, seats, attendance, books, study hours, CRM and more) and needs its own plan.

## 2. What the documents cover, and what is missing

The Super Admin building document you uploaded ends at section 6.3.5 (Lock, unlock, and suspend dialogs). Its site map and the folder structure list many more screens, and section 2 points to a section 6.14 (users and roles) that is not in the file. For every screen without a written section, this plan uses the folder names, the site map, and the platform rules in section 3 of the building document as scope. Those items are marked Inferred and must be confirmed before their phase starts.

| Area | Spec status | Needed before |
| --- | --- | --- |
| Sign in and security (6.1) | Written, two step is a NEW suggestion | Phase 1 |
| Dashboard (6.2) | Written | Phase 3 (first version), Phase 6 (full) |
| Libraries: requests, list, detail, add, lock dialogs (6.3.1 to 6.3.5) | Written | Phase 2 |
| Roles (6.14) | Role list written in section 2, permission matrix missing | Phase 1 |
| Platform plans, subscriptions, billing | Inferred (plans, coupons, pricing preview, payments, failed payments, invoices, refunds, expiry tracker, commission) | Phase 3 |
| Notifications and email | Inferred (create, templates, scheduled, delivery report, logs, bounces, library connections) | Phase 4 |
| Students platform view, support | Inferred | Phase 5 |
| Website content, library page review, app management | Inferred | Phase 5 |
| Reports | Inferred (eight report names in the folder tree) | Phase 6 |
| Settings, audit and health, my account | Inferred | Phase 6 (my account in Phase 1) |

**Action for you:** send sections 6.4 onward of the building document. Phases 0 to 2 can start without them.

## 3. Conflicts and decisions to settle first

**Conflicts between the two documents**

| # | Conflict | Recommendation | Settle by |
| --- | --- | --- | --- |
| C1 | Two step verification: the building document says required for the Super Admin and optional for others. The structure document says required for all platform roles. | Require it for all platform roles. It is safer and uses one code path. | Phase 1 |
| C2 | Plan status and library status overlap. "Locked" appears as a plan status and as a library status. "Expired" and "Grace" are not defined against each other. | Plan status is calculated from dates only: Trial or Active, then Grace (5 days after the end date), then Locked. Expired means the plan ended and the library stayed locked past a set number of days, or it is closed. Library status (Active, Suspended, Closed) is set only by people. The "Locked" label in the library list means a plan lock or a manual lock. | Phase 2 |

**Decisions needed**

| # | Decision | Why it matters | Recommendation | Settle by |
| --- | --- | --- | --- | --- |
| D1 | Database access in Next.js (Prisma, Drizzle, or plain SQL) and how each request sets `app.library_id` and `app.is_platform` | Row Level Security only works if every request sets these on its own transaction | Drizzle or plain SQL with a request-scoped transaction wrapper | Phase 0 |
| D2 | Hosting and the scheduler for the 7 platform cron routes | Expiry, grace, lock and reminders depend on it | One host with a managed scheduler, secret header, and a job lock table | Phase 0 |
| D3 | Provider for platform emails (API based, no SMTP) | Reset links, welcome and status emails are needed from Phase 1 | A transactional email API such as SES, Resend, or Postmark | Phase 1 |
| D4 | SMS or OTP provider for mobile verification | A request cannot be approved until the mobile is verified | Pick one India-ready provider | Phase 2 |
| D5 | File storage for documents, logos, media | The schema stores file records only, not file bytes | S3 compatible storage with signed URLs | Phase 0 |
| D6 | Push provider for the student app | Needed for platform notifications | Firebase Cloud Messaging | Phase 4 |
| D7 | Confirm the four NEW roles (Support, Finance, Content, Auditor) and what each may see of student personal data | Defines the permission matrix | Start with the building document's table | Phase 1 |
| D8 | Is there a trial plan? (Trial status is NEW) | Changes the plan lifecycle and limits | Decide length and limits, or remove Trial | Phase 3 |
| D9 | Tax and invoices: GST details, invoice numbering, who issues an invoice for a manual payment, how refunds go through Razorpay | Needed for invoices and refunds | Finance to confirm | Phase 3 |
| D10 | Secret storage for each library's Razorpay keys and email OAuth tokens | Tokens are never shown and must be encrypted | App level encryption with a managed key | Phase 3 |

## 4. Rules that apply to every phase

- **One app, strict folders.** Routes live in `src/app/[lang]/(dashboard-layout)/platform/...`. Code lives in `src/common`, `src/platform`, `src/library`. Lint rules fail the build if platform imports library, library imports platform, or common imports either.
- **Three protection layers on every feature.** Middleware (sign in and role by address), area layouts (role check and menu), and every API route (permission check). A hidden button is never the only protection.
- **Tenant safety.** The library id comes from the session only. The app connects as the `lms_app` database role, so Row Level Security applies. Platform requests set `app.is_platform`.
- **Audit everything.** One `audit()` helper is called by every create, edit, delete, approve, lock, payment, permission change, and export. It records who, when, what, old value, and new value.
- **Shared parts, built once in Phase 0.** Data table (search, filters, sort, column chooser, pagination, saved filters, permission-checked export), risky action dialog (impact summary plus required reason), toasts, and standard loading, empty, error, and forbidden states.
- **Three languages from the first screen.** English, Hindi, Gujarati. No text typed directly into a screen.
- **Jobs and webhooks.** Every scheduled job is repeatable without harm, locked so two copies never run together, and logged. Every webhook verifies the signature and stores the event so a repeat is ignored.
- **Definition of done for a screen.** All states shown, all three languages, permissions enforced on the server, audit entries written, works on desktop, tablet, and phone, keyboard and screen reader friendly, and tests added.

## 5. Database changes needed on top of the existing schema

The existing multi-tenant schema already covers libraries, subscriptions, branches, library members, students, seats, notifications, activity log, support tickets, and retention. The two new documents need more. Add these as numbered scripts (`03_...`) in the phase that needs them.

| Need from the documents | Add | Phase |
| --- | --- | --- |
| Approval queue with More information needed, documents with checks, verification checklist, internal notes, request number | `library_requests`, `library_request_documents`, `library_request_notes`, email and mobile verified timestamps on users, library code on libraries | 2 |
| Platform roles beyond three fixed values, permission matrix, custom roles | `platform_roles`, `platform_role_permissions`, link from users. Replace the fixed check on `platform_admins` | 1 |
| Two step verification, trusted devices for 30 days, lockout after 5 attempts, session list | `user_totp_factors`, `user_backup_codes`, `trusted_devices`, `user_sessions`, `sign_in_attempts` | 1 |
| Manual lock, scheduled lock, notify owner, student plan days pause and resume | `library_locks` with reason and dates, plus paused day accounting on memberships | 2 |
| Limits override with a reason, internal notes on a library | `library_limit_overrides`, `library_internal_notes` | 2 |
| Discounts, coupons, invoices with tax, refunds, failed payment attempts, Razorpay webhook events, commission setting (off) | `coupons`, `coupon_redemptions`, `library_discounts`, `platform_invoices`, `platform_refunds`, `payment_attempts`, `webhook_events`, commission rows in platform settings | 3 |
| Sub admin rule: one per branch, two for the main branch | Database trigger that counts sub admins per branch | 2 |
| Library email connection with encrypted tokens, platform email templates, logs, bounces, queue | `library_email_connections`, `email_templates`, `email_logs`, `email_bounces`, `email_queue` | 4 |
| Notification templates and per-channel delivery results | `notification_templates`, delivery columns on recipients | 4 |
| Website content, media, menus, SEO, contact messages, directory, legal pages | `cms_pages`, `cms_page_versions`, `media_assets`, `menus`, `contact_messages`, `directory_listings` | 5 |
| Library public page status Published, Hidden, Needs review | `library_public_pages`, `library_page_reviews` | 5 |
| App versions, maintenance, banners, feature switches, translation overrides, usage | `app_versions`, `maintenance_windows`, `app_banners`, `feature_flags`, `translation_overrides`, `app_usage_events` | 5 |
| Reported student cases, feedback, help centre | `student_reports`, `feedback`, `help_articles` | 5 |
| Saved and scheduled reports | `scheduled_reports`, `report_runs` | 6 |
| Jobs, errors, storage usage for system health | `job_runs`, `error_events`, `storage_usage_snapshots` | 6 |
| Old and new values on every audit entry | Standardise `details` as `{before, after}` on `activity_logs` | 1 |

Before any of this, the two existing SQL files have never been run on a real PostgreSQL. Running them on a staging copy is the first task of Phase 0.

## 6. The phases

### Phase 0: Foundation (about 2 weeks)

**Goal:** one app runs, the database works, and every later screen can use the same building blocks.

**Build**

1. Restructure the project as described in the structure document (steps 1 to 6): path aliases, the three source folders, delete duplicate `pages/*` routes and template demo screens, remove `smtp-config`, move the dashboard shell into `(dashboard-layout)`.
2. Add the import rules to lint and set up CI: lint, type check, build, tests, and a preview deployment.
3. Create dev, staging, and production environments, `.env.example`, and secret handling.
4. Run `01_schema_multitenant.sql` and `02_migrate_from_legacy.sql` on a staging PostgreSQL. Fix every error. Compare the row counts the migration prints.
5. Build the database access layer (D1) with request-scoped tenant settings. Add an automated test that proves a library session cannot read another library's rows.
6. Build the shared parts from section 4 (data table, risky action dialog, toasts, state components, form pattern with a warning on unsaved changes) in the Able Pro look. Build the language loader that merges common and area words for en, hi, gu.
7. Close decisions D1, D2, D5.
8. Start the Google and Microsoft OAuth app registrations and the Razorpay live account now. Both can take weeks.

**Exit checks**

- `npm run dev` serves `/en/sign-in`, `/en/platform/dashboard`, and `/en/library/dashboard` on one port.
- A deliberate import from platform into library fails the build.
- Both SQL files run clean on staging and the tenant isolation test passes.

### Phase 1: Sign in, roles, permissions, my account (about 2 to 2.5 weeks)

**Covers:** building document 6.1, users and roles, my account.

**Build**

1. Sign in with email or mobile. One general error message. After 5 wrong attempts block the account for 15 minutes and alert the owner. Inactive and removed users cannot sign in.
2. Two step verification: authenticator app or email code, resend timer, backup codes, remember this device for 30 days (conflict C1).
3. Forgot and reset password: link or code valid 15 minutes and works once, password rules, all other sessions signed out after a reset.
4. Session expiry after 30 minutes without activity (setting), returning to the same page after sign in. Redirect by role after sign in.
5. The three protection layers: middleware, `platform/layout`, and the permission guard for API routes. Permission engine `can(user, action, module)` and a `<Can>` component. The menu hides anything the role cannot use.
6. Roles: the five default roles (Super Admin, Support Manager, Finance Manager, Content Manager, Auditor) and custom roles with a permission matrix per screen and action. Team screens: add, edit, deactivate, send invite.
7. My account: profile, security, sessions (with sign out other sessions), preferences, alerts.
8. The `audit()` helper and a basic audit log list. A basic platform email sender with the templates for reset, invite, and lockout alert (D3).
9. Status pages: 401, 404, maintenance.

**Exit checks**

- An automated test runs every role against every module and action and matches the permission matrix. The Auditor can change nothing.
- A library user opening a platform address gets the Unauthorized page, and a call to a platform API from a library session is refused.
- Lockout, reset link single use, session expiry, and mandatory two step all pass tests.

### Phase 2: Libraries (about 4 weeks)

**Covers:** building document 6.3.1 to 6.3.5.

**2A. Requests and approval (weeks 1 to 2)**

- Library registration on the library side with email and mobile verification (D4).
- Request queue with the listed columns and filters. Review panel with registration data, owner details, planned branches, documents with a check mark each, logo and draft public page, verification checklist, and internal notes.
- Duplicate warning when mobile, email, library name, or address matches an existing library.
- Approve creates the library, the main branch, and the admin account, sends the welcome email, and starts the onboarding steps for the chosen plan. It is blocked until email and mobile are verified. Reject needs a reason and can be reopened. Ask for more information sets the status and emails the owner. Every status change emails the owner and is audited.

**2B. All libraries and library detail (weeks 2 to 4)**

- List with all columns, filters, row actions (View, Add payment, Lock or Unlock, Send notification), and bulk actions. Bulk send notification and Add payment switch on when Phases 3 and 4 land.
- Detail page with tabs: Overview, Admins and staff (resend invite, send reset link, deactivate, never show a password), Branches (rule: one sub admin per branch, two for the main branch), Students summary (counts only, no personal details), Activity, Internal notes, Limits override, Danger zone (Delete only for the Super Admin, only after archive and the retention period, library name typed to confirm).
- Tabs that depend on later phases (Plan and billing, Public page, Email connection, Notifications) are hidden behind feature switches until built, so there are no dead screens.

**2C. Manual add, lock, suspend (week 4)**

- Add library manually: skips the approval queue, sends an invite, logged as created by the team member.
- Lock, unlock, and suspend dialogs with a required reason, effective now or scheduled, notify the owner, and an impact summary of affected students and staff.
- Lock effects: the student app shows that the library is facing some issue, student plan days pause and resume on unlock. Suspend blocks library admins and students. Publish a small API contract so the student app can read the library state.
- View as library admin, read only: a signed read-only session with a visible banner and a full audit record.

**Exit checks**

- End to end: register, verify, review, approve, welcome email arrives, admin signs in to the library area.
- A duplicate request shows the warning. An unverified request cannot be approved.
- Lock, then unlock: student plan end dates move by the locked days. Suspend blocks both library and student access.
- The sub admin rule rejects a second sub admin on a normal branch.

### Phase 3: Plans, billing, and plan lifecycle (about 4 weeks)

**Covers:** platform plans, subscriptions and billing, dashboard first version. Spec status: Inferred, so confirm D8, D9, D10 and the written spec first.

**3A. Plans and payments (weeks 1 to 2)**

- Platform plans: add, edit, pricing preview, limits (students, branches, sub admins), coupons.
- Subscriptions and billing screens: subscriptions list and detail, payments, manual payment, failed payments, invoices, refunds. The commission screen exists but stays off.
- Library side: billing pricing, payment, and invoices screens with Razorpay checkout.
- Razorpay webhook for library plan payments: signature check, stored events, repeat events ignored.
- Library detail Plan and billing tab: change plan, extend days with a reason, add manual payment, give discount, plan history.

**3B. Lifecycle engine (weeks 3 to 4)**

- Cron routes: expiry check, reminders, grace and lock.
- 5 day grace period with a daily notification and a warning banner in the library header and bottom area. After grace the library locks.
- Library layout shows the lock screen when the library is locked. The student app is blocked even if the student's own plan is valid. Student days pause and continue.
- Renewal or manual payment unlocks automatically and sends a notice. Limits are enforced from the plan plus any override.
- All dates use the configured time zone (India by default).
- Dashboard first version: top cards (total, active, pending, grace, locked, revenue this month, failed payments) and the lists that need only library and payment data.

**Exit checks**

- A test library moves through Trial or Active, Grace, Locked, and back to Active using a controllable clock.
- Sending the same Razorpay webhook twice records one payment.
- Invoice generated for online and manual payments. A refund is recorded and audited.
- Plan limits block the action that would exceed them, and an override lifts the limit.

### Phase 4: Notifications and email (about 3 weeks)

**Covers:** notifications and email screens. Spec status: Inferred.

**Notifications**

- Create screen for the platform level (library and student levels are sent from their own sites). Audience: all libraries, selected libraries, filtered libraries.
- Dialog variants: text only, half image, full image. Templates, scheduled messages with a scheduler cron, delivery report, notification detail.
- Library detail Notifications tab and the bulk Send notification action from All libraries.
- Channels: in app, push (D6), and email. Recipient language follows their preference (en, hi, gu).

**Email**

- Platform email settings, templates per language, logs, bounces, and the email queue cron with retries.
- Library connections monitor (Connected, Not connected, Needs reconnect) and the library detail Email connection tab: send test email, ask to reconnect, disconnect. Tokens are never shown.
- Library side Connect Email: Google and Microsoft OAuth, callback addresses registered for local and live, encrypted token vault, status, send test, disconnect.
- Move the email logic into `common/email-core` as in the structure document.

**Exit checks**

- A scheduled platform notification reaches a test library admin and a test student device at the set time, once.
- A bounce shows in Bounces. A library that connects, then revokes access, shows Needs reconnect.
- No token appears in any screen, log, or API response.

### Phase 5: Students view, support, content, app management (about 3 weeks, two parallel tracks)

Spec status: Inferred for every item. Confirm before starting.

**Track A: People**

- Students (platform view): search across libraries and a student profile with access limited by role (D7). Reported cases.
- Support: tickets with replies and status, feedback, help centre. Dashboard lists for open tickets.

**Track B: Content and app**

- Website content: pages with an editor, SEO, media, menus, contact messages, directory, legal pages.
- Library public pages review: Published, Hidden, Needs review, preview link, review actions. Connects to the library Public page tab.
- App management: versions, maintenance mode, banners, feature switches, translation overrides, usage.
- The public marketing website (`public-layout`) stays optional and later. This content feeds it.

**Exit checks**

- A support ticket opened by a library appears, gets a reply, and closes.
- A library page submitted for review can be approved, hidden, or sent back.
- A maintenance window shows the maintenance page and the student app message.
- A Content Manager can edit content but cannot open billing.

### Phase 6: Reports, settings, audit and system health (about 3 weeks)

**Reports**

- Libraries, revenue, renewals and churn, students, usage, email, support, team activity, and scheduled reports. Exports only for roles with export permission, and every export is logged.
- Dashboard full version: all charts (growth, revenue by month, plan distribution, student statuses, 30 day expiry forecast), date range, compare with previous period.

**Settings**

- General, library rules (grace days, lock rules), student rules, payments (Razorpay), tax and invoices, notification defaults, security (session time, two step policy), integrations, backup and data.

**Audit and health**

- Audit log viewer with filters and export, sign in history, jobs, errors, webhooks, storage usage, and a status page.
- Turn on the nightly retention job, set the closed library purge window, and run a backup and restore drill.

**Exit checks**

- Every number on the dashboard matches the underlying list when opened.
- Every action in the audit table of the building document appears in the audit log with old and new values.
- A restore from backup into staging works and is timed.

### Phase 7: Hardening and launch (about 2 to 3 weeks)

- **Security:** tenant isolation tests on every table, the permission matrix tests, rate limits on sign in and reset, dependency audit, secret review, and an external penetration test.
- **Performance:** load test with sample data of 5,000 libraries and 500,000 students. Check indexes and page speed on large lists.
- **Quality:** accessibility pass (keyboard, contrast, screen reader labels), phone and tablet pass, Hindi and Gujarati review by native readers.
- **Pilot:** 2 to 3 real libraries use the system for at least one full plan cycle step (approval, payment, reminder).
- **Cutover:** two rehearsals of the data migration, final migration with a rollback plan, monitoring and alerts, runbooks, and training notes for the platform team.

**Exit checks:** signed off security report, pilot feedback closed, rehearsal migration clean, go live checklist complete.

## 7. Main risks

| Risk | What to do |
| --- | --- |
| Half of the Super Admin spec is not written yet | Send sections 6.4 onward before Phases 3 to 6 start. Keep Inferred items marked. |
| The SQL files have never been run | Run them on staging in Phase 0 and treat the first run as a test. |
| Google and Microsoft OAuth review and Razorpay live activation take weeks | Start all three in Phase 0. |
| Plan lifecycle bugs (time zones, repeat jobs, paused student days) lose money or lock the wrong library | Controllable clock tests, repeat-safe jobs, and a dry run mode for lock jobs. |
| One library seeing another's data | Row Level Security, composite keys, automated isolation tests, and a review in Phase 7. |
| The Library Admin screen list competes for the same developers | Make a separate plan for it and share the common parts from Phase 0. |
| Translation quality in Hindi and Gujarati | Keep one dictionary per area and add native review in Phase 7. |

## 8. Next steps this week

1. Send the missing sections 6.4 onward of the Super Admin building document.
2. Decide C1, C2, and D1 to D5.
3. Register the Google and Microsoft OAuth apps and apply for the Razorpay live account.
4. Run the two SQL files on a staging PostgreSQL and send back the errors.
5. Start Phase 0.

## 9. Frontend plan: approach, stack, and structure rules

Both admins stay in one Next.js app, but the frontend is reorganised into feature folders so each admin grows without mixing with the other. Route files become thin, and each module owns its own components, hooks, services, schemas, and words. Sections 10 to 12 give the full folder trees and section 13 gives the frontend phases.

**Decision: one app, two separate admin source trees.** `src/platform` and `src/library` sit over one shared `src/common`. Do not split into two apps now. Move to a monorepo (`apps/platform`, `apps/library`, `packages/ui`) only if the two admins need separate release schedules, separate teams or hosting, or a build that takes over about 10 minutes. The rules below make that move mechanical.

**Stack choices.** The first two rows come from the structure document. The rest are my recommendations and are not decided yet. Confirm them in FE-0.

| Concern | Choice | Reason |
| --- | --- | --- |
| Framework | Next.js App Router, TypeScript strict | Already in the structure document |
| UI kit | shadcn style primitives on Tailwind, Able Pro look through design tokens | Already in the building document |
| Server data | Server components for first load, TanStack Query for client lists, mutations, and cache | Fast first paint, and filters and pages update without full reloads |
| Tables | TanStack Table inside one shared data table | One table behaviour in both admins |
| Forms | React Hook Form and Zod. The Zod schema lives in the feature and is reused by the API route | One rule set on screen and on the server |
| List state | Filters, sort, page, and tab live in the URL | Shareable links, back button works, saved filters are easy |
| App state | Plain React state. One small store only for shell items (sidebar, theme) | Avoids a global store full of screen data |
| Charts | One wrapper in `common/charts` over Recharts | Same look and same loading and empty states |
| Words | Existing `[lang]` routing. Dictionaries split by feature file, for example `dictionaries/en/libraries.json` | Words stay next to their screens |
| Fonts | Noto Sans with Devanagari and Gujarati fallbacks | Hindi and Gujarati must render cleanly. Design labels for text 30 to 40 percent longer |
| Tests | Vitest and Testing Library for components, Playwright for flows, a dev-only component gallery page for `common/ui` | Catches broken screens before review |

**Structure rules (enforced by lint and review)**

1. **Route files are thin.** A `page.tsx` reads the address parameters, checks permission, loads data, and renders one screen component from a feature. No business logic and no long markup.
2. **One folder per feature.** Inside: `components`, `hooks`, `services`, `schemas`, `types`, `constants`, `lib`, and an `index.ts`. The `index.ts` is the only file other code may import.
3. **No reaching into another feature.** A feature may import `common`, its own admin's `shared` folder, and another feature's `index.ts` only when listed as allowed. If two features need the same part, move it to the admin's `shared`. If both admins need it, move it to `common`, but only once two places really use it.
4. **Naming.** Folders and files in kebab-case. Components exported in PascalCase. Hooks `use-*.ts`, schemas `*.schema.ts`, services `*.service.ts`, types `*.types.ts`. Tests sit beside the file in `__tests__`.
5. **Server code stays out of components.** Anything with secrets or database access is marked `server-only`. Browser code reaches the server only through a service that uses `common/api-client`.
6. **Four states on every screen.** Loading, empty, error, and forbidden, each from the shared state components.
7. **Permission declared once.** Each route is listed in the admin's route config with its module and action. The menu, middleware, layout, page, and `<Can>` all read that one list.
8. **Heavy parts load on demand.** The seat builder, rich text editor, charts, and PDF or Excel export are loaded only when the screen needs them.

## 10. Shared frontend (src/common): design system, layouts, patterns

`src/common` is the only code both admins use, and it is built in four layers. The two admins look identical because they use the same layers. They differ only in menu, screens, and permissions.

1. **Tokens.** Light and dark colour variables, type scale, spacing, radius, shadows, motion. Every status named in the documents is defined once in a single status map with its colour, icon, and label key, so a badge never relies on colour alone.
2. **Primitives (`ui`).** The shadcn style set: buttons, inputs, selects, date picker, dialog, drawer, tabs, toast, badge, skeleton. No business words inside.
3. **Patterns.** Parts built from primitives that many screens reuse: data table, filter bar, page header, risky action dialog, form kit, state components.
4. **Shells.** The dashboard shell with header, sidebar, and banner slots. Each admin passes its own menu to the same shell.

**Status map (one file)**

| Group | Statuses |
| --- | --- |
| Library request | Pending, More information needed, Approved, Rejected |
| Plan | Trial, Active, Grace, Locked, Expired |
| Library | Active, Suspended, Locked, Closed |
| Student | Live, Pending, Expired, Suspended |
| Email connection | Connected, Not connected, Needs reconnect |
| Public page | Published, Hidden, Needs review |

**Folder tree**

```
src/common/
├── design-system/
│   ├── tokens/                  # colors (light, dark), typography, spacing, radius, shadows, motion
│   ├── status-map.ts            # every status -> colour, icon, label key
│   └── icons/
├── ui/                          # primitives, no business words
│   ├── button/  input/  select/  checkbox/  switch/  radio/  textarea/  date-picker/
│   ├── dialog/  drawer/  popover/  tooltip/  tabs/  accordion/  toast/  badge/  avatar/  skeleton/
│   └── index.ts
├── patterns/                    # built from ui, reused by many screens
│   ├── data-table/              # table, toolbar, column-chooser, pagination, bulk-bar, saved-filters, export-menu
│   ├── filter-bar/
│   ├── page-header/             # title, breadcrumbs, one main action
│   ├── stat-card/
│   ├── status-badge/
│   ├── confirm-risk-dialog/     # impact summary + required reason
│   ├── form-kit/                # field wrapper, error text, unsaved-changes guard, form section
│   ├── states/                  # loading, empty, error, forbidden, offline
│   ├── timeline/
│   ├── route-tabs/              # tabs that are real routes (library detail)
│   ├── notification-dialog-preview/   # text only, half image, full image
│   ├── charts/                  # line, bar, donut, forecast wrappers
│   ├── file-dropzone/
│   └── rich-text-editor/        # loaded on demand
├── layout/
│   ├── dashboard-shell/         # header, sidebar frame, content area, top and bottom banner slots
│   ├── sidebar/                 # renders a menu config, hides items by permission
│   ├── header/                  # global search, language switcher, alert bell, theme switcher, user menu
│   ├── auth-shell/
│   └── status-shell/            # 401, 404, maintenance
├── auth/                        # components, server (NextAuth, session, role guards), hooks, schemas
├── permissions/                 # engine can(user, action, module), <Can>, server guard
├── i18n/                        # config (en, hi, gu), dictionaries/{en,hi,gu}/common.json, helpers
├── data/                        # query client, query key helpers, URL state hooks (filters, sort, page, tab)
├── api-client/                  # auth header, timeout, safe retry for GET, error mapping
├── notifications-core/  email-core/  payments-core/
├── hooks/  lib/  schemas/  types/  configs/  assets/
```

**Quality bar for every shared part:** typed props, an entry in the dev-only component gallery, English, Hindi, and Gujarati text, keyboard and screen reader support, loading and empty states where they apply, and one test.

## 11. Platform Admin frontend structure

The Platform Admin is split into thin routes in `src/app` and feature modules in `src/platform`. The route folders stay as in the structure document. What changes is that each route folder now holds only `page.tsx`, `loading.tsx`, and `error.tsx`, and the screen itself comes from a feature.

**Thin route example**

```
src/app/[lang]/(dashboard-layout)/platform/libraries/[id]/
├── layout.tsx        # library header + route-tabs (Overview, Admins and staff, ... Danger zone)
├── overview/page.tsx # reads id, checks permission, renders <LibraryOverviewScreen id={id} />
├── plan-billing/page.tsx
└── ...               # one folder per tab, same pattern
```

**Folder tree of `src/platform`**

```
src/platform/
├── app-config/
│   ├── navigation.ts      # menu groups -> items -> route key (Overview, Libraries, Money, People, ...)
│   ├── routes.ts          # route key -> path, module, action: the one list read by menu, middleware, layout, page, <Can>
│   ├── permissions.ts     # module and action keys, default roles (Super Admin, Support, Finance, Content, Auditor)
│   └── constants.ts       # grace days default, page sizes
├── dictionaries/{en,hi,gu}/   # one json per feature: libraries.json, billing.json, ...
├── shared/                # only for parts used by 2+ platform features
│   ├── components/        # library-picker, plan-status-badge, money-cell, owner-cell, impact-summary
│   └── hooks/  lib/  types/
└── features/
    ├── dashboard/
    │   └── components/    # cards/ (8 stat cards), charts/ (growth, revenue, plan-mix, student-status, expiry-forecast),
    │                      # lists/ (pending-requests, expiring-7d, grace-locked, latest-payments, open-tickets, email-attention),
    │                      # quick-actions/, date-range-compare/
    ├── library-requests/
    │   └── components/    # requests-table/, review-panel/ (registration-data, owner-details, documents-check,
    │                      # verification-checklist, duplicate-warning, internal-notes), decision-dialogs/ (approve, reject, more-info)
    ├── libraries/
    │   └── components/    # libraries-table/, bulk-actions/, add-library-form/, view-as-banner/,
    │                      # detail/ (header/, overview/, admins-staff/, branches/, plan-billing/, students-summary/,
    │                      #   public-page/, email-connection/, notifications/, activity/, notes/, limits-override/, danger-zone/),
    │                      # dialogs/ (lock, unlock, suspend, extend-plan, add-payment, change-plan, discount, delete-library)
    ├── plans/
    │   └── components/    # plans-table/, plan-form/, pricing-preview/, coupons/
    ├── billing/
    │   └── components/    # subscriptions/, payments/, manual-payment-form/, failed-payments/, invoices/, refunds/,
    │                      # expiry-tracker/, commission/ (hidden while off)
    ├── students/
    │   └── components/    # student-search/, student-profile/, reported-cases/
    ├── notifications/
    │   └── components/    # composer/ (audience-picker, dialog-variant-picker, preview, schedule), templates/, scheduled/, delivery-report/
    ├── email/
    │   └── components/    # settings/, templates/ (editor), logs/, library-connections/, bounces/
    ├── website-content/
    │   └── components/    # page-editor/, seo/, media-library/, menus/, contact-messages/, directory/, legal/
    ├── library-pages/
    │   └── components/    # review-queue/, review-panel/
    ├── app-management/
    │   └── components/    # versions/, maintenance/, banners/, feature-switches/, translations/, usage/
    ├── reports/
    │   └── components/    # report-shell/ (filters, export), libraries/, revenue/, renewals-churn/, students/,
    │                      # usage/, email/, support/, team-activity/, scheduled/
    ├── support/
    │   └── components/    # tickets/, ticket-thread/, feedback/, help-centre/
    ├── users-roles/
    │   └── components/    # team/, invite-form/, roles/, permission-matrix/
    ├── settings/
    │   └── components/    # general/, library-rules/, student-rules/, payments/, tax-invoices/,
    │                      # notification-defaults/, security/, integrations/, backup-data/
    ├── audit-health/
    │   └── components/    # audit-log/, sign-in-history/, jobs/, errors/, webhooks/, storage-usage/, status/
    └── my-account/
        └── components/    # profile/, security/ (password, two step, backup codes), sessions/, preferences/, alerts/
```

**Every feature has the same inner template** (shown once, not repeated above):

```
features/<name>/
├── components/    # screens and parts, one folder per sub-screen
├── hooks/         # use-<thing>-query.ts, use-<thing>-mutation.ts
├── services/      # <name>.service.ts, API calls only
├── schemas/       # *.schema.ts (Zod), shared with the API route
├── types/         # *.types.ts
├── constants/
└── index.ts       # the only public entry
```

**Where the written screens of the building document land**

| Building document | Feature folder | Route |
| --- | --- | --- |
| 6.1 Sign in, two step, reset, session expired | `common/auth` (shared with the library admin) | `(auth)/...` |
| 6.2 Dashboard | `features/dashboard` | `platform/dashboard` |
| 6.3.1 Library requests | `features/library-requests` | `platform/library-requests` |
| 6.3.2 All libraries | `features/libraries/components/libraries-table` | `platform/libraries` |
| 6.3.3 Library detail | `features/libraries/components/detail` | `platform/libraries/[id]/...` |
| 6.3.4 Add library manually | `features/libraries/components/add-library-form` | `platform/libraries/add` |
| 6.3.5 Lock, unlock, suspend dialogs | `features/libraries/components/dialogs` | opened from list and detail |

**Platform specific rules**

- Only this admin may show data across libraries. Every list here asks the API for platform scope, never for a single session library.
- Risky actions (lock, suspend, delete, refund, role change) always use the shared risky action dialog with an impact summary and a required reason.
- Export buttons render only for roles with export permission, and each export call is logged by the server.
- Student screens show personal data only to roles allowed by the permission matrix. The library detail page shows counts only.

## 12. Library Admin frontend structure

The Library Admin follows the same pattern as the Platform Admin: thin routes in `src/app` and feature modules in `src/library`. It is a daily operations tool, so it adds three things the platform side does not need: a branch scope, a plan state layer (grace banners and the lock screen), and a read-only mode for when the platform opens a library with View as library admin.

**Folder tree of `src/library`**

```
src/library/
├── app-config/
│   ├── navigation.ts        # library menu groups -> items -> route key
│   ├── routes.ts            # route key -> path, module, action (one list for menu, middleware, layout, page, <Can>)
│   ├── permissions.ts       # module and action keys, defaults for Admin, Sub Admin, Staff
│   └── constants.ts
├── dictionaries/{en,hi,gu}/ # one json per feature
├── shared/                  # only for parts used by 2+ library features
│   ├── components/          # branch-switcher, student-picker, seat-picker, student-status-badge, money-cell, student-card
│   ├── providers/           # branch-scope-provider, read-only-provider
│   └── hooks/  lib/  types/
└── features/
    ├── plan-state/          # library plan lifecycle on screen
    │   └── components/      # grace-banner-top/, grace-banner-bottom/, lock-screen/, renew-button/, limit-reached-dialog/
    ├── dashboard/
    │   └── components/      # today-cards/, attendance-today/, dues-and-expiries/, quick-actions/, branch-summary/
    ├── students/
    │   └── components/      # students-table/, student-form/, student-profile/ (details, plan, payments, attendance, seat),
    │                        # join-requests/, status-dialogs/ (approve, reject, suspend)
    ├── staff/
    │   └── components/      # staff-table/, staff-form/, permission-picker/
    ├── branches/
    │   └── components/      # branches-table/, branch-details/, branch-analytics/, change-requests/
    ├── seats/
    │   ├── components/      # seat-map/ (live view), assign-dialog/, change-requests/, lockers/,
    │                        # builder/ (canvas/, palette/, inspector/, toolbar/, preview/)
    │   └── lib/             # grid-utils.ts, label-generator.ts, layout-history.ts (undo, redo)
    ├── attendance/
    │   └── components/      # attendance-table/, manual-mark-dialog/, qr-kiosk/, holidays/
    ├── study-hours/
    │   └── components/      # sessions/, goals/, leaderboard/
    ├── books/
    │   └── components/      # catalogue/, circulation/, overdue-fines/, requests/
    ├── plans/               # student plans of this library
    │   └── components/      # plan-catalogue/, memberships/, coupons/, day-book/, dues/, record-payment-dialog/
    ├── notifications/
    │   └── components/      # composer/, templates/, inbox/, analytics/
    ├── email/
    │   └── components/      # connect/ (provider cards, status, test send, disconnect), templates/, logs/
    ├── crm/
    │   └── components/      # leads-table/, lead-form/, follow-ups/
    ├── reports/
    │   └── components/      # report-shell/, financial/, attendance-analytics/, seats-occupancy/, scheduled/
    ├── activity-logs/
    │   └── components/      # log-table/, archive/, security-alerts/, staff-summary/
    ├── support/
    │   └── components/      # tickets/, ticket-thread/, knowledge-base/, service-status/
    ├── billing/             # this library's own platform subscription
    │   └── components/      # pricing/, payment/ (Razorpay checkout), invoices/
    ├── settings/
    │   └── components/      # public-page/, facilities-achievers/, shifts-rules/, payment-gateway/, reviews/, leads/, data-backup/
    └── account/
        └── components/      # profile/, general/, notifications/, plan-and-billing/, security/
```

Every feature uses the same inner template as the platform side (`components`, `hooks`, `services`, `schemas`, `types`, `constants`, `index.ts`).

**Library specific rules**

- **Branch scope.** A branch switcher sits in the header for Admins. A Sub Admin or Staff member sees only their own branch. `branch-scope-provider` puts the selected branch into every list query, so a screen never builds its own branch filter.
- **Plan state layer.** The library layout asks `plan-state` for the current state. In Grace, it shows the warning banner in the header and bottom area, with a daily reminder. In Locked, it replaces every screen except Billing, invoices, Support, and data export with the lock screen. Banner slots come from `common/layout`.
- **Read-only mode.** When a platform user opens the library with View as library admin, `read-only-provider` disables every create, edit, and delete control and shows a fixed banner. The server refuses writes as well.
- **Role aware screens.** Admin, Sub Admin, and Staff use the permission keys from the database (for example `students.approve`, `payments.record`, `revenue.view`). A control the role cannot use is hidden. Revenue figures are hidden unless the role has `revenue.view`.
- **Library id from the session.** No screen or service ever puts a library id in the address or request body.
- **Seat builder.** Lives in `seats/components/builder` and is loaded on demand. Elements: study desk, silent cabin, PC terminal, entry door, reception desk, pillar or wall, book shelf, RO water point, air conditioner. Labels are generated by `label-generator.ts` (A-01 row by row, Cabin 1, PC A-01). Floating panels (palette, inspector, toolbar) over one canvas, with Edit and Live preview modes, and undo and redo from `layout-history.ts`.

**Screens the Super Admin depends on** (build these early inside this admin)

| Need | Feature folder |
| --- | --- |
| Library registration and verification | `common/auth` (`register`, `verify-email`) |
| Grace banners and lock screen | `features/plan-state` |
| Plan pricing, Razorpay payment, invoices | `features/billing` |
| Connect Email (Google, Microsoft) | `features/email/components/connect` |
| Public page content for platform review | `features/settings/components/public-page` |
| Support tickets to the platform | `features/support` |

## 13. Frontend phases for both admins

The frontend runs as its own track of nine short phases (FE-0 to FE-8). Each one is tied to a main phase from section 6 so a screen is never built before its backend exists. The shared layers come first, and both admins use them from the start.

| Frontend phase | Main phase | Weeks | Platform Admin work | Library Admin work |
| --- | --- | --- | --- | --- |
| FE-0 Foundation | 0 | 2 | Move to the new folder layout (sections 10 to 12), path aliases, lint boundary rules, tokens and theme (light and dark), fonts for Hindi and Gujarati, status map, dashboard shell with menu config and banner slots, per-feature dictionaries, route config, dev-only component gallery | Same work, shared |
| FE-1 Shared patterns | 0 to 1 | 2 | Data table, filter bar with URL state, page header, stat card, risky action dialog, form kit with unsaved changes warning, state components, route tabs, file dropzone, chart wrappers, timeline | Same work, shared |
| FE-2 Sign in and account | 1 | 2 | Sign in, two step, forgot and new password, session expired, status pages, my account, team and roles with the permission matrix, permission-aware menu and `<Can>` | Library registration and email verification, pending approval screen, account shell |
| FE-3 Libraries | 2 | 4 | Library requests (list, review panel, decision dialogs), all libraries, library detail tabs, add library, lock, unlock, suspend dialogs, View as library admin banner | Branch scope provider, read-only provider, library dashboard shell |
| FE-4 Plans and billing | 3 | 4 | Plans and coupons, subscriptions, payments, manual payment, failed payments, invoices, refunds, expiry tracker, dashboard first version | `plan-state` (grace banners top and bottom, lock screen), billing screens with Razorpay checkout, limit reached dialog |
| FE-5 Communication | 4 | 3 | Notification composer with the three dialog variants, templates, scheduled, delivery report, email settings, templates, logs, connections, bounces | Connect Email screen (Google, Microsoft), library notification composer |
| FE-6 People and content | 5 | 3 | Students view, reported cases, support, website content, library page review, app management | Public page settings, support tickets |
| FE-7 Insight and system | 6 | 3 | Reports and scheduled reports, dashboard full version, all settings, audit and health screens | Library reports, activity logs |
| FE-8 Polish | 7 | 2 to 3 | Accessibility pass, phone and tablet pass, Hindi and Gujarati text fit, performance budgets, visual regression tests, remove dead code | Same |

**Exit checks by frontend phase**

- **FE-0:** the build passes, the gallery shows every primitive in light and dark and in all three languages, both shells render with their own menus, and a test import across admins fails lint.
- **FE-1:** a sample list with 10,000 mock rows works with server paging, sort, filters kept in the URL, and keyboard and screen reader use. Every pattern has a gallery entry.
- **FE-2:** a Super Admin and a Support Manager see different menus from the same shell. A forbidden route shows the forbidden state, not a blank page.
- **FE-3:** every screen of building document sections 6.3.1 to 6.3.5 exists with loading, empty, error, and forbidden states.
- **FE-4:** a test library shows the grace banner (top and bottom), then the lock screen, then returns to normal after renewal, with no manual refresh.
- **FE-5:** the three notification dialog variants preview correctly on desktop and phone width, and no email token is ever rendered.
- **FE-6 and FE-7:** every number on a dashboard card opens a list with the same count.
- **FE-8:** no console errors, accessibility score of 95 or more on key pages, and every screen usable at 360, 768, and 1280 pixel widths.

**Library Admin daily operations track (needs its own spec)**

The structure document lists many Library Admin screens that this plan does not cover in detail. They can run in parallel with FE-3 onward if a second frontend developer joins, using only the shared layers from FE-0 and FE-1. The grouping below is indicative.

| Track phase | Screens | Weeks (indicative) |
| --- | --- | --- |
| LA-1 Core operations | Dashboard, students and join requests, staff and permissions, branches | 4 |
| LA-2 Floor operations | Seat map and seat builder, attendance and QR kiosk, study hours | 4 |
| LA-3 Money and books | Student plans, dues, day book, coupons, books and circulation, CRM | 4 |
| LA-4 Insight and settings | Reports, activity logs, settings, support, knowledge base | 3 |

**Frontend quality targets (confirm in FE-0)**

- Each route loads under about 200 KB of script, with the seat builder, editor, charts, and export code loaded only when used.
- Lists are paged on the server at 50 to 100 rows and become usable in under 2 seconds on a mid range laptop.
- No layout jumps while data loads. Skeletons match the final layout.
- Hindi and Gujarati text never clips or overlaps at any width.

**Definition of done for a frontend screen:** thin route, all four states, three languages including long text, three widths, keyboard and screen reader use, controls hidden by permission, shared parts used instead of copies, a test, and no console errors.

**How to move from the current layout**

1. Create `common/design-system` and `common/patterns`, and keep `common/ui` as it is.
2. Create `app-config` in each admin and move the current `configs/navigation`, `configs/permissions`, and `configs/routes` into it.
3. For each module, create `features/<name>` and move `components/<name>`, its service, schema, and types into it. Do one module per pull request and run the app after each.
4. Replace each route's page body with a single screen component from its feature.
5. Split the current dictionaries into one file per feature.
6. Turn on the import rules last, then fix what the build reports.
