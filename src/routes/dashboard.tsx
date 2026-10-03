import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import {
  Bell,
  Check,
  ChevronRight,
  IndianRupee,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Minus,
  Package,
  Plus,
  Search,
  Send,
  Settings2,
  Truck,
  X,
  BarChart3,
  Clock,
} from 'lucide-react'
import {
  catalogue,
  customers,
  nextStatus,
  rupee,
  statusLabel,
  storeConfig,
  weeklyAnalytics,
  type Order,
  type OrderStatus,
} from '@/lib/fixtures'
import { markPaid, sendStoreMessage, setOrderStatus, setStock, useDemoState } from '@/lib/demoStore'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Filler)

export const Route = createFileRoute('/dashboard')({
  head: () => ({ meta: [{ title: 'Store dashboard · DukaanDost' }] }),
  component: Dashboard,
})

type Tab = 'orders' | 'inventory' | 'insights' | 'settings'

// Relative times only render after mount so server and client markup match.
function useNow() {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(id)
  }, [])
  return now
}

const ago = (at: number, now: number | null) => {
  if (now === null) return ''
  const m = Math.max(0, Math.round((now - at) / 60_000))
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`
}

const langBadge: Record<Order['language'], string> = { en: 'EN', hinglish: 'Hinglish', hi: 'हिन्दी', te: 'తెలుగు' }

const columns: { key: string; title: string; statuses: OrderStatus[]; tone: string }[] = [
  { key: 'new', title: 'New', statuses: ['PENDING'], tone: 'bg-turmeric' },
  { key: 'accepted', title: 'Accepted', statuses: ['ACCEPTED'], tone: 'bg-leaf-2' },
  { key: 'packing', title: 'Packing', statuses: ['PREPARING'], tone: 'bg-leaf' },
  { key: 'out', title: 'Out for delivery', statuses: ['OUT_FOR_DELIVERY'], tone: 'bg-sky-600' },
  { key: 'closed', title: 'Closed', statuses: ['DELIVERED', 'REJECTED', 'CANCELLED'], tone: 'bg-ink-soft' },
]

const advanceLabel: Partial<Record<OrderStatus, string>> = {
  ACCEPTED: 'Start packing',
  PREPARING: 'Send for delivery',
  OUT_FOR_DELIVERY: 'Mark delivered',
}

function Dashboard() {
  const [tab, setTab] = useState<Tab>('orders')
  const { orders, notifications } = useDemoState()
  const pending = orders.filter((o) => o.status === 'PENDING').length

  const nav: { key: Tab; label: string; icon: typeof LayoutGrid; badge?: number }[] = [
    { key: 'orders', label: 'Orders', icon: LayoutGrid, badge: pending },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { key: 'insights', label: 'Insights', icon: BarChart3 },
    { key: 'settings', label: 'Store settings', icon: Settings2 },
  ]

  return (
    <main className="grain relative min-h-[calc(100vh-61px)]">
      <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[210px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-4 rounded-2xl bg-leaf p-4 text-paper">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-turmeric">Store</div>
            <div className="mt-1 font-display text-lg font-bold leading-tight">{storeConfig.name}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-paper/75">
              <span className="h-2 w-2 animate-pulse rounded-full bg-turmeric" /> Accepting orders · {storeConfig.hours}
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {nav.map((n) => (
              <button
                key={n.key}
                onClick={() => setTab(n.key)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  tab === n.key ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <n.icon size={16} />
                {n.label}
                {!!n.badge && (
                  <span className="ml-auto rounded-full bg-turmeric px-1.5 text-[11px] font-bold text-ink">{n.badge}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="mt-4 hidden rounded-xl border border-dashed border-ink/20 p-3 text-xs text-ink-soft lg:block">
            <Bell size={14} className="mb-1 text-leaf" />
            {notifications.length} WhatsApp update{notifications.length === 1 ? '' : 's'} sent this session.{' '}
            <Link to="/chat" className="font-semibold text-leaf underline">
              Open customer chat
            </Link>
          </div>
        </aside>

        <section className="min-w-0">
          {tab === 'orders' && <OrdersBoard orders={orders} />}
          {tab === 'inventory' && <Inventory />}
          {tab === 'insights' && <Insights />}
          {tab === 'settings' && <Settings />}
        </section>
      </div>
    </main>
  )
}

function Kpis({ orders }: { orders: Order[] }) {
  const live = orders.filter((o) => !['DELIVERED', 'REJECTED', 'CANCELLED'].includes(o.status))
  const revenue = orders.filter((o) => !['REJECTED', 'CANCELLED'].includes(o.status)).reduce((s, o) => s + o.total, 0)
  const unpaid = orders.filter((o) => o.paymentStatus === 'UNPAID' && !['REJECTED', 'CANCELLED'].includes(o.status))
  const tiles = [
    { label: 'Awaiting decision', value: String(orders.filter((o) => o.status === 'PENDING').length), icon: Clock, accent: true },
    { label: 'Active orders', value: String(live.length), icon: Truck },
    { label: "Today's sales", value: rupee(revenue), icon: IndianRupee },
    { label: 'Cash to collect', value: rupee(unpaid.reduce((s, o) => s + o.total, 0)), icon: IndianRupee },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`rounded-2xl border p-4 ${t.accent ? 'border-turmeric bg-turmeric-soft' : 'border-ink/10 bg-white'}`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-ink-soft">
            {t.label} <t.icon size={14} />
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold tracking-tight">{t.value}</div>
        </div>
      ))}
    </div>
  )
}

function OrdersBoard({ orders }: { orders: Order[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const now = useNow()
  const filtered = orders.filter((o) =>
    `${o.id} ${o.customerName} ${o.phone}`.toLowerCase().includes(query.toLowerCase()),
  )
  const current = orders.find((o) => o.id === selected) ?? null

  return (
    <div className="rise">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Live orders</h1>
          <p className="text-sm text-ink-soft">New WhatsApp orders appear here instantly. Accepting or updating one messages the customer.</p>
        </div>
        <label className="ml-auto flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm">
          <Search size={15} className="text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order, name, phone"
            className="w-44 bg-transparent outline-none"
          />
        </label>
      </div>
      <Kpis orders={orders} />

      <div className="mt-6 grid gap-4 overflow-x-auto pb-2 md:grid-cols-2 xl:grid-cols-5">
        {columns.map((col) => {
          const list = filtered.filter((o) => col.statuses.includes(o.status))
          return (
            <div key={col.key} className="min-w-[220px] rounded-2xl bg-paper-2/70 p-2.5">
              <div className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold">
                <span className={`h-2.5 w-2.5 rounded-full ${col.tone}`} />
                {col.title}
                <span className="ml-auto font-mono text-xs text-ink-soft">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.length === 0 && (
                  <div className="rounded-xl border border-dashed border-ink/15 px-3 py-6 text-center text-xs text-ink-soft">
                    Nothing here
                  </div>
                )}
                {list.map((o) => (
                  <OrderCard key={o.id} order={o} now={now} onOpen={() => setSelected(o.id)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {current && <OrderDrawer order={current} now={now} onClose={() => setSelected(null)} />}
    </div>
  )
}

function PaymentBadge({ order }: { order: Order }) {
  const styles =
    order.paymentStatus === 'PAID'
      ? 'bg-mint text-leaf'
      : order.paymentStatus === 'REFUNDED'
        ? 'bg-sky-100 text-sky-700'
        : 'bg-ink/5 text-ink-soft'
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles}`}>
      {order.paymentMethod} · {order.paymentStatus.toLowerCase()}
    </span>
  )
}

function OrderCard({ order, now, onOpen }: { order: Order; now: number | null; onOpen: () => void }) {
  const fresh = now !== null && order.status === 'PENDING' && now - order.placedAt < 120_000
  const next = nextStatus[order.status]
  return (
    <article
      className={`pop cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        fresh ? 'flash border-turmeric' : 'border-ink/10'
      } ${['REJECTED', 'CANCELLED'].includes(order.status) ? 'opacity-60' : ''}`}
      onClick={onOpen}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-medium">{order.id}</span>
        {fresh && <span className="rounded bg-turmeric px-1 text-[10px] font-bold">NEW</span>}
        <span className="ml-auto text-[11px] text-ink-soft">{ago(order.placedAt, now)}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 font-semibold">
        {order.customerName}
        <span className="rounded bg-ink/5 px-1 text-[10px] font-medium text-ink-soft">{langBadge[order.language]}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-ink-soft">
        {order.items.map((i) => `${i.qty}× ${i.variantLabel}`).join(', ')}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-display text-lg font-bold">{rupee(order.total)}</span>
        <PaymentBadge order={order} />
      </div>
      {['REJECTED', 'CANCELLED', 'DELIVERED'].includes(order.status) && (
        <div className="mt-1 text-[11px] font-medium text-ink-soft">{statusLabel[order.status]}</div>
      )}
      {order.status === 'PENDING' && (
        <div className="mt-3 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setOrderStatus(order.id, 'REJECTED')}
            className="flex items-center justify-center gap-1 rounded-lg border border-chili/30 py-1.5 text-xs font-semibold text-chili hover:bg-chili/5"
          >
            <X size={13} /> Reject
          </button>
          <button
            onClick={() => setOrderStatus(order.id, 'ACCEPTED')}
            className="flex items-center justify-center gap-1 rounded-lg bg-leaf py-1.5 text-xs font-semibold text-paper hover:bg-leaf-2"
          >
            <Check size={13} /> Accept
          </button>
        </div>
      )}
      {next && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOrderStatus(order.id, next)
          }}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-ink py-1.5 text-xs font-semibold text-paper hover:bg-leaf"
        >
          {advanceLabel[order.status]} <ChevronRight size={13} />
        </button>
      )}
    </article>
  )
}

function OrderDrawer({ order, now, onClose }: { order: Order; now: number | null; onClose: () => void }) {
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        className="pop h-full w-full max-w-md overflow-y-auto bg-paper p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Order ${order.id}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-xs text-ink-soft">{order.id}</div>
            <h2 className="font-display text-2xl font-extrabold">{order.customerName}</h2>
            <div className="text-sm text-ink-soft">{order.phone}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-ink/5">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-white p-3 text-sm">
          <MapPin size={16} className="mt-0.5 shrink-0 text-leaf" /> {order.address}
        </div>

        <table className="mt-4 w-full text-sm">
          <tbody>
            {order.items.map((i) => (
              <tr key={i.variantId} className="border-b border-ink/5">
                <td className="py-2">
                  {i.qty} × {i.variantLabel}
                </td>
                <td className="py-2 text-right font-mono">{rupee(i.qty * i.price)}</td>
              </tr>
            ))}
            <tr className="text-ink-soft">
              <td className="pt-2">Delivery</td>
              <td className="pt-2 text-right font-mono">{order.deliveryFee ? rupee(order.deliveryFee) : 'Free'}</td>
            </tr>
            <tr className="font-semibold">
              <td className="pt-1">Total</td>
              <td className="pt-1 text-right font-mono">{rupee(order.total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex items-center gap-2">
          <PaymentBadge order={order} />
          {order.paymentStatus === 'UNPAID' && !['REJECTED', 'CANCELLED'].includes(order.status) && (
            <button onClick={() => markPaid(order.id)} className="text-xs font-semibold text-leaf underline">
              Mark as paid
            </button>
          )}
        </div>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-soft">Timeline</h3>
        <ol className="mt-2 space-y-2 border-l-2 border-leaf/20 pl-4">
          {order.events.map((e, i) => (
            <li key={i} className="relative text-sm">
              <span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full bg-leaf" />
              <span className="font-medium">{statusLabel[e.status]}</span>{' '}
              <span className="text-xs text-ink-soft">{ago(e.at, now)}</span>
            </li>
          ))}
        </ol>

        <h3 className="mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
          <MessageSquare size={13} /> Message customer on WhatsApp
        </h3>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!msg.trim()) return
            sendStoreMessage(order.id, msg.trim())
            setMsg('')
            setSent(true)
          }}
        >
          <input
            value={msg}
            onChange={(e) => {
              setMsg(e.target.value)
              setSent(false)
            }}
            placeholder="e.g. Paneer is fresh in at 6pm, okay to wait?"
            className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-leaf"
          />
          <button className="grid w-10 place-items-center rounded-xl bg-leaf-2 text-white" aria-label="Send message">
            <Send size={15} />
          </button>
        </form>
        {sent && <p className="mt-1 text-xs text-leaf">Sent to {order.customerName}'s WhatsApp.</p>}
      </aside>
    </div>
  )
}

function Inventory() {
  const { stock } = useDemoState()
  const [filter, setFilter] = useState('All')
  const categories = ['All', ...new Set(catalogue.map((p) => p.category))]
  const rows = catalogue.filter((p) => filter === 'All' || p.category === filter)
  return (
    <div className="rise">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Inventory</h1>
      <p className="text-sm text-ink-soft">
        The WhatsApp assistant checks these counts before adding anything to a cart. Stock is reserved when an order is placed and returned if it's rejected or cancelled.
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filter === c ? 'bg-ink text-paper' : 'bg-white text-ink-soft hover:text-ink'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-paper-2/60 text-left text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Product</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Customers say</th>
              <th className="px-4 py-2.5 text-right font-semibold">Price</th>
              <th className="px-4 py-2.5 text-center font-semibold">In stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.flatMap((p) =>
              p.variants.map((v) => {
                const qty = stock[v.id] ?? 0
                return (
                  <tr key={v.id} className="border-t border-ink/5">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{v.label}</div>
                      <div className="text-xs text-ink-soft">
                        {p.name} · per {p.unit}
                      </div>
                    </td>
                    <td className="hidden px-4 py-2.5 md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.aliases.slice(0, 4).map((a) => (
                          <span key={a} className="rounded bg-mint/60 px-1.5 py-0.5 text-[11px] text-leaf">
                            {a}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{rupee(v.price)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setStock(v.id, qty - 1)}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-ink/10 hover:bg-ink/5"
                          aria-label={`Decrease ${v.label}`}
                        >
                          <Minus size={13} />
                        </button>
                        <span
                          className={`w-12 rounded-md py-0.5 text-center font-mono text-sm font-medium ${
                            qty === 0 ? 'bg-chili/10 text-chili' : qty < 8 ? 'bg-turmeric-soft' : ''
                          }`}
                        >
                          {qty}
                        </span>
                        <button
                          onClick={() => setStock(v.id, qty + 1)}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-ink/10 hover:bg-ink/5"
                          aria-label={`Increase ${v.label}`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Insights() {
  const totalOrders = weeklyAnalytics.orders.reduce((a, b) => a + b, 0)
  const totalRevenue = weeklyAnalytics.revenue.reduce((a, b) => a + b, 0)
  const maxUnits = Math.max(...weeklyAnalytics.topProducts.map((p) => p.units))
  const chartData = useMemo(
    () => ({
      labels: weeklyAnalytics.days,
      datasets: [
        {
          label: 'Revenue',
          data: weeklyAnalytics.revenue,
          backgroundColor: weeklyAnalytics.days.map((_, i) => (i === weeklyAnalytics.days.length - 1 ? '#f2a516' : '#0f5c45')),
          borderRadius: 8,
          maxBarThickness: 42,
        },
      ],
    }),
    [],
  )
  const langColors = ['#0f5c45', '#1f8a5b', '#f2a516', '#d4452c']
  return (
    <div className="rise space-y-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Insights · last 7 days</h1>
        <p className="text-sm text-ink-soft">How your WhatsApp store is doing.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Orders', String(totalOrders)],
          ['Revenue', rupee(totalRevenue)],
          ['Avg. basket', rupee(Math.round(totalRevenue / totalOrders))],
          ['Repeat customers', `${Math.round((customers.filter((c) => c.orders > 5).length / customers.length) * 100)}%`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-ink/10 bg-white p-4">
            <div className="text-xs font-medium text-ink-soft">{k}</div>
            <div className="mt-1 font-display text-2xl font-extrabold tracking-tight">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg font-bold">Daily revenue</h2>
          <div className="mt-3 h-64">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (c) => rupee(Number(c.raw)) } },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#4b5d55' } },
                  y: { grid: { color: 'rgba(19,38,31,0.06)' }, ticks: { color: '#4b5d55', callback: (v) => '₹' + Number(v) / 1000 + 'k' } },
                },
              }}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="font-display text-lg font-bold">Top products</h2>
            <ul className="mt-3 space-y-2.5">
              {weeklyAnalytics.topProducts.map((p) => (
                <li key={p.name} className="text-sm">
                  <div className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="font-mono text-xs text-ink-soft">{p.units}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-paper-2">
                    <div className="h-full rounded-full bg-leaf-2" style={{ width: `${(p.units / maxUnits) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="font-display text-lg font-bold">Conversation languages</h2>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full">
              {weeklyAnalytics.languageMix.map((l, i) => (
                <div key={l.label} style={{ width: `${l.share}%`, background: langColors[i] }} />
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
              {weeklyAnalytics.languageMix.map((l, i) => (
                <li key={l.label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: langColors[i] }} />
                  {l.label} <span className="ml-auto font-mono text-ink-soft">{l.share}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Settings() {
  const fields = [
    ['Store name', storeConfig.name],
    ['WhatsApp number', storeConfig.whatsappNumber],
    ['Opening hours', storeConfig.hours],
    ['Delivery radius', `${storeConfig.deliveryRadiusKm} km`],
    ['Delivery fee', rupee(storeConfig.deliveryFee)],
    ['Free delivery above', rupee(storeConfig.freeDeliveryAbove)],
    ['Minimum order', rupee(storeConfig.minimumOrder)],
    ['Languages', storeConfig.languages.join(', ')],
  ]
  const [payments, setPayments] = useState({ cod: true, upi: true })
  return (
    <div className="rise">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Store settings</h1>
      <p className="text-sm text-ink-soft">These rules are enforced by the order service on every WhatsApp order.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <dl className="divide-y divide-ink/5">
            {fields.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 text-sm">
                <dt className="text-ink-soft">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="font-display text-lg font-bold">Payment methods</h2>
            {(
              [
                ['cod', 'Cash on delivery', 'Collect at the door; mark paid from the order.'],
                ['upi', 'UPI payment link', 'Customer gets a UPI link before confirmation.'],
              ] as const
            ).map(([key, label, hint]) => (
              <label key={key} className="mt-3 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={payments[key]}
                  onChange={(e) => setPayments((p) => ({ ...p, [key]: e.target.checked }))}
                  className="mt-1 h-4 w-4 accent-leaf"
                />
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="text-xs text-ink-soft">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="font-display text-lg font-bold">Team</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {[
                ['Rakesh Sharma', 'Owner · Admin'],
                ['Pooja', 'Staff · Orders & stock'],
                ['Imran', 'Delivery'],
              ].map(([n, r]) => (
                <li key={n} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-mint font-semibold text-leaf">{n[0]}</span>
                  <span className="font-medium">{n}</span>
                  <span className="ml-auto text-xs text-ink-soft">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
