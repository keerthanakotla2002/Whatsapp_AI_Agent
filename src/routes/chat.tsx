import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bot, Languages, Mic, Paperclip, RotateCcw, Send, ShoppingBasket, Smile, Wrench } from 'lucide-react'
import { Bubble, PhoneFrame, Typing, type ChatMessage } from '@/components/Phone'
import { newSession, respond, cartTotals, type Session, type ToolCall } from '@/lib/mockAgent'
import { useDemoState, DEMO_PHONE } from '@/lib/demoStore'
import { rupee, storeConfig } from '@/lib/fixtures'

export const Route = createFileRoute('/chat')({
  head: () => ({ meta: [{ title: 'Try the WhatsApp agent · DukaanDost' }] }),
  component: ChatPage,
})

interface TraceTurn {
  id: string
  input: string
  intent: string
  calls: ToolCall[]
}

const greeting = (): ChatMessage => ({
  id: 'hello',
  from: 'agent',
  text: `Namaste! Welcome to ${storeConfig.name} 🛒\nOrder groceries right here — in English, Hinglish or Hindi. Try "2 kilo chawal aur ek litre doodh".`,
  at: Date.now(),
})

// Kept at module level so the conversation survives a trip to the dashboard and back.
const memory: { session: Session; messages: ChatMessage[]; trace: TraceTurn[]; seen: Set<string> } = {
  session: newSession(),
  messages: [greeting()],
  trace: [],
  seen: new Set(),
}

const scenarios = [
  { label: 'Hinglish multi-item', text: '2 kilo chawal aur ek litre doodh' },
  { label: 'Pick a variant', text: '2' },
  { label: 'Out of stock', text: '1 dozen eggs' },
  { label: 'Low stock', text: '6 paneer' },
  { label: 'Hindi', text: 'मुझे 2 किलो चीनी और तेल चाहिए' },
  { label: 'See catalogue', text: 'menu' },
  { label: 'Checkout', text: 'checkout' },
  { label: 'Track order', text: 'Where is my order?' },
  { label: 'Order history', text: 'show my past orders' },
  { label: 'Cancel', text: 'cancel my order' },
  { label: 'Escalate', text: 'I want to talk to a human' },
]

function ChatPage() {
  const [messages, setMessages] = useState(memory.messages)
  const [trace, setTrace] = useState(memory.trace)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [, force] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)
  const { notifications } = useDemoState()
  const session = memory.session

  useEffect(() => {
    memory.messages = messages
    memory.trace = trace
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, trace, typing])

  // Store-side status changes arrive as WhatsApp order-update messages.
  useEffect(() => {
    const fresh = notifications.filter((n) => n.phone === DEMO_PHONE && !memory.seen.has(n.id))
    if (!fresh.length) return
    fresh.forEach((n) => memory.seen.add(n.id))
    setMessages((m) => [...m, ...fresh.map((n) => ({ id: n.id, from: 'update' as const, text: n.text, at: n.at }))])
  }, [notifications])

  const send = (text: string) => {
    const value = text.trim()
    if (!value || typing) return
    setDraft('')
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: 'customer', text: value, at: Date.now() }])
    setTyping(true)
    const turn = respond(session, value)
    setTimeout(() => {
      setTyping(false)
      setMessages((m) => [
        ...m,
        ...turn.replies.map((r) => ({ id: crypto.randomUUID(), from: 'agent' as const, text: r, at: Date.now() })),
      ])
      setTrace((t) => [{ id: crypto.randomUUID(), input: value, intent: turn.intent, calls: turn.trace }, ...t].slice(0, 12))
      force((n) => n + 1)
    }, 550 + Math.min(turn.replies.join('').length * 4, 900))
  }

  const reset = () => {
    memory.session = newSession()
    memory.seen = new Set(notifications.map((n) => n.id))
    setMessages([greeting()])
    setTrace([])
  }

  const { subtotal, fee, total } = cartTotals(session.cart)

  return (
    <main className="grain relative min-h-[calc(100vh-61px)]">
      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_360px_1fr]">
        {/* Scenarios */}
        <section className="rise order-2 lg:order-1">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-leaf-2">Live preview</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
            Order like you'd text your <span className="bg-turmeric-soft px-1">kirana bhaiya.</span>
          </h1>
          <p className="mt-3 text-ink-soft">
            Type anything, or tap a scenario below. Place an order, then open the{' '}
            <Link to="/dashboard" className="font-semibold text-leaf underline decoration-turmeric decoration-2 underline-offset-2">
              store dashboard
            </Link>{' '}
            to accept it — the update lands back here as a WhatsApp message.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {scenarios.map((s) => (
              <button
                key={s.label}
                onClick={() => send(s.text)}
                disabled={typing}
                className="group rounded-2xl border border-ink/15 bg-white/70 px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 hover:border-leaf hover:bg-white disabled:opacity-50"
              >
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-leaf-2">{s.label}</span>
                <span className="text-ink">{s.text}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-ink/20 p-4 text-sm text-ink-soft">
            <div className="mb-1 flex items-center gap-2 font-semibold text-ink">
              <Languages size={16} /> Replies in the customer's language
            </div>
            The assistant detects English, Hinglish and Hindi in this preview. Telugu and more languages arrive with the AI model.
          </div>
        </section>

        {/* Phone */}
        <section className="rise order-1 lg:order-2" style={{ animationDelay: '0.1s' }}>
          <PhoneFrame
            footer={
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send(draft)
                }}
                className="flex items-center gap-2 bg-chat px-2 pb-3 pt-1"
              >
                <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
                  <Smile size={18} className="text-ink-soft" />
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Message"
                    aria-label="Message the store"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-soft/60"
                  />
                  <Paperclip size={17} className="text-ink-soft" />
                </div>
                <button
                  type="submit"
                  aria-label="Send"
                  className="grid h-10 w-10 place-items-center rounded-full bg-leaf-2 text-white transition active:scale-90"
                >
                  {draft ? <Send size={17} /> : <Mic size={17} />}
                </button>
              </form>
            }
          >
            <div ref={scroller} className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3">
              <div className="mx-auto mb-2 rounded-md bg-turmeric-soft px-2.5 py-1 text-center text-[11px] text-ink-soft">
                🔒 Messages are end-to-end encrypted. Your phone number identifies you to the store.
              </div>
              {messages.map((m) => (
                <Bubble key={m.id} msg={m} />
              ))}
              {typing && <Typing />}
            </div>
          </PhoneFrame>
          <button onClick={reset} className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink">
            <RotateCcw size={13} /> Start a new conversation
          </button>
        </section>

        {/* Agent internals */}
        <section className="rise order-3 space-y-4" style={{ animationDelay: '0.2s' }}>
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <ShoppingBasket size={18} className="text-leaf-2" /> Cart
              <span className="ml-auto font-mono text-[11px] font-medium text-ink-soft">computed by order service</span>
            </h2>
            {session.cart.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Empty — ask for something to add it.</p>
            ) : (
              <ul className="mt-2 divide-y divide-ink/5 text-sm">
                {session.cart.map((l) => (
                  <li key={l.variant.id} className="flex justify-between py-1.5">
                    <span>
                      {l.qty} × {l.variant.label}
                    </span>
                    <span className="font-mono">{rupee(l.qty * l.variant.price)}</span>
                  </li>
                ))}
                <li className="flex justify-between py-1.5 text-ink-soft">
                  <span>Delivery {subtotal >= storeConfig.freeDeliveryAbove && '(free above ' + rupee(storeConfig.freeDeliveryAbove) + ')'}</span>
                  <span className="font-mono">{rupee(fee)}</span>
                </li>
                <li className="flex justify-between pt-1.5 font-semibold">
                  <span>Total</span>
                  <span className="font-mono">{rupee(total)}</span>
                </li>
              </ul>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-ink/5 pt-3 text-xs">
              {[
                ['Language', session.lang === 'hinglish' ? 'Hinglish' : session.lang === 'hi' ? 'हिन्दी' : session.lang === 'te' ? 'తెలుగు' : 'English'],
                ['Step', session.stage],
                ['Name', session.name ?? '—'],
                ['Address', session.address ? '•••• saved' : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="truncate font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl bg-ink p-4 text-paper shadow-sm">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Bot size={18} className="text-turmeric" /> Agent trace
            </h2>
            <p className="mt-1 text-xs text-paper/60">
              Each message becomes an intent plus tool calls. Prices, stock and totals always come from the store's services — the assistant only narrates them.
            </p>
            <div className="mt-3 max-h-[380px] space-y-3 overflow-y-auto pr-1">
              {trace.length === 0 && <p className="font-mono text-xs text-paper/50">Waiting for the first message…</p>}
              {trace.map((turn) => (
                <div key={turn.id} className="pop rounded-xl bg-paper/5 p-3">
                  <div className="truncate text-xs text-paper/60">“{turn.input}”</div>
                  <div className="mt-1 font-mono text-xs text-turmeric">intent: {turn.intent}</div>
                  {turn.calls.map((c, i) => (
                    <div key={i} className="mt-1.5 flex gap-2 font-mono text-[11px] leading-snug">
                      <Wrench size={12} className="mt-0.5 shrink-0 text-mint" />
                      <div className="min-w-0">
                        <span className="text-mint">{c.tool}</span>
                        <span className="break-all text-paper/50">({c.args})</span>
                        <div className="flex items-center gap-1 text-paper/80">
                          <ArrowRight size={10} /> {c.result}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
