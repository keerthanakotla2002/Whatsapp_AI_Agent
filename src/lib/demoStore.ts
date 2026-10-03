// In-browser demo state shared by the WhatsApp simulator and the store dashboard, so an
// order placed in /chat appears live on /dashboard and status changes flow back to chat.
// A later milestone replaces this with Netlify Database + server functions.
import { useSyncExternalStore } from 'react'
import {
  catalogue,
  seedOrders,
  storeConfig,
  statusLabel,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
} from './fixtures'

export interface StoreNotification {
  id: string
  orderId: string
  phone: string
  text: string
  at: number
}

interface DemoState {
  orders: Order[]
  stock: Record<string, number>
  notifications: StoreNotification[]
}

const initialStock: Record<string, number> = {}
for (const p of catalogue) for (const v of p.variants) initialStock[v.id] = v.stock

let state: DemoState = {
  orders: seedOrders,
  stock: initialStock,
  notifications: [],
}
const listeners = new Set<() => void>()

function setState(updater: (prev: DemoState) => DemoState) {
  state = updater(state)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useDemoState() {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

export function getDemoState() {
  return state
}

export const DEMO_PHONE = '+91 99999 00001'

const customerUpdate: Record<OrderStatus, string> = {
  PENDING: 'We have received your order and are waiting for the store to confirm.',
  ACCEPTED: 'Good news! Your order has been accepted by the store.',
  PREPARING: 'Your order is being packed right now.',
  OUT_FOR_DELIVERY: 'Your order is out for delivery and will reach you shortly.',
  DELIVERED: 'Your order has been delivered. Thank you for shopping with us!',
  REJECTED: 'Sorry, the store could not fulfil your order. Any payment will be refunded.',
  CANCELLED: 'Your order has been cancelled as requested.',
}

/** Reserves stock and creates a PENDING order. Returns null if any line is short on stock. */
export function placeOrder(input: {
  customerName: string
  phone: string
  address: string
  items: OrderItem[]
  paymentMethod: PaymentMethod
}): Order | null {
  for (const item of input.items) {
    if ((state.stock[item.variantId] ?? 0) < item.qty) return null
  }
  const subtotal = input.items.reduce((s, i) => s + i.price * i.qty, 0)
  const deliveryFee = subtotal >= storeConfig.freeDeliveryAbove ? 0 : storeConfig.deliveryFee
  const nextNum = Math.max(...state.orders.map((o) => Number(o.id.split('-')[1]))) + 1
  const at = Date.now()
  const order: Order = {
    id: `DD-${nextNum}`,
    customerName: input.customerName,
    phone: input.phone,
    address: input.address,
    language: 'en',
    items: input.items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    status: 'PENDING',
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === 'UPI' ? 'PAID' : 'UNPAID',
    placedAt: at,
    events: [{ status: 'PENDING', at }],
  }
  setState((s) => {
    const stock = { ...s.stock }
    for (const item of input.items) stock[item.variantId] -= item.qty
    return { ...s, orders: [order, ...s.orders], stock }
  })
  return order
}

export function setOrderStatus(orderId: string, status: OrderStatus) {
  setState((s) => {
    const order = s.orders.find((o) => o.id === orderId)
    if (!order) return s
    const stock = { ...s.stock }
    const releases = status === 'REJECTED' || status === 'CANCELLED'
    if (releases) for (const item of order.items) stock[item.variantId] += item.qty
    const updated: Order = {
      ...order,
      status,
      paymentStatus:
        releases && order.paymentStatus === 'PAID'
          ? 'REFUNDED'
          : status === 'DELIVERED'
            ? 'PAID'
            : order.paymentStatus,
      events: [...order.events, { status, at: Date.now() }],
    }
    const notification: StoreNotification = {
      id: `${orderId}-${status}-${Date.now()}`,
      orderId,
      phone: order.phone,
      text: `Order ${orderId} · ${statusLabel[status]}\n${customerUpdate[status]}`,
      at: Date.now(),
    }
    return {
      ...s,
      stock,
      orders: s.orders.map((o) => (o.id === orderId ? updated : o)),
      notifications: [...s.notifications, notification],
    }
  })
}

export function markPaid(orderId: string) {
  setState((s) => ({
    ...s,
    orders: s.orders.map((o) => (o.id === orderId ? { ...o, paymentStatus: 'PAID' } : o)),
  }))
}

export function setStock(variantId: string, qty: number) {
  setState((s) => ({ ...s, stock: { ...s.stock, [variantId]: Math.max(0, qty) } }))
}

/** Free-text message from store staff to a customer's WhatsApp. */
export function sendStoreMessage(orderId: string, text: string) {
  setState((s) => {
    const order = s.orders.find((o) => o.id === orderId)
    if (!order) return s
    const at = Date.now()
    return {
      ...s,
      notifications: [...s.notifications, { id: `${orderId}-msg-${at}`, orderId, phone: order.phone, text: `Message from the store:\n${text}`, at }],
    }
  })
}
