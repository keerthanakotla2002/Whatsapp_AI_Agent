import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BellRing,
  Boxes,
  Check,
  CreditCard,
  Languages,
  LayoutGrid,
  Lock,
  MessageCircle,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  UserCheck,
  BarChart3,
  HandHelping,
} from 'lucide-react'
import { Bubble, PhoneFrame, type ChatMessage } from '@/components/Phone'

export const Route = createFileRoute('/')({
  component: Home,
})

const T = new Date('2026-10-03T09:12:00+05:30').getTime()
const script: ChatMessage[] = [
  { id: '1', from: 'customer', text: '2 kilo chawal aur ek litre doodh', at: T },
  { id: '2', from: 'agent', text: '1 litre Amul Toned Milk cart mein daal diya.\nKaunsa rice chahiye?\n1. India Gate Basmati — ₹140/kg\n2. Sona Masoori — ₹68/kg', at: T + 20_000 },
  { id: '3', from: 'customer', text: 'sona masoori', at: T + 60_000 },
  { id: '4', from: 'agent', text: 'Order summary\n2 × Sona Masoori — ₹136\n1 × Amul Toned Milk — ₹56\nDelivery ₹30 · Total ₹222\n\nConfirm karne ke liye HAAN likhiye.', at: T + 80_000 },
  { id: '5', from: 'customer', text: 'haan', at: T + 120_000 },
  { id: '6', from: 'update', text: 'Order DD-1043 · Accepted\nGood news! Your order has been accepted by the store.', at: T + 240_000 },
]

const phrases = [
  '2 kilo chawal aur ek litre doodh',
  'मेरा ऑर्डर कहाँ है?',
  'Do you have brown bread?',
  '1 kg పప్పు కావాలి',
  'ek dozen ande bhej do',
  'cancel my last order',
  'मुझे 5 किलो आटा चाहिए',
  'paneer fresh hai?',
]

const steps = [
  { n: '01', title: 'Customer texts the store', body: 'No app to install. They message your WhatsApp number the way they already talk — any language, any spelling.' },
  { n: '02', title: 'The assistant builds the cart', body: 'It maps “chawal” or “doodh” to your catalogue, checks live stock, and asks one short question when something is unclear.' },
  { n: '03', title: 'You accept in one tap', body: 'The order lands on your live board with the address, total and payment. Accept, reject, or message the customer.' },
  { n: '04', title: 'Updates flow back', body: 'Packing, out for delivery, delivered — every step is sent to the customer on WhatsApp, in their language.' },
]

const features = [
  {
    title: 'For your customers',
    tone: 'bg-leaf text-paper',
    items: [
      { icon: MessageCircle, text: 'Natural-language ordering on WhatsApp' },
      { icon: PackageSearch, text: 'Product search, variants and availability' },
      { icon: Languages, text: 'Hindi, Hinglish, Telugu and English replies' },
      { icon: CreditCard, text: 'Cash on delivery or UPI payment' },
      { icon: BellRing, text: 'Order tracking, history and cancellation' },
    ],
  },
  {
    title: 'For your store',
    tone: 'bg-turmeric text-ink',
    items: [
      { icon: LayoutGrid, text: 'Live order board with accept / reject' },
      { icon: Boxes, text: 'Stock that reserves and restores itself' },
      { icon: BarChart3, text: 'Sales, top products and language insights' },
      { icon: HandHelping, text: 'Human handoff for complaints and refunds' },
      { icon: UserCheck, text: 'Staff roles, store hours, fees and minimums' },
    ],
  },
  {
    title: 'Built to be trusted',
    tone: 'bg-white text-ink border border-ink/10',
    items: [
      { icon: ShieldCheck, text: 'Prices and totals always come from your catalogue' },
      { icon: Check, text: 'No order without explicit customer confirmation' },
      { icon: Lock, text: 'Customers only ever see their own orders' },
      { icon: Sparkles, text: 'Personal details redacted before AI processing' },
      { icon: BellRing, text: 'Audit trail for every status and stock change' },
    ],
  },
]

const lifecycle = ['New', 'Accepted', 'Packing', 'Out for delivery', 'Delivered']

function Home() {
  return (
    <main className="grain relative overflow-hidden">
      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
        <div>
          <p className="rise inline-flex items-center gap-2 rounded-full border border-leaf/20 bg-mint/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-leaf">
            <span className="h-1.5 w-1.5 rounded-full bg-leaf-2" /> AI ordering for neighbourhood stores
          </p>
          <h1
            className="rise mt-5 font-display text-[clamp(2.8rem,6.5vw,5.4rem)] font-extrabold leading-[0.92] tracking-[-0.03em]"
            style={{ animationDelay: '0.05s' }}
          >
            Your kirana,
            <br />
            open on{' '}
            <span className="relative inline-block text-leaf">
              WhatsApp
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 14" fill="none" aria-hidden>
                <path d="M3 10 C 80 2, 200 2, 297 9" stroke="#f2a516" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </span>
            .
          </h1>
          <p className="rise mt-7 max-w-xl text-lg leading-relaxed text-ink-soft" style={{ animationDelay: '0.12s' }}>
            DukaanDost is an AI assistant that takes orders on your store's WhatsApp number. Customers ask for
            “2 kilo chawal” in their own words; it checks your stock, builds the cart, confirms the total and hands
            you a ready-to-pack order.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: '0.18s' }}>
            <Link
              to="/chat"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-paper shadow-[4px_4px_0_var(--color-turmeric)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-turmeric)]"
            >
              Chat with the assistant <ArrowRight size={17} className="transition group-hover:translate-x-1" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-6 py-3 font-semibold transition hover:bg-ink hover:text-paper"
            >
              See the store dashboard
            </Link>
          </div>
          <dl className="rise mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-ink/10 pt-6" style={{ animationDelay: '0.24s' }}>
            {[
              ['4', 'languages'],
              ['1 tap', 'to accept'],
              ['0', 'apps to install'],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="font-display text-3xl font-extrabold">{v}</dt>
                <dd className="text-sm text-ink-soft">{k}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rise relative" style={{ animationDelay: '0.2s' }}>
          <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-turmeric/30 blur-3xl" />
          <div className="absolute -bottom-10 -left-6 h-64 w-64 rounded-full bg-leaf-2/20 blur-3xl" />
          <PhoneFrame className="rotate-[-2deg]">
            <div className="flex flex-1 flex-col justify-end gap-1.5 overflow-hidden px-3 py-3">
              {script.map((m) => (
                <Bubble key={m.id} msg={m} />
              ))}
            </div>
          </PhoneFrame>
          {/* Store-side card overlapping the phone */}
          <div className="absolute -left-4 bottom-24 hidden w-56 rotate-[3deg] rounded-2xl border border-ink/10 bg-white p-4 shadow-xl sm:block lg:-left-16">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono">DD-1043</span>
              <span className="rounded bg-turmeric px-1 text-[10px] font-bold">NEW</span>
            </div>
            <div className="mt-1 font-semibold">Rohan · Hinglish</div>
            <div className="text-xs text-ink-soft">2× Sona Masoori, 1× Amul Milk</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-display text-lg font-bold">₹222</span>
              <span className="rounded-lg bg-leaf px-2.5 py-1 text-xs font-semibold text-paper">
                <Check size={12} className="-mt-0.5 mr-0.5 inline" /> Accept
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Phrase ticker */}
      <section className="relative z-10 -rotate-1 border-y-2 border-ink bg-turmeric py-3">
        <div className="flex gap-10 overflow-hidden whitespace-nowrap font-display text-xl font-bold">
          <div className="flex shrink-0 animate-[marquee_38s_linear_infinite] gap-10">
            {[...phrases, ...phrases].map((p, i) => (
              <span key={i} className="flex items-center gap-10">
                “{p}” <span className="text-leaf">✦</span>
              </span>
            ))}
          </div>
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-24">
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf-2">How it works</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight">
              From a text message to a packed bag.
            </h2>
            <p className="mt-4 text-ink-soft">
              The assistant handles the conversation. Your catalogue, stock and rules decide everything else — so totals are always right.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li
                key={s.n}
                className={`rounded-3xl border border-ink/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg ${i % 2 ? 'sm:translate-y-8' : ''}`}
              >
                <span className="font-mono text-sm text-turmeric">{s.n}</span>
                <h3 className="mt-2 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Lifecycle */}
      <section className="relative z-10 bg-ink py-16 text-paper">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-lg font-display text-3xl font-extrabold leading-tight">
              Every status change becomes a WhatsApp update — automatically.
            </h2>
            <p className="max-w-sm text-sm text-paper/70">
              Rejected or cancelled orders return their stock to the shelf and refund any payment, and the customer is told why.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {lifecycle.map((l, i) => (
              <div key={l} className="relative rounded-2xl border border-paper/15 p-4">
                <span className="font-mono text-xs text-turmeric">{String(i + 1).padStart(2, '0')}</span>
                <div className="mt-1 font-display text-lg font-bold">{l}</div>
                {i < lifecycle.length - 1 && (
                  <ArrowRight size={16} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-turmeric sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf-2">What's inside</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight">
          One assistant for the counter, the shelf and the delivery bike.
        </h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className={`rounded-3xl p-7 ${f.tone}`}>
              <h3 className="font-display text-2xl font-bold">{f.title}</h3>
              <ul className="mt-5 space-y-3">
                {f.items.map((it) => (
                  <li key={it.text} className="flex items-start gap-3 text-[15px]">
                    <it.icon size={18} className="mt-0.5 shrink-0 opacity-80" /> {it.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-leaf px-8 py-14 text-paper md:px-14">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[28px] border-turmeric/30" />
          <h2 className="relative max-w-xl font-display text-4xl font-extrabold leading-tight">
            Place a test order, then accept it yourself.
          </h2>
          <p className="relative mt-3 max-w-lg text-paper/75">
            The preview runs the full loop: chat, cart, confirmation, the store's live board, and the WhatsApp update back to the customer.
          </p>
          <div className="relative mt-7 flex flex-wrap gap-3">
            <Link to="/chat" className="inline-flex items-center gap-2 rounded-full bg-turmeric px-6 py-3.5 font-semibold text-ink transition hover:-translate-y-0.5">
              Start ordering <ArrowRight size={17} />
            </Link>
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border-2 border-paper/40 px-6 py-3 font-semibold hover:border-paper">
              Open the order board
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-ink/10 py-8 text-center text-sm text-ink-soft">
        DukaanDost · WhatsApp ordering for local stores
      </footer>
    </main>
  )
}
