import { Link } from '@tanstack/react-router'
import { MessageCircle } from 'lucide-react'

const links = [
  { to: '/', label: 'Overview' },
  { to: '/chat', label: 'Try the WhatsApp agent' },
  { to: '/dashboard', label: 'Store dashboard' },
] as const

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf text-turmeric shadow-[3px_3px_0_var(--color-turmeric)]">
            <MessageCircle size={19} strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            Dukaan<span className="text-leaf-2">Dost</span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm font-medium">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: true }}
              className="rounded-full px-3 py-1.5 text-ink-soft transition hover:bg-ink/5 hover:text-ink"
              activeProps={{ className: 'bg-ink !text-paper hover:bg-ink' }}
            >
              <span className={l.to === '/' ? 'hidden sm:inline' : ''}>{l.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
