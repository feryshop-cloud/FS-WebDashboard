# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Internal Feryshop staff only — no customer accounts or public registration.

- **Owner / Super Admin:** unrestricted access; sees cost price (harga modal) and profit, manages custom roles/permissions per division, sees the full audit log.
- **Admin / Warehouse staff:** operational access; inputs and manages stock, handles deals, payments, and trade-ins, generates promo captions; blind to overall financial health and profit margins unless access is granted.

## Product Purpose

Replaces manual Notion/spreadsheet tracking with one central operational hub for the game-account trading business: inventory lifecycle, buy/sell deals with split payments, trade-ins, cancel/refund flows, problem cases, cash bookkeeping, and performance dashboards. Success means operations are rapi (orderly), easy to audit, and ready for future automation (n8n, Telegram bot, other integrations).

## Positioning

A strict, fully-audited operational ERP for a game-account trading business. Every money movement hits a finance ledger, one deal holds many split payments, trade-in asset value stays separated from account balances, and all significant actions are recorded in an audit log. A neighboring status-tracker could not truthfully copy this without building the ledger and audit machinery behind it.

## Operating Context

- Admin staff stare at the dashboard for long sessions; the UI must feel breathable, premium, and calm to reduce eye strain.
- Payments settle externally (bank transfer / e-wallet, often coordinated via WhatsApp); the system only logs transactions that admins input manually — no payment gateway integration.
- All account data is manually entered from screenshots and staff assessment — no real-time connection to Moonton, Garena, etc.
- UI copy is Bahasa Indonesia.
- Money is held across many custom payment methods/rekening (QRIS, e-wallets, banks, reseller channels like Digiflazz / Order Kuota) that the Owner can add, edit, or disable.
- The business sells game accounts, primarily Mobile Legends and Free Fire, plus Roblox, TikTok, and other custom categories.

## Capabilities and Constraints

Confirmed modules (as implemented):

- Auth with Supabase + RBAC; custom roles and per-module/per-action permissions managed by the Owner.
- Dashboard ("Command Center"): omzet, profit, piutang (receivables), inventory stats, recent ledger.
- Inventory/stock management with statuses (Tersedia, Booking, Akses Terbatas, Terjual, On Hold, Bermasalah, Cancel) and permanent stock history.
- Deals: lunas, booking/DP, cicilan/pelunasan, trade-in, cancel, refund; multiple split payments under one deal; automatic total-paid / remaining / percentage / jatuh tempo tracking.
- Trade-in (tukar tambah): multiple incoming customer accounts, cash top-up or cashback; trade-in value kept out of rekening balances.
- Purchases (kulakan): stock intake with optional pending payment to suppliers.
- Accounts/rekening: automatic balance updates from payments, refunds, purchases, cashbacks, transfers, and operational expenses; transfers between accounts.
- Ledger (buku kas): every money movement recorded, including internal transfers (not counted as omzet/profit).
- Problem cases (akun bermasalah) as a first-class module layered on top of stock/deal history.
- Audit log: read-only record of all significant actions (login, views of sensitive data, create/edit/delete, payments, refunds, exports, permission changes).
- Reports: profit & loss, cashflow, exports (Excel/PDF/CSV); sales, stock, booking, refund, trade-in, account, admin-performance, and per-game reports.
- Game category manager (ML, FF, Roblox, TikTok, custom).
- Internal storefront-adjacent tooling: topup products/orders, templates, ferrymail — internal tools, not a public customer storefront.
- Promo caption generator for copy-paste to WhatsApp/Instagram.

Constraints:

- No public e-commerce, no shopping cart/checkout, no customer accounts, no payment gateway integration.
- No real-time game API integration; data is manual.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code; CRUD uses the anon key behind Postgres RLS or `SECURITY DEFINER` RPCs.
- History is never lost: status changes and problem cases layer on prior records instead of deleting them.
- Trade-in asset value is never mixed into rekening balances.
- Payments to a staff member's personal account are a high-risk flow: reported, owner-approvable, tracked separately, and audit-logged.

## Brand Commitments

- Product/brand name: **Feryshop** (confirmed spelling; the codebase also contains the variant "Feryshop").
- UI language: Bahasa Indonesia.
- The incumbent visual implementation is the existing design authority; no new visual commitments were made in this record.

## Evidence on Hand

- `prd.md` — detailed internal product brief: flows, roles, modules, MVP priorities.
- `docs/` — PRD breakdowns: overview, tech stack, design system, database, features, workflow.
- `README.md`, `AGENTS.md`, `AI_GUARDRAILS.md` — setup, architecture, and operating rules.
- `supabase/schema_draft.sql` and `supabase/migrations/` — schema, triggers, RLS policies.
- `app/` + `components/` — the incumbent UI implementation.
- No real customer testimonials, case studies, or press are on hand; future work must not fabricate them.

## Product Principles

1. Every money movement is double-entered: inflows, outflows, refunds, cashbacks, and transfers all hit the finance ledger and reflect automatically on rekening balances.
2. One deal, many payments: DP, installments, and pelunasan stay under a single deal with automatic paid/remaining/percentage tracking.
3. History is permanent: status changes and problem cases layer on top of prior records; nothing is silently deleted.
4. Auditability is core, not a bolt-on: significant actions log user, time, module, action, and before/after data.
5. Trade-in discipline: asset value, cash in, and cashback are kept strictly separate in the books.
6. Internal-only access with clear permission separation between Owner and staff.

## Accessibility & Inclusion

Admin staff use the dashboard on desktop for long, continuous sessions; calm, low-glare, high-readability UI is a stated product requirement. No specific WCAG level has been confirmed.
