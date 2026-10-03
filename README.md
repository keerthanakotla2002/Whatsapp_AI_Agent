# DukaanDost

DukaanDost is an AI-powered WhatsApp ordering assistant for neighbourhood stores. Customers message the store's WhatsApp number in their own words and language, for example "2 kilo chawal aur ek litre doodh". The assistant finds the products, checks stock, builds the cart, collects address and payment details, confirms the total and places the order. Store staff accept, reject and track orders from a web dashboard, and every status change is sent back to the customer on WhatsApp.

## What's live today

- **`/` — Overview.** The product landing page.
- **`/chat` — WhatsApp agent preview.** A full ordering conversation in a phone mock-up, with one-tap test scenarios, a live cart computed by the order logic, and an "Agent trace" panel showing the tool calls behind each reply.
- **`/dashboard` — Store dashboard.** A live order board (accept / reject / advance, order details, message customer, mark paid), inventory with stock editing, weekly insights and store settings.

Orders placed in `/chat` appear on the dashboard straight away. Accepting or advancing them sends an order update back into the chat. In this version all data is demo data held in the browser. Real persistence, the AI model and the WhatsApp connection are on the roadmap.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, SSR) on Netlify
- Tailwind CSS 4, with brand tokens in `src/styles.css`
- Chart.js via react-chartjs-2 for insights
- lucide-react icons

## Running locally

```bash
pnpm install
netlify dev     # or: pnpm dev
```

## Roadmap

See [PLAN.md](./PLAN.md). Next up:

1. Data model and order service on Netlify Database (stock reservation, order state machine)
2. Staff login and roles with Netlify Identity
3. Tool-calling AI agent through Netlify AI Gateway
4. WhatsApp Business Cloud API webhook and messaging
5. Live notifications, payments (UPI / Razorpay), admin settings, analytics and hardening
