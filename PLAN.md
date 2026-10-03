# DukaanDost roadmap

DukaanDost is an AI-powered WhatsApp ordering assistant for local stores, plus a web dashboard for store staff. The work is split into small, self-contained milestones. Each one leaves the product working end to end.

## Milestone 1 — Product surface ✅

- Landing page explaining the product (`/`).
- Interactive WhatsApp conversation preview (`/chat`) with a rule-based stand-in for the AI agent. It covers multi-item Hinglish/Hindi requests, variant clarification, out-of-stock alternatives, reduced quantities, cart, name/address/payment collection, confirmation, tracking, history, cancellation and human handoff. An "Agent trace" panel shows the planned tool calls.
- Store dashboard (`/dashboard`) with a live order board (accept/reject/advance, order drawer, message customer, mark paid), inventory editing, insights and store settings.
- All data lives in `src/lib/fixtures.ts` and in-browser state in `src/lib/demoStore.ts`.

## Milestone 2 — Data model on Netlify Database

- Drizzle schema in `db/schema.ts`: stores, customers, addresses, products, variants, inventory, carts, orders, order_items, payments, order_events, conversations, messages, notifications, staff_users, audit_log. Every table gets `store_id`.
- Seed the catalogue from `fixtures.ts`.
- Order service: state machine (PENDING → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED; PENDING → REJECTED/CANCELLED). Stock is reserved in a transaction with row locks. Order creation is idempotent, and stock is restored on reject/cancel.
- Server functions replace `demoStore.ts`. The dashboard reads and writes real orders.

## Milestone 3 — Staff auth and roles

- Netlify Identity login for the dashboard, with owner/admin, staff and delivery roles.
- Protect every server function by role. Audit log for status, stock and price changes.

## Milestone 4 — AI agent orchestrator

- Replace `mockAgent.ts` with a tool-calling LLM through Netlify AI Gateway, using the runtime system prompt from the brief.
- Tools: search_products, check_stock, add_to_cart, remove_from_cart, view_cart, save_address, place_order, get_order_status, list_orders, cancel_order, handoff_to_human. Tools are scoped server-side to the customer's phone number.
- Guardrails: services compute prices, totals and stock. `place_order` is refused unless the cart is valid, stock is available, name and address are present, the minimum order is met and explicit confirmation is recorded. PII is redacted before model calls. A fallback message covers model failures.
- Multilingual replies, including full Telugu. Postgres full-text and alias search for products, with embeddings as an optional upgrade.
- Keep `/chat` as a staff "test the agent" sandbox wired to the real orchestrator.

## Milestone 5 — WhatsApp Business Cloud API

- Webhook function with verify-token handshake, HMAC signature verification, message-ID dedup and a fast 200 response. A background function processes messages per user in order, with retries.
- Send-message client with pre-approved templates for updates outside the 24-hour window.
- Customer registration from phone number, consent capture and data-deletion requests.

## Milestone 6 — Notifications and live board

- Event-driven WhatsApp updates on every status change, in the customer's language.
- Live dashboard updates (polling or SSE), plus new-order sound and badge.
- Staff ↔ customer messaging and human-handoff inbox.

## Milestone 7 — Payments

- UPI deep links / Razorpay payment links. Payment webhook marks orders paid. Refunds on reject/cancel of paid orders.
- COD collection marking (already in the UI) persisted.

## Milestone 8 — Admin, analytics and hardening

- Editable store settings (hours, delivery radius, fees, minimum order, payment methods, languages) and staff management.
- Real analytics: orders, revenue, top products, language mix, conversion and LLM cost/latency metrics.
- Rate limiting, structured logs, per-conversation tracing, conversation test scripts from the brief as automated tests.
- Optional POS/ERP/CSV inventory sync and broadcast messages.
