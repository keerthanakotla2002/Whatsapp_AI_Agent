// Rule-based stand-in for the AI ordering agent. It mirrors the planned tool-calling
// contract (search_products, check_stock, add_to_cart, ...) and logs every call to a
// trace so the UI can show how the real LLM orchestrator will behave. Prices, totals and
// stock always come from the service layer (demoStore/fixtures), never from the "model".
import { catalogue, storeConfig, statusLabel, rupee, type OrderItem, type Product, type Variant, type Language } from './fixtures'
import { getDemoState, placeOrder, setOrderStatus, DEMO_PHONE } from './demoStore'

export interface ToolCall {
  tool: string
  args: string
  result: string
}

export interface CartLine {
  product: Product
  variant: Variant
  qty: number
}

interface Pending {
  product: Product
  qty: number
}

export interface Session {
  lang: Language
  cart: CartLine[]
  name: string | null
  address: string | null
  payment: 'COD' | 'UPI' | null
  stage: 'browse' | 'variant' | 'reduce' | 'name' | 'address' | 'payment' | 'confirm'
  queue: Pending[] // items that still need a clarifying answer, asked one at a time
  offer: CartLine | null // reduced-quantity offer awaiting yes/no
}

export const newSession = (): Session => ({
  lang: 'en',
  cart: [],
  name: null,
  address: null,
  payment: null,
  stage: 'browse',
  queue: [],
  offer: null,
})

export interface AgentTurn {
  replies: string[]
  trace: ToolCall[]
  intent: string
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10,
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, das: 10,
  half: 0.5, aadha: 0.5,
}

const HINGLISH_HINTS = /\b(aur|kilo|chahiye|haan|han|mera|meri|kaha|kahan|bhaiya|bhai|dena|karo|kya|nahi|nahin|wala|wali|kab|aayega|hatao|bas|ji|theek)\b/i
const YES = /^(yes|y|haan|han|ha|ok|okay|confirm|sure|theek hai|thik hai|ji|हाँ|हां|avunu|sare)(?![a-z])/i
const NO = /^(no|n|nahi|nahin|nope|cancel it|नहीं)(?![a-z])/i

type Key =
  | 'welcome' | 'added' | 'which' | 'oos' | 'short' | 'notFound' | 'cartEmpty' | 'cart'
  | 'askName' | 'askAddress' | 'askPayment' | 'summary' | 'placed' | 'minOrder' | 'status'
  | 'noOrders' | 'history' | 'cancelled' | 'cantCancel' | 'handoff' | 'removed' | 'menu'
  | 'notConfirmed' | 'fallback' | 'more'

const COPY: Record<Key, Record<'en' | 'hinglish' | 'hi', string>> = {
  welcome: {
    en: `Hi! Welcome to ${storeConfig.name} 🛒 Tell me what you need, e.g. "2 kg rice and 1 litre milk".`,
    hinglish: `Namaste! ${storeConfig.name} mein swagat hai 🛒 Batayiye kya chahiye, jaise "2 kilo chawal aur ek litre doodh".`,
    hi: `नमस्ते! ${storeConfig.name} में स्वागत है 🛒 बताइए क्या चाहिए, जैसे "2 किलो चावल और 1 लीटर दूध"।`,
  },
  added: { en: 'Added {item} to your cart.', hinglish: '{item} cart mein daal diya.', hi: '{item} कार्ट में जोड़ दिया।' },
  which: {
    en: 'Which {product} would you like?\n{options}',
    hinglish: 'Kaunsa {product} chahiye?\n{options}',
    hi: 'कौन सा {product} चाहिए?\n{options}',
  },
  oos: {
    en: 'Sorry, {item} is out of stock right now. You could try: {alts}',
    hinglish: 'Sorry, {item} abhi stock mein nahi hai. Yeh try karein: {alts}',
    hi: 'माफ़ कीजिए, {item} अभी स्टॉक में नहीं है। ये देखें: {alts}',
  },
  short: {
    en: 'Only {n} of {item} left. Shall I add {n} instead?',
    hinglish: '{item} sirf {n} bache hain. {n} daal doon?',
    hi: '{item} सिर्फ़ {n} बचे हैं। {n} जोड़ दूँ?',
  },
  notFound: {
    en: "I couldn't find that in our catalogue. Type \"menu\" to see what we stock.",
    hinglish: 'Yeh item catalogue mein nahi mila. "menu" likhiye poori list ke liye.',
    hi: 'यह आइटम कैटलॉग में नहीं मिला। पूरी सूची के लिए "menu" लिखें।',
  },
  cartEmpty: { en: 'Your cart is empty.', hinglish: 'Aapka cart khaali hai.', hi: 'आपका कार्ट खाली है।' },
  cart: { en: 'Your cart:\n{lines}\nSubtotal: {subtotal}', hinglish: 'Aapka cart:\n{lines}\nSubtotal: {subtotal}', hi: 'आपका कार्ट:\n{lines}\nकुल: {subtotal}' },
  more: {
    en: 'Anything else? Say "checkout" when you\'re done.',
    hinglish: 'Aur kuch? Ho gaya toh "checkout" likhiye.',
    hi: 'और कुछ? हो जाए तो "checkout" लिखें।',
  },
  askName: { en: "Great! What's your name?", hinglish: 'Badhiya! Aapka naam kya hai?', hi: 'बढ़िया! आपका नाम क्या है?' },
  askAddress: {
    en: 'Thanks {name}. Please share your delivery address.',
    hinglish: 'Shukriya {name}. Delivery address bata dijiye.',
    hi: 'धन्यवाद {name}। डिलीवरी का पता बताइए।',
  },
  askPayment: {
    en: 'How would you like to pay? Reply COD (cash on delivery) or UPI.',
    hinglish: 'Payment kaise karenge? COD (cash on delivery) ya UPI likhiye.',
    hi: 'भुगतान कैसे करेंगे? COD (कैश ऑन डिलीवरी) या UPI लिखें।',
  },
  summary: {
    en: 'Order summary\n{lines}\nSubtotal {subtotal}\nDelivery {fee}\nTotal {total}\nPay: {payment}\nDeliver to: {address}\n\nReply YES to confirm.',
    hinglish: 'Order summary\n{lines}\nSubtotal {subtotal}\nDelivery {fee}\nTotal {total}\nPayment: {payment}\nAddress: {address}\n\nConfirm karne ke liye HAAN likhiye.',
    hi: 'ऑर्डर सारांश\n{lines}\nउप-योग {subtotal}\nडिलीवरी {fee}\nकुल {total}\nभुगतान: {payment}\nपता: {address}\n\nपुष्टि के लिए "हाँ" लिखें।',
  },
  placed: {
    en: 'Order {id} placed ✅ The store will confirm shortly. {pay}',
    hinglish: 'Order {id} place ho gaya ✅ Store jaldi confirm karega. {pay}',
    hi: 'ऑर्डर {id} हो गया ✅ दुकान जल्द पुष्टि करेगी। {pay}',
  },
  minOrder: {
    en: 'Minimum order is {min}. Your cart is at {subtotal} — add a little more?',
    hinglish: 'Minimum order {min} hai. Abhi cart {subtotal} ka hai — thoda aur add karein?',
    hi: 'न्यूनतम ऑर्डर {min} है। अभी कार्ट {subtotal} का है — कुछ और जोड़ें?',
  },
  status: {
    en: 'Order {id}: {status}. {items} · {total}',
    hinglish: 'Order {id}: {status}. {items} · {total}',
    hi: 'ऑर्डर {id}: {status}। {items} · {total}',
  },
  noOrders: { en: "You haven't placed any orders yet.", hinglish: 'Abhi tak koi order nahi hai.', hi: 'अभी तक कोई ऑर्डर नहीं है।' },
  history: { en: 'Your recent orders:\n{lines}', hinglish: 'Aapke recent orders:\n{lines}', hi: 'आपके हाल के ऑर्डर:\n{lines}' },
  cancelled: { en: 'Order {id} has been cancelled.', hinglish: 'Order {id} cancel kar diya.', hi: 'ऑर्डर {id} रद्द कर दिया।' },
  cantCancel: {
    en: 'Order {id} is already {status}, so it can no longer be cancelled. I can connect you to the store.',
    hinglish: 'Order {id} already {status} hai, ab cancel nahi ho sakta. Store se baat karwa doon?',
    hi: 'ऑर्डर {id} पहले ही {status} है, अब रद्द नहीं हो सकता।',
  },
  handoff: {
    en: "I've passed this to the store team — someone will reply here shortly.",
    hinglish: 'Maine store team ko bata diya hai — jaldi koi yahin reply karega.',
    hi: 'मैंने दुकान की टीम को बता दिया है — जल्द कोई यहीं जवाब देगा।',
  },
  removed: { en: 'Removed {item} from your cart.', hinglish: '{item} cart se hata diya.', hi: '{item} कार्ट से हटा दिया।' },
  menu: { en: "Here's what we stock today:\n{lines}", hinglish: 'Aaj ka stock:\n{lines}', hi: 'आज का स्टॉक:\n{lines}' },
  notConfirmed: {
    en: 'No problem, nothing was ordered. You can edit your cart or say "checkout" again.',
    hinglish: 'Koi baat nahi, order nahi hua. Cart badal sakte hain ya phir se "checkout" likhiye.',
    hi: 'कोई बात नहीं, ऑर्डर नहीं हुआ।',
  },
  fallback: {
    en: 'Sorry, I didn\'t catch that. You can order items, ask "where is my order?", or say "menu".',
    hinglish: 'Samjha nahi. Aap items order kar sakte hain, "mera order kahan hai?" pooch sakte hain, ya "menu" likhiye.',
    hi: 'समझ नहीं आया। आप सामान ऑर्डर कर सकते हैं या "मेरा ऑर्डर कहाँ है?" पूछ सकते हैं।',
  },
}

function t(lang: Language, key: Key, vars: Record<string, string | number> = {}) {
  const l = lang === 'te' ? 'en' : lang
  return COPY[key][l].replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

function detectLanguage(text: string, current: Language): Language {
  if (/[ऀ-ॿ]/.test(text)) return 'hi'
  if (/[ఀ-౿]/.test(text)) return 'te'
  if (HINGLISH_HINTS.test(text)) return 'hinglish'
  if (/[a-z]{3,}/i.test(text) && current !== 'en' && text.split(' ').length > 2) return 'en'
  return current
}

function findProduct(segment: string): Product | null {
  const s = segment.toLowerCase()
  for (const p of catalogue) {
    if (p.aliases.some((a) => s.includes(a.toLowerCase()))) return p
  }
  return null
}

function findQty(segment: string): number {
  const digits = segment.match(/(\d+(?:\.\d+)?)/)
  if (digits) return Number(digits[1])
  for (const [w, n] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(segment)) return n
  }
  return 1
}

const stockOf = (v: Variant) => getDemoState().stock[v.id] ?? 0
const lineText = (l: CartLine) => `${l.qty} × ${l.variant.label} (${l.product.unit}) — ${rupee(l.qty * l.variant.price)}`
// Distinctive words in a variant label ("basmati", "brown"), ignoring the product's own aliases.
const variantMentioned = (product: Product, v: Variant, text: string) =>
  v.label
    .toLowerCase()
    .split(/[\s()]+/)
    .some((w) => w.length > 3 && !product.aliases.includes(w) && text.includes(w))
const subtotalOf = (cart: CartLine[]) => cart.reduce((s, l) => s + l.qty * l.variant.price, 0)

export function cartTotals(cart: CartLine[]) {
  const subtotal = subtotalOf(cart)
  const fee = subtotal === 0 || subtotal >= storeConfig.freeDeliveryAbove ? 0 : storeConfig.deliveryFee
  return { subtotal, fee, total: subtotal + fee }
}

function myOrders() {
  return getDemoState().orders.filter((o) => o.phone === DEMO_PHONE)
}

export function respond(session: Session, raw: string): AgentTurn {
  const text = raw.trim()
  const lower = text.toLowerCase()
  if (session.stage !== 'name' && session.stage !== 'address') session.lang = detectLanguage(text, session.lang)
  const L = session.lang
  const replies: string[] = []
  const trace: ToolCall[] = []
  const log = (tool: string, args: object, result: string) =>
    trace.push({ tool, args: JSON.stringify(args), result })

  const addLine = (product: Product, variant: Variant, qty: number) => {
    const available = stockOf(variant)
    log('check_stock', { variant: variant.id, qty }, `${available} available`)
    if (available === 0) {
      const alts = product.variants.filter((v) => v.id !== variant.id && stockOf(v) > 0)
      const altList = alts.length
        ? alts.map((v) => `${v.label} ${rupee(v.price)}`).join(', ')
        : catalogue
            .filter((p) => p.category === product.category && p.id !== product.id)
            .slice(0, 2)
            .map((p) => p.variants[0].label)
            .join(', ')
      replies.push(t(L, 'oos', { item: variant.label, alts: altList }))
      return
    }
    if (available < qty) {
      session.offer = { product, variant, qty: available }
      session.stage = 'reduce'
      replies.push(t(L, 'short', { n: available, item: variant.label }))
      return
    }
    const existing = session.cart.find((l) => l.variant.id === variant.id)
    if (existing) existing.qty += qty
    else session.cart.push({ product, variant, qty })
    log('add_to_cart', { variant: variant.id, qty }, 'ok')
    replies.push(t(L, 'added', { item: /^\d/.test(product.unit) ? `${qty} × ${variant.label}` : `${qty} ${product.unit} ${variant.label}` }))
  }

  const askNextClarification = () => {
    const next = session.queue[0]
    if (!next) return false
    session.stage = 'variant'
    const options = next.product.variants
      .map((v, i) => `${i + 1}. ${v.label} — ${rupee(v.price)}/${next.product.unit}${stockOf(v) === 0 ? ' (out of stock)' : ''}`)
      .join('\n')
    replies.push(t(L, 'which', { product: next.product.name.toLowerCase(), options }))
    return true
  }

  const afterItems = () => {
    if (session.stage === 'reduce') return
    if (!askNextClarification()) {
      session.stage = 'browse'
      if (session.cart.length) {
        log('view_cart', {}, `${session.cart.length} lines, ${rupee(subtotalOf(session.cart))}`)
        replies.push(t(L, 'cart', { lines: session.cart.map(lineText).join('\n'), subtotal: rupee(subtotalOf(session.cart)) }))
        replies.push(t(L, 'more'))
      }
    }
  }

  const summary = () => {
    const { subtotal, fee, total } = cartTotals(session.cart)
    log('view_cart', { totals: true }, `subtotal ${subtotal}, fee ${fee}, total ${total}`)
    session.stage = 'confirm'
    replies.push(
      t(L, 'summary', {
        lines: session.cart.map(lineText).join('\n'),
        subtotal: rupee(subtotal),
        fee: fee === 0 ? 'FREE' : rupee(fee),
        total: rupee(total),
        payment: session.payment === 'UPI' ? 'UPI' : 'Cash on delivery',
        address: session.address ?? '',
      }),
    )
  }

  const checkout = () => {
    if (!session.cart.length) {
      replies.push(t(L, 'cartEmpty'))
      return
    }
    const subtotal = subtotalOf(session.cart)
    if (subtotal < storeConfig.minimumOrder) {
      replies.push(t(L, 'minOrder', { min: rupee(storeConfig.minimumOrder), subtotal: rupee(subtotal) }))
      return
    }
    if (!session.name) {
      session.stage = 'name'
      replies.push(t(L, 'askName'))
    } else if (!session.address) {
      session.stage = 'address'
      replies.push(t(L, 'askAddress', { name: session.name }))
    } else if (!session.payment) {
      session.stage = 'payment'
      replies.push(t(L, 'askPayment'))
    } else summary()
  }

  // ---- Stage-specific answers (the agent's open clarifying question) ----
  if (session.stage === 'variant' && session.queue[0]) {
    const pending = session.queue[0]
    const idx = Number(lower.match(/^\d/)?.[0]) - 1
    const variant =
      pending.product.variants[idx] ??
      pending.product.variants.find((v) => variantMentioned(pending.product, v, lower))
    if (variant) {
      session.queue.shift()
      session.stage = 'browse'
      addLine(pending.product, variant, pending.qty)
      afterItems()
      return { replies, trace, intent: 'clarify_variant' }
    }
  }

  if (session.stage === 'reduce' && session.offer) {
    const offer = session.offer
    session.offer = null
    session.stage = 'browse'
    if (YES.test(lower)) addLine(offer.product, offer.variant, offer.qty)
    afterItems()
    if (!replies.length) replies.push(t(L, 'more'))
    return { replies, trace, intent: 'reduce_quantity' }
  }

  if (session.stage === 'name' && text.length > 1) {
    session.name = text.replace(/^(my name is|i am|mera naam|naam)\s*/i, '').replace(/\s*(hai|h)$/i, '')
    log('save_customer', { name: session.name }, 'ok')
    checkout()
    return { replies, trace, intent: 'collect_name' }
  }

  if (session.stage === 'address' && text.length > 4) {
    session.address = text
    log('save_address', { address: '[redacted]' }, 'ok')
    checkout()
    return { replies, trace, intent: 'collect_address' }
  }

  if (session.stage === 'payment') {
    if (/upi|gpay|phonepe|paytm/i.test(lower)) session.payment = 'UPI'
    else if (/cod|cash/i.test(lower)) session.payment = 'COD'
    if (session.payment) {
      summary()
      return { replies, trace, intent: 'collect_payment' }
    }
  }

  if (session.stage === 'confirm') {
    if (YES.test(lower)) {
      const items: OrderItem[] = session.cart.map((l) => ({
        variantId: l.variant.id,
        productName: l.product.name,
        variantLabel: l.variant.label,
        qty: l.qty,
        price: l.variant.price,
      }))
      const order = placeOrder({
        customerName: session.name ?? 'Customer',
        phone: DEMO_PHONE,
        address: session.address ?? '',
        items,
        paymentMethod: session.payment ?? 'COD',
      })
      if (!order) {
        log('place_order', { confirmed: true }, 'rejected: stock changed')
        session.stage = 'browse'
        replies.push(t(L, 'oos', { item: 'an item in your cart', alts: 'please review your cart' }))
        return { replies, trace, intent: 'place_order' }
      }
      log('place_order', { confirmed: true, items: items.length }, `created ${order.id}, stock reserved`)
      replies.push(
        t(L, 'placed', {
          id: order.id,
          pay: order.paymentMethod === 'UPI' ? `Paid ${rupee(order.total)} via UPI.` : `Pay ${rupee(order.total)} on delivery.`,
        }),
      )
      session.cart = []
      session.payment = null
      session.stage = 'browse'
      return { replies, trace, intent: 'place_order' }
    }
    if (NO.test(lower)) {
      session.stage = 'browse'
      replies.push(t(L, 'notConfirmed'))
      return { replies, trace, intent: 'decline_confirmation' }
    }
  }

  // ---- Free-form intents ----
  if (/complain|complaint|refund|human|manager|shikayat|baat karni|talk to/i.test(lower)) {
    log('handoff_to_human', { reason: 'customer request' }, 'store alerted')
    replies.push(t(L, 'handoff'))
    return { replies, trace, intent: 'handoff' }
  }

  if (/where.*order|order.*(status|kaha|kahan|kab)|kab aayega|track|status|ऑर्डर कहाँ/i.test(lower)) {
    const latest = myOrders()[0]
    log('get_order_status', { scope: 'own orders only' }, latest ? `${latest.id} ${latest.status}` : 'none')
    if (!latest) replies.push(t(L, 'noOrders'))
    else
      replies.push(
        t(L, 'status', {
          id: latest.id,
          status: statusLabel[latest.status],
          items: latest.items.map((i) => `${i.qty} × ${i.variantLabel}`).join(', '),
          total: rupee(latest.total),
        }),
      )
    return { replies, trace, intent: 'order_status' }
  }

  if (/history|my orders|past orders|previous|pichle|purane/i.test(lower)) {
    const orders = myOrders()
    log('list_orders', { scope: 'own orders only' }, `${orders.length} orders`)
    replies.push(
      orders.length
        ? t(L, 'history', { lines: orders.slice(0, 5).map((o) => `${o.id} · ${statusLabel[o.status]} · ${rupee(o.total)}`).join('\n') })
        : t(L, 'noOrders'),
    )
    return { replies, trace, intent: 'order_history' }
  }

  if (/cancel/i.test(lower) && !/cart/i.test(lower)) {
    const latest = myOrders()[0]
    if (!latest) {
      replies.push(t(L, 'noOrders'))
    } else if (latest.status === 'PENDING') {
      setOrderStatus(latest.id, 'CANCELLED')
      log('cancel_order', { order: latest.id }, 'cancelled, stock released')
      replies.push(t(L, 'cancelled', { id: latest.id }))
    } else {
      log('cancel_order', { order: latest.id }, `refused: ${latest.status}`)
      replies.push(t(L, 'cantCancel', { id: latest.id, status: statusLabel[latest.status].toLowerCase() }))
    }
    return { replies, trace, intent: 'cancel_order' }
  }

  if (/^(hi|hello|hey|namaste|namaskar|hola|నమస్తే|नमस्ते)(?![a-z])/i.test(lower) && !findProduct(lower)) {
    replies.push(t(L, 'welcome'))
    return { replies, trace, intent: 'greeting' }
  }

  if (/menu|catalog|what do you have|kya milega|kya hai aapke paas|list/i.test(lower)) {
    log('search_products', { query: '*' }, `${catalogue.length} products`)
    replies.push(
      t(L, 'menu', {
        lines: catalogue
          .map((p) => {
            const inStock = p.variants.filter((v) => stockOf(v) > 0)
            const from = Math.min(...p.variants.map((v) => v.price))
            return `• ${p.name} — from ${rupee(from)}/${p.unit}${inStock.length ? '' : ' (out of stock)'}`
          })
          .join('\n'),
      }),
    )
    return { replies, trace, intent: 'browse_catalogue' }
  }

  if (/^(view )?cart|basket|mera cart|show cart/i.test(lower)) {
    log('view_cart', {}, `${session.cart.length} lines`)
    replies.push(
      session.cart.length
        ? t(L, 'cart', { lines: session.cart.map(lineText).join('\n'), subtotal: rupee(subtotalOf(session.cart)) })
        : t(L, 'cartEmpty'),
    )
    return { replies, trace, intent: 'view_cart' }
  }

  if (/remove|hatao|hata do|nikal/i.test(lower)) {
    const product = findProduct(lower)
    const line = product && session.cart.find((l) => l.product.id === product.id)
    if (line) {
      session.cart = session.cart.filter((l) => l !== line)
      log('remove_from_cart', { variant: line.variant.id }, 'ok')
      replies.push(t(L, 'removed', { item: line.variant.label }))
    } else replies.push(t(L, 'notFound'))
    return { replies, trace, intent: 'remove_from_cart' }
  }

  if (/checkout|place order|order (karo|kar do)|bas itna|that's all|thats all|done|confirm order/i.test(lower)) {
    checkout()
    return { replies, trace, intent: 'checkout' }
  }

  // ---- Product request: split multi-item messages and resolve each ----
  const segments = lower.split(/\s+(?:aur|and|n|\+|&|మరియు|और)\s+|,/).filter(Boolean)
  let matched = false
  for (const seg of segments) {
    const product = findProduct(seg)
    if (!product) continue
    matched = true
    const qty = findQty(seg)
    log('search_products', { query: seg.trim() }, `${product.name}: ${product.variants.length} variant(s)`)
    const named = product.variants.find((v) => variantMentioned(product, v, seg))
    if (product.variants.length === 1 || named) addLine(product, named ?? product.variants[0], qty)
    else session.queue.push({ product, qty })
  }
  if (matched) {
    afterItems()
    return { replies, trace, intent: 'add_items' }
  }

  replies.push(t(L, 'fallback'))
  return { replies, trace, intent: 'unknown' }
}
