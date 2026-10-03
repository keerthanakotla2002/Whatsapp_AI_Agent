import type { ReactNode } from 'react'
import { ChevronLeft, Phone as PhoneIcon, Video, ShieldCheck } from 'lucide-react'
import { storeConfig } from '@/lib/fixtures'

export interface ChatMessage {
  id: string
  from: 'customer' | 'agent' | 'update'
  text: string
  at: number
}

const time = (at: number) => new Date(at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export function Bubble({ msg }: { msg: ChatMessage }) {
  const mine = msg.from === 'customer'
  if (msg.from === 'update') {
    return (
      <div className="pop mx-auto my-1 w-[88%] rounded-lg border-l-4 border-turmeric bg-white px-3 py-2 text-[13px] shadow-sm">
        <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-leaf">Order update</div>
        <p className="whitespace-pre-line leading-snug">{msg.text}</p>
        <div className="mt-1 text-right text-[10px] text-ink-soft" suppressHydrationWarning>{time(msg.at)}</div>
      </div>
    )
  }
  return (
    <div className={`pop flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[82%] rounded-xl px-3 py-1.5 text-[13.5px] leading-snug shadow-[0_1px_0_rgba(0,0,0,0.08)] ${
          mine ? 'rounded-tr-sm bg-bubble-out' : 'rounded-tl-sm bg-white'
        }`}
      >
        <p className="whitespace-pre-line">{msg.text}</p>
        <div className="mt-0.5 text-right text-[10px] text-ink-soft/80" suppressHydrationWarning>
          {time(msg.at)}
          {mine && <span className="ml-1 text-sky-500">✓✓</span>}
        </div>
      </div>
    </div>
  )
}

export function Typing() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-1 rounded-xl rounded-tl-sm bg-white px-3 py-2.5 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-soft" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

export function PhoneFrame({ children, footer, className = '' }: { children: ReactNode; footer?: ReactNode; className?: string }) {
  return (
    <div
      className={`relative mx-auto flex h-[640px] w-full max-w-[360px] flex-col overflow-hidden rounded-[2.4rem] border-[10px] border-ink bg-ink shadow-[0_30px_60px_-20px_rgba(19,38,31,0.55)] ${className}`}
    >
      <div className="absolute left-1/2 top-1.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
      <div className="flex items-center gap-2 bg-leaf px-3 pb-2.5 pt-7 text-paper">
        <ChevronLeft size={20} />
        <div className="grid h-9 w-9 place-items-center rounded-full bg-turmeric font-display text-sm font-extrabold text-ink">SG</div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1 truncate text-[15px] font-semibold">
            {storeConfig.name} <ShieldCheck size={14} className="text-turmeric" />
          </div>
          <div className="text-[11px] text-paper/70">Business account · usually replies instantly</div>
        </div>
        <Video size={18} className="opacity-80" />
        <PhoneIcon size={16} className="opacity-80" />
      </div>
      <div className="chat-wallpaper flex flex-1 flex-col overflow-hidden">{children}</div>
      {footer}
    </div>
  )
}
