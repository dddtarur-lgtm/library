# `src` Folder Structure (Directories Only)

```
src/
├── app/
│   ├── (unlocalized)/
│   │   └── docs/
│   │       ├── _components/
│   │       ├── _data/
│   │       ├── development/
│   │       │   ├── authentication/
│   │       │   ├── i18n/
│   │       │   ├── navigation/
│   │       │   └── theme-color/
│   │       ├── miscellaneous/
│   │       │   └── sources-and-credits/
│   │       │       ├── _components/
│   │       │       └── _data/
│   │       └── overview/
│   │           ├── deployment/
│   │           ├── installation/
│   │           ├── introduction/
│   │           └── kits/
│   ├── [lang]/
│   │   ├── (dashboard-layout)/
│   │   │   ├── (design-system)/
│   │   │   │   ├── cards/
│   │   │   │   │   ├── advanced/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   ├── basic/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   └── statistics/
│   │   │   │   ├── charts/
│   │   │   │   │   ├── area-charts/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── bar-charts/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── composed-charts/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── line-charts/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── pie-charts/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── radar-charts/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── radial-bar-charts/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── scatter-charts/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   └── treemap-charts/
│   │   │   │   │       └── _components/
│   │   │   │   ├── colors/
│   │   │   │   │   ├── _components/
│   │   │   │   │   └── _data/
│   │   │   │   ├── extended-ui/
│   │   │   │   │   ├── avatar-stack/
│   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   └── _data/
│   │   │   │   │   ├── bento-grid/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── editor/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── emoji-picker/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── file-dropzone/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── input-file/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── input-group/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── input-phone/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── input-spin/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── input-tags/
│   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   └── _data/
│   │   │   │   │   ├── keyboard/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── media-grid/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── mockups/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── rating/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── separator-with-text/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── show-more-text/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── sticky-layout/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   └── timeline/
│   │   │   │   │       └── _components/
│   │   │   │   ├── forms/
│   │   │   │   │   ├── basic-inputs/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   ├── file-dropzones/
│   │   │   │   │   ├── form-layouts/
│   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   │   └── form-layouts/
│   │   │   │   │   │   └── _schemas/
│   │   │   │   │   ├── pickers/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   └── select-and-tags/
│   │   │   │   ├── icons/
│   │   │   │   │   ├── lucide/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   └── react-icons/
│   │   │   │   │       └── _components/
│   │   │   │   ├── tables/
│   │   │   │   │   ├── _components/
│   │   │   │   │   │   └── tables/
│   │   │   │   │   │       └── data-table/
│   │   │   │   │   └── _data/
│   │   │   │   ├── typography/
│   │   │   │   │   ├── _components/
│   │   │   │   │   └── _data/
│   │   │   │   └── ui/
│   │   │   │       ├── accordion/
│   │   │   │       │   └── _components/
│   │   │   │       ├── alert/
│   │   │   │       │   └── _components/
│   │   │   │       ├── alert-dialog/
│   │   │   │       │   └── _components/
│   │   │   │       ├── aspect-ratio/
│   │   │   │       │   └── _components/
│   │   │   │       ├── avatar/
│   │   │   │       │   └── _components/
│   │   │   │       ├── badge/
│   │   │   │       │   └── _components/
│   │   │   │       ├── breadcrumb/
│   │   │   │       │   └── _components/
│   │   │   │       ├── button/
│   │   │   │       │   └── _components/
│   │   │   │       ├── calendar/
│   │   │   │       │   └── _components/
│   │   │   │       ├── card/
│   │   │   │       │   └── _components/
│   │   │   │       ├── carousel/
│   │   │   │       │   └── _components/
│   │   │   │       ├── checkbox/
│   │   │   │       │   └── _components/
│   │   │   │       ├── collapsible/
│   │   │   │       │   └── _components/
│   │   │   │       ├── combobox/
│   │   │   │       │   └── _components/
│   │   │   │       ├── command/
│   │   │   │       │   └── _components/
│   │   │   │       ├── context-menu/
│   │   │   │       │   └── _components/
│   │   │   │       ├── dialog/
│   │   │   │       │   └── _components/
│   │   │   │       ├── drawer/
│   │   │   │       │   └── _components/
│   │   │   │       ├── dropdown-menu/
│   │   │   │       │   └── _components/
│   │   │   │       ├── form/
│   │   │   │       │   └── _components/
│   │   │   │       ├── hover-card/
│   │   │   │       │   └── _components/
│   │   │   │       ├── input/
│   │   │   │       │   └── _components/
│   │   │   │       ├── input-otp/
│   │   │   │       │   └── _components/
│   │   │   │       ├── label/
│   │   │   │       │   └── _components/
│   │   │   │       ├── menubar/
│   │   │   │       │   └── _components/
│   │   │   │       ├── navigation-menu/
│   │   │   │       │   └── _components/
│   │   │   │       ├── pagination/
│   │   │   │       │   └── _components/
│   │   │   │       ├── popover/
│   │   │   │       │   └── _components/
│   │   │   │       ├── progress/
│   │   │   │       │   └── _components/
│   │   │   │       ├── radio-group/
│   │   │   │       │   └── _components/
│   │   │   │       ├── resizable/
│   │   │   │       │   └── _components/
│   │   │   │       ├── scroll-area/
│   │   │   │       │   └── _components/
│   │   │   │       ├── select/
│   │   │   │       │   └── _components/
│   │   │   │       ├── separator/
│   │   │   │       │   └── _components/
│   │   │   │       ├── sheet/
│   │   │   │       │   └── _components/
│   │   │   │       ├── skeleton/
│   │   │   │       │   └── _components/
│   │   │   │       ├── slider/
│   │   │   │       │   └── _components/
│   │   │   │       ├── sonner/
│   │   │   │       │   └── _components/
│   │   │   │       ├── switch/
│   │   │   │       │   └── _components/
│   │   │   │       ├── table/
│   │   │   │       │   └── _components/
│   │   │   │       ├── tabs/
│   │   │   │       │   └── _components/
│   │   │   │       ├── textarea/
│   │   │   │       │   └── _components/
│   │   │   │       ├── toast/
│   │   │   │       │   └── _components/
│   │   │   │       ├── toggle/
│   │   │   │       │   └── _components/
│   │   │   │       ├── toggle-group/
│   │   │   │       │   └── _components/
│   │   │   │       └── tooltip/
│   │   │   │           └── _components/
│   │   │   ├── apps/
│   │   │   │   ├── calendar/
│   │   │   │   │   ├── _components/
│   │   │   │   │   ├── _contexts/
│   │   │   │   │   ├── _data/
│   │   │   │   │   ├── _hooks/
│   │   │   │   │   ├── _reducers/
│   │   │   │   │   └── _schemas/
│   │   │   │   ├── chat/
│   │   │   │   │   ├── _components/
│   │   │   │   │   │   └── chat-sidebar/
│   │   │   │   │   ├── _contexts/
│   │   │   │   │   ├── _data/
│   │   │   │   │   ├── _hooks/
│   │   │   │   │   ├── _reducers/
│   │   │   │   │   ├── _schemas/
│   │   │   │   │   └── [[...id]]/
│   │   │   │   ├── email/
│   │   │   │   │   ├── _components/
│   │   │   │   │   ├── _contexts/
│   │   │   │   │   ├── _data/
│   │   │   │   │   ├── _hooks/
│   │   │   │   │   ├── _reducers/
│   │   │   │   │   ├── _schemas/
│   │   │   │   │   ├── [filter]/
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   └── compose/
│   │   │   │   └── kanban/
│   │   │   │       ├── _components/
│   │   │   │       │   └── kanban-sidebar/
│   │   │   │       ├── _contexts/
│   │   │   │       ├── _data/
│   │   │   │       ├── _hooks/
│   │   │   │       ├── _reducers/
│   │   │   │       └── _schemas/
│   │   │   ├── dashboards/
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── _components/
│   │   │   │   │   │   └── overview/
│   │   │   │   │   └── _data/
│   │   │   │   ├── crm/
│   │   │   │   │   ├── _components/
│   │   │   │   │   └── _data/
│   │   │   │   ├── ecommerce/
│   │   │   │   │   ├── _components/
│   │   │   │   │   └── _data/
│   │   │   │   ├── home/
│   │   │   │   │   ├── _components/
│   │   │   │   │   └── _data/
│   │   │   │   ├── platform-admin/
│   │   │   │   │   └── _components/
│   │   │   │   │       └── queues/
│   │   │   │   └── students/
│   │   │   │       ├── _components/
│   │   │   │       └── _data/
│   │   │   ├── library/
│   │   │   │   ├── activity-logs/
│   │   │   │   │   ├── archive/
│   │   │   │   │   ├── security-alerts/
│   │   │   │   │   └── staff-summary/
│   │   │   │   ├── attendance/
│   │   │   │   │   └── qr-kiosk/
│   │   │   │   ├── books/
│   │   │   │   │   ├── circulation/
│   │   │   │   │   ├── overdue-fines/
│   │   │   │   │   └── requests/
│   │   │   │   ├── branches/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   ├── branch-details/
│   │   │   │   │   └── change-requests/
│   │   │   │   ├── crm/
│   │   │   │   │   ├── _components/
│   │   │   │   │   └── _data/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── _components/
│   │   │   │   │   └── _data/
│   │   │   │   ├── email-management/
│   │   │   │   │   ├── logs/
│   │   │   │   │   ├── smtp-config/
│   │   │   │   │   └── templates/
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   ├── composer/
│   │   │   │   │   ├── inbox/
│   │   │   │   │   └── templates/
│   │   │   │   ├── plans/
│   │   │   │   │   ├── coupons/
│   │   │   │   │   ├── day-book/
│   │   │   │   │   ├── dues/
│   │   │   │   │   └── memberships/
│   │   │   │   ├── pricing/
│   │   │   │   │   ├── _components/
│   │   │   │   │   └── _data/
│   │   │   │   ├── reports/
│   │   │   │   │   ├── attendance-analytics/
│   │   │   │   │   ├── financial/
│   │   │   │   │   ├── scheduled/
│   │   │   │   │   └── seats-occupancy/
│   │   │   │   ├── seats/
│   │   │   │   │   ├── _components/
│   │   │   │   │   ├── builder/
│   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   └── _lib/
│   │   │   │   │   ├── change-requests/
│   │   │   │   │   └── lockers/
│   │   │   │   ├── settings/
│   │   │   │   │   ├── data-backup/
│   │   │   │   │   ├── facilities-achievers/
│   │   │   │   │   ├── leads/
│   │   │   │   │   ├── payment-gateway/
│   │   │   │   │   ├── public-page/
│   │   │   │   │   ├── reviews/
│   │   │   │   │   └── shifts-rules/
│   │   │   │   ├── staff/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   └── edit/
│   │   │   │   │   └── add/
│   │   │   │   ├── students/
│   │   │   │   │   ├── _components/
│   │   │   │   │   ├── _data/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   └── edit/
│   │   │   │   │   │       └── _components/
│   │   │   │   │   ├── add/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   └── profile/
│   │   │   │   ├── study-hours/
│   │   │   │   │   ├── goals/
│   │   │   │   │   ├── leaderboard/
│   │   │   │   │   └── sessions/
│   │   │   │   └── support/
│   │   │   │       ├── knowledge-base/
│   │   │   │       ├── service-status/
│   │   │   │       └── tickets/
│   │   │   │           └── [id]/
│   │   │   ├── pages/
│   │   │   │   ├── account/
│   │   │   │   │   ├── _data/
│   │   │   │   │   ├── profile/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   │       └── profile-content/
│   │   │   │   │   └── settings/
│   │   │   │   │       ├── _components/
│   │   │   │   │       │   └── general/
│   │   │   │   │       ├── _schemas/
│   │   │   │   │       ├── notifications/
│   │   │   │   │       │   ├── _components/
│   │   │   │   │       │   └── _schemas/
│   │   │   │   │       ├── plan-and-billing/
│   │   │   │   │       │   ├── _components/
│   │   │   │   │       │   └── _schemas/
│   │   │   │   │       └── security/
│   │   │   │   │           ├── _components/
│   │   │   │   │           └── _schemas/
│   │   │   │   ├── activity-logs/
│   │   │   │   │   ├── archive/
│   │   │   │   │   ├── security-alerts/
│   │   │   │   │   └── staff-summary/
│   │   │   │   ├── attendance/
│   │   │   │   │   └── qr-kiosk/
│   │   │   │   ├── books/
│   │   │   │   │   ├── circulation/
│   │   │   │   │   ├── overdue-fines/
│   │   │   │   │   └── requests/
│   │   │   │   ├── branches/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   ├── branch-details/
│   │   │   │   │   └── change-requests/
│   │   │   │   ├── email-management/
│   │   │   │   │   ├── logs/
│   │   │   │   │   ├── smtp-config/
│   │   │   │   │   └── templates/
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   ├── composer/
│   │   │   │   │   ├── inbox/
│   │   │   │   │   └── templates/
│   │   │   │   ├── payment/
│   │   │   │   │   ├── _components/
│   │   │   │   │   ├── _data/
│   │   │   │   │   └── _schemas/
│   │   │   │   ├── plans/
│   │   │   │   │   ├── coupons/
│   │   │   │   │   ├── day-book/
│   │   │   │   │   ├── dues/
│   │   │   │   │   └── memberships/
│   │   │   │   ├── pricing/
│   │   │   │   │   ├── _components/
│   │   │   │   │   └── _data/
│   │   │   │   ├── reports/
│   │   │   │   │   ├── attendance-analytics/
│   │   │   │   │   ├── financial/
│   │   │   │   │   ├── scheduled/
│   │   │   │   │   └── seats-occupancy/
│   │   │   │   ├── seats/
│   │   │   │   │   ├── _components/
│   │   │   │   │   ├── builder/
│   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   └── _lib/
│   │   │   │   │   ├── change-requests/
│   │   │   │   │   └── lockers/
│   │   │   │   ├── settings-library/
│   │   │   │   │   ├── data-backup/
│   │   │   │   │   ├── facilities-achievers/
│   │   │   │   │   ├── leads/
│   │   │   │   │   ├── payment-gateway/
│   │   │   │   │   ├── public-page/
│   │   │   │   │   ├── reviews/
│   │   │   │   │   └── shifts-rules/
│   │   │   │   ├── staff/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   └── edit/
│   │   │   │   │   └── add/
│   │   │   │   ├── students/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   └── edit/
│   │   │   │   │   │       └── _components/
│   │   │   │   │   ├── add/
│   │   │   │   │   │   └── _components/
│   │   │   │   │   └── profile/
│   │   │   │   ├── study-hours/
│   │   │   │   │   ├── goals/
│   │   │   │   │   ├── leaderboard/
│   │   │   │   │   └── sessions/
│   │   │   │   └── support/
│   │   │   │       ├── knowledge-base/
│   │   │   │       ├── service-status/
│   │   │   │       └── tickets/
│   │   │   │           └── [id]/
│   │   │   └── platform/
│   │   │       └── dashboard/
│   │   │           └── _components/
│   │   │               ├── charts/
│   │   │               ├── dialogs/
│   │   │               └── queues/
│   │   ├── (plain-layout)/
│   │   │   ├── (auth)/
│   │   │   │   ├── forgot-password/
│   │   │   │   ├── new-password/
│   │   │   │   ├── register/
│   │   │   │   ├── sign-in/
│   │   │   │   └── verify-email/
│   │   │   └── pages/
│   │   │       ├── coming-soon/
│   │   │       ├── landing/
│   │   │       │   ├── _components/
│   │   │       │   │   └── layout/
│   │   │       │   ├── _data/
│   │   │       │   └── _schemas/
│   │   │       ├── maintenance/
│   │   │       ├── not-found-404/
│   │   │       └── unauthorized-401/
│   │   └── [...not-found]/
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/
│       │   └── sign-in/
│       ├── email/
│       │   └── oauth/
│       │       ├── callback/
│       │       ├── connect/
│       │       ├── disconnect/
│       │       ├── send-test/
│       │       └── status/
│       └── mcp/
│           └── email/
├── components/
│   ├── auth/
│   ├── dashboards/
│   ├── email/
│   ├── icons/
│   ├── layout/
│   │   ├── horizontal-layout/
│   │   └── vertical-layout/
│   ├── pages/
│   │   └── coming-soon/
│   ├── students/
│   └── ui/
│       ├── data-table/
│       └── editor/
├── configs/
├── contexts/
├── data/
│   ├── dictionaries/
│   ├── library/
│   └── platform/
├── hooks/
├── lib/
├── providers/
└── schemas/
```
