# UI Kit — Back-office admin

Platform administration: establishment validation, review moderation, secrétaire permissions, payment reminders. Theme `administration`.

- **index.html** — Établissements: SidebarNav, KPI StatCards, a validation DataTable (status badges + per-row Examiner action + Pagination), a review moderation queue (ReviewCard with flagged state), and a PermissionToggle panel.

Composes: `SidebarNav`, `StatCard`, `DataTable`, `Badge`, `Button`, `ReviewCard`, `PermissionToggle`, `Pagination`.

Flagged reviews use the red-tinted border; suspended establishments get a red status badge.
