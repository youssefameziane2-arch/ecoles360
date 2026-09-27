# UI Kit — Espace secrétariat

Delegated back-office with scoped permissions. Same navy chrome as établissement, theme `secretariat`.

- **index.html** — Demandes de contact: SidebarNav, FilterBar (status/channel chips), RequestCard inbox, and a Rendez-vous DataTable with status badges + Pagination.

Composes: `SidebarNav`, `RequestCard`, `DataTable`, `Badge`, `Button`, `FilterBar`, `Pagination`.

The DataTable collapses to stacked cards under its `stackAt` breakpoint (mobile rule).
