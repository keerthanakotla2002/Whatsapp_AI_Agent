# AGENTS.md

DukaanDost is a WhatsApp ordering assistant for local stores, with a store-side web dashboard. Built with TanStack Start and deployed on Netlify.

**Continue from [PLAN.md](./PLAN.md).** Milestone 1, the product surface with stubbed data, is complete. Pick up the next unchecked milestone.

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (React 19, TanStack Router v1, SSR) |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 (`@theme` tokens in `src/styles.css`) |
| Charts | Chart.js + react-chartjs-2 |
| Icons | lucide-react |
| Deployment | Netlify (`@netlify/vite-plugin-tanstack-start`) |

## Directory structure

```
src/
├── components/
│   ├── SiteHeader.tsx   # Sticky brand header + nav (Overview / agent / dashboard)
│   └── Phone.tsx        # PhoneFrame, chat Bubble (customer / agent / order-update), Typing indicator
├── lib/
│   ├── fixtures.ts      # ALL stub data: store config, catalogue (products, variants, aliases, stock), seed orders, customers, analytics, status labels
│   ├── demoStore.ts     # In-browser shared state (useSyncExternalStore): orders, stock, notifications + actions placeOrder / setOrderStatus / markPaid / setStock / sendStoreMessage
│   └── mockAgent.ts     # Rule-based stand-in for the LLM agent; same tool vocabulary as the planned orchestrator; logs tool calls to a trace
├── routes/
│   ├── __root.tsx       # HTML shell, metadata, Google Fonts, SiteHeader
│   ├── index.tsx        # Landing page
│   ├── chat.tsx         # WhatsApp agent preview (scenarios, phone, cart + agent trace)
│   └── dashboard.tsx    # Store dashboard: Orders board, Inventory, Insights, Settings tabs
└── styles.css           # Theme tokens, grain/chat wallpaper, animations
```

## Non-obvious decisions

- **Stub boundary.** UI only talks to `fixtures.ts`, `demoStore.ts` and `mockAgent.ts`. Milestone 2 should replace `demoStore.ts` actions with server functions backed by Netlify Database, keeping the same function names and signatures where possible.
- **Shared demo state.** `demoStore.ts` is module-level state, so it persists across client-side navigation but not across tabs or reloads. The chat conversation is also kept in module memory (`memory` in `chat.tsx`) so it survives a trip to the dashboard.
- **The agent never computes money or stock.** `mockAgent.ts` reads prices and stock from the service layer and calls `placeOrder`, which re-validates stock. Keep this rule when the real LLM is added: tools return numbers and the model only narrates.
- **Fixed demo customer.** The chat customer is always `DEMO_PHONE`. Order status, history and cancel only look at that phone's orders, mirroring per-phone scoping.
- **Hydration.** Seed data uses `Date.now()`. Relative times on the dashboard render only after mount (`useNow`), and chat timestamps use `suppressHydrationWarning`.
- **Languages.** The mock agent detects Devanagari (Hindi), Telugu script and Hinglish keywords. Reply copy lives in `COPY` in `mockAgent.ts` (en / hinglish / hi). Telugu replies fall back to English until the LLM milestone.

## Conventions

- Components PascalCase, utilities camelCase, routes kebab-case files.
- `@/` path alias for `src/`.
- Brand colours via Tailwind tokens: `paper`, `ink`, `ink-soft`, `leaf`, `leaf-2`, `mint`, `turmeric`, `chili`. Fonts: `font-display` (Bricolage Grotesque), `font-sans` (Instrument Sans), `font-mono` (JetBrains Mono).
- Money is in whole rupees and formatted with `rupee()` from `fixtures.ts`.
- Do not run build/dev commands in agent sessions; the Netlify pipeline builds and validates.
