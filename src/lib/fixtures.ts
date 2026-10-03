// Stubbed demo data for DukaanDost. Every screen reads from this module so a later
// milestone can swap these fixtures for Netlify Database queries without touching UI.

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED'

export type PaymentMethod = 'COD' | 'UPI'
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED'
export type Language = 'en' | 'hinglish' | 'hi' | 'te'

export interface Variant {
  id: string
  label: string
  price: number // in rupees
  stock: number
}

export interface Product {
  id: string
  name: string
  category: string
  aliases: string[] // natural-language terms that map to this product
  unit: string
  variants: Variant[]
}

export interface OrderItem {
  variantId: string
  productName: string
  variantLabel: string
  qty: number
  price: number
}

export interface Order {
  id: string
  customerName: string
  phone: string
  address: string
  language: Language
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  placedAt: number
  events: { status: OrderStatus; at: number }[]
}

export interface Customer {
  phone: string
  name: string
  address: string
  language: Language
  orders: number
  lifetimeValue: number
}

export const storeConfig = {
  name: 'Sharma General Store',
  hours: '7:00 AM – 10:00 PM',
  deliveryFee: 30,
  freeDeliveryAbove: 499,
  minimumOrder: 150,
  deliveryRadiusKm: 3,
  languages: ['English', 'Hinglish', 'हिन्दी', 'తెలుగు'],
  whatsappNumber: '+91 98765 43210',
}

export const catalogue: Product[] = [
  {
    id: 'rice',
    name: 'Rice',
    category: 'Staples',
    aliases: ['rice', 'chawal', 'chaval', 'బియ్యం', 'चावल'],
    unit: 'kg',
    variants: [
      { id: 'rice-basmati', label: 'India Gate Basmati', price: 140, stock: 24 },
      { id: 'rice-sona', label: 'Sona Masoori', price: 68, stock: 40 },
      { id: 'rice-kolam', label: 'Kolam', price: 58, stock: 0 },
    ],
  },
  {
    id: 'milk',
    name: 'Milk',
    category: 'Dairy',
    aliases: ['milk', 'doodh', 'dudh', 'दूध', 'పాలు'],
    unit: 'litre',
    variants: [{ id: 'milk-toned', label: 'Amul Toned Milk', price: 56, stock: 30 }],
  },
  {
    id: 'atta',
    name: 'Wheat Flour',
    category: 'Staples',
    aliases: ['atta', 'aata', 'flour', 'gehun', 'आटा'],
    unit: 'kg',
    variants: [
      { id: 'atta-aashirvaad', label: 'Aashirvaad Whole Wheat (5 kg)', price: 285, stock: 12 },
      { id: 'atta-chakki', label: 'Loose Chakki Atta', price: 42, stock: 60 },
    ],
  },
  {
    id: 'sugar',
    name: 'Sugar',
    category: 'Staples',
    aliases: ['sugar', 'cheeni', 'chini', 'shakkar', 'चीनी'],
    unit: 'kg',
    variants: [{ id: 'sugar-loose', label: 'Refined Sugar', price: 46, stock: 50 }],
  },
  {
    id: 'oil',
    name: 'Cooking Oil',
    category: 'Staples',
    aliases: ['oil', 'tel', 'tael', 'तेल', 'నూనె'],
    unit: 'litre',
    variants: [
      { id: 'oil-sunflower', label: 'Fortune Sunflower Oil', price: 155, stock: 18 },
      { id: 'oil-mustard', label: 'Dhara Mustard Oil', price: 170, stock: 9 },
    ],
  },
  {
    id: 'eggs',
    name: 'Eggs',
    category: 'Dairy',
    aliases: ['egg', 'eggs', 'anda', 'ande', 'अंडे', 'గుడ్లు'],
    unit: 'dozen',
    variants: [{ id: 'eggs-dozen', label: 'Farm Eggs (12)', price: 84, stock: 0 }],
  },
  {
    id: 'dal',
    name: 'Toor Dal',
    category: 'Pulses',
    aliases: ['dal', 'daal', 'toor', 'arhar', 'दाल', 'పప్పు'],
    unit: 'kg',
    variants: [{ id: 'dal-toor', label: 'Tata Sampann Toor Dal', price: 165, stock: 22 }],
  },
  {
    id: 'bread',
    name: 'Bread',
    category: 'Bakery',
    aliases: ['bread', 'pav', 'double roti', 'ब्रेड'],
    unit: 'pack',
    variants: [
      { id: 'bread-white', label: 'Modern White Bread', price: 40, stock: 15 },
      { id: 'bread-brown', label: 'Brown Bread', price: 50, stock: 6 },
    ],
  },
  {
    id: 'paneer',
    name: 'Paneer',
    category: 'Dairy',
    aliases: ['paneer', 'cottage cheese', 'पनीर'],
    unit: '200 g',
    variants: [{ id: 'paneer-amul', label: 'Amul Malai Paneer', price: 90, stock: 4 }],
  },
  {
    id: 'tea',
    name: 'Tea',
    category: 'Beverages',
    aliases: ['tea', 'chai', 'chai patti', 'चाय', 'టీ'],
    unit: '250 g',
    variants: [{ id: 'tea-tajmahal', label: 'Taj Mahal Tea', price: 160, stock: 14 }],
  },
]

const now = Date.now()
const min = 60_000

function makeOrder(
  id: string,
  customer: Pick<Order, 'customerName' | 'phone' | 'address' | 'language'>,
  items: OrderItem[],
  status: OrderStatus,
  minutesAgo: number,
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
): Order {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const deliveryFee = subtotal >= storeConfig.freeDeliveryAbove ? 0 : storeConfig.deliveryFee
  const placedAt = now - minutesAgo * min
  return {
    id,
    ...customer,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    status,
    paymentMethod,
    paymentStatus,
    placedAt,
    events: [{ status: 'PENDING', at: placedAt }, ...(status !== 'PENDING' ? [{ status, at: placedAt + 4 * min }] : [])],
  }
}

export const seedOrders: Order[] = [
  makeOrder(
    'DD-1042',
    { customerName: 'Priya Reddy', phone: '+91 90000 11223', address: 'Flat 302, Lakshmi Residency, Madhapur', language: 'te' },
    [
      { variantId: 'rice-sona', productName: 'Rice', variantLabel: 'Sona Masoori', qty: 5, price: 68 },
      { variantId: 'dal-toor', productName: 'Toor Dal', variantLabel: 'Tata Sampann Toor Dal', qty: 1, price: 165 },
    ],
    'PENDING',
    3,
    'UPI',
    'PAID',
  ),
  makeOrder(
    'DD-1041',
    { customerName: 'Rahul Verma', phone: '+91 98111 22334', address: 'B-14, Shanti Nagar, near Hanuman Mandir', language: 'hinglish' },
    [
      { variantId: 'milk-toned', productName: 'Milk', variantLabel: 'Amul Toned Milk', qty: 2, price: 56 },
      { variantId: 'bread-white', productName: 'Bread', variantLabel: 'Modern White Bread', qty: 1, price: 40 },
      { variantId: 'paneer-amul', productName: 'Paneer', variantLabel: 'Amul Malai Paneer', qty: 1, price: 90 },
    ],
    'PENDING',
    7,
    'COD',
    'UNPAID',
  ),
  makeOrder(
    'DD-1040',
    { customerName: 'Anjali Mehta', phone: '+91 99887 66554', address: '12, Green Park Colony, 2nd Cross', language: 'en' },
    [
      { variantId: 'atta-aashirvaad', productName: 'Wheat Flour', variantLabel: 'Aashirvaad Whole Wheat (5 kg)', qty: 1, price: 285 },
      { variantId: 'oil-sunflower', productName: 'Cooking Oil', variantLabel: 'Fortune Sunflower Oil', qty: 2, price: 155 },
    ],
    'PREPARING',
    18,
    'UPI',
    'PAID',
  ),
  makeOrder(
    'DD-1039',
    { customerName: 'Suresh Kumar', phone: '+91 97000 45678', address: 'House 7, Gandhi Road, Ward 4', language: 'hi' },
    [
      { variantId: 'sugar-loose', productName: 'Sugar', variantLabel: 'Refined Sugar', qty: 2, price: 46 },
      { variantId: 'tea-tajmahal', productName: 'Tea', variantLabel: 'Taj Mahal Tea', qty: 1, price: 160 },
    ],
    'ACCEPTED',
    26,
    'COD',
    'UNPAID',
  ),
  makeOrder(
    'DD-1038',
    { customerName: 'Fatima Shaikh', phone: '+91 93210 98765', address: 'Shop 3 upstairs, Station Road', language: 'hinglish' },
    [
      { variantId: 'rice-basmati', productName: 'Rice', variantLabel: 'India Gate Basmati', qty: 2, price: 140 },
      { variantId: 'oil-mustard', productName: 'Cooking Oil', variantLabel: 'Dhara Mustard Oil', qty: 1, price: 170 },
    ],
    'OUT_FOR_DELIVERY',
    41,
    'COD',
    'UNPAID',
  ),
  makeOrder(
    'DD-1037',
    { customerName: 'Vikram Singh', phone: '+91 91234 56780', address: '45, Sector 9, Main Market', language: 'en' },
    [{ variantId: 'milk-toned', productName: 'Milk', variantLabel: 'Amul Toned Milk', qty: 4, price: 56 }],
    'DELIVERED',
    95,
    'UPI',
    'PAID',
  ),
  makeOrder(
    'DD-1036',
    { customerName: 'Meena Iyer', phone: '+91 98450 12345', address: '9/2, Temple Street', language: 'en' },
    [{ variantId: 'eggs-dozen', productName: 'Eggs', variantLabel: 'Farm Eggs (12)', qty: 2, price: 84 }],
    'REJECTED',
    130,
    'COD',
    'UNPAID',
  ),
]

export const customers: Customer[] = [
  { phone: '+91 90000 11223', name: 'Priya Reddy', address: 'Flat 302, Lakshmi Residency, Madhapur', language: 'te', orders: 14, lifetimeValue: 6820 },
  { phone: '+91 98111 22334', name: 'Rahul Verma', address: 'B-14, Shanti Nagar', language: 'hinglish', orders: 31, lifetimeValue: 11240 },
  { phone: '+91 99887 66554', name: 'Anjali Mehta', address: '12, Green Park Colony', language: 'en', orders: 9, lifetimeValue: 4310 },
  { phone: '+91 97000 45678', name: 'Suresh Kumar', address: 'House 7, Gandhi Road', language: 'hi', orders: 22, lifetimeValue: 7905 },
  { phone: '+91 93210 98765', name: 'Fatima Shaikh', address: 'Station Road', language: 'hinglish', orders: 6, lifetimeValue: 2150 },
]

// Last 7 days of orders and revenue for the analytics strip.
export const weeklyAnalytics = {
  days: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  orders: [38, 52, 31, 29, 34, 41, 47],
  revenue: [11400, 16900, 8700, 8100, 9900, 12600, 14800],
  topProducts: [
    { name: 'Amul Toned Milk', units: 212 },
    { name: 'Sona Masoori Rice', units: 148 },
    { name: 'Modern White Bread', units: 97 },
    { name: 'Fortune Sunflower Oil', units: 64 },
    { name: 'Toor Dal', units: 58 },
  ],
  languageMix: [
    { label: 'Hinglish', share: 46 },
    { label: 'English', share: 27 },
    { label: 'हिन्दी', share: 17 },
    { label: 'తెలుగు', share: 10 },
  ],
}

export const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'New',
  ACCEPTED: 'Accepted',
  PREPARING: 'Packing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  ACCEPTED: 'PREPARING',
  PREPARING: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
}

export const rupee = (n: number) => '₹' + n.toLocaleString('en-IN')
