import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  phone: text('phone').notNull().unique(),
  name: text('name'),
  email: text('email'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const otpCodes = pgTable('otp_codes', {
  id: serial('id').primaryKey(),
  phone: text('phone').notNull(),
  otpHash: text('otpHash').notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  tokenHash: text('tokenHash').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const airports = pgTable('airports', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull(),
})

export const flights = pgTable('flights', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  flightNumber: text('flightNumber').notNull(),
  airline: text('airline').notNull().default('BlueWings'),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  departureTime: timestamp('departureTime', { withTimezone: true }).notNull(),
  arrivalTime: timestamp('arrivalTime', { withTimezone: true }).notNull(),
  durationMinutes: integer('durationMinutes').notNull(),
  aircraft: text('aircraft').notNull().default('Airbus A320neo'),
  stops: integer('stops').notNull().default(0),
  economyPrice: numeric('economyPrice', { precision: 10, scale: 2 }).notNull(),
  premiumPrice: numeric('premiumPrice', { precision: 10, scale: 2 }).notNull(),
  businessPrice: numeric('businessPrice', {
    precision: 10,
    scale: 2,
  }).notNull(),
  status: text('status').notNull().default('scheduled'),
})

export const seats = pgTable(
  'seats',
  {
    id: serial('id').primaryKey(),
    flightId: text('flightId').notNull(),
    seatNumber: text('seatNumber').notNull(),
    cabin: text('cabin').notNull().default('economy'),
    status: text('status').notNull().default('booked'),
    bookingId: text('bookingId'),
    lockedUntil: timestamp('lockedUntil', { withTimezone: true }),
  },
  (t) => [uniqueIndex('seats_flight_seat_unique').on(t.flightId, t.seatNumber)]
)

export const bookings = pgTable('bookings', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  pnr: text('pnr').notNull().unique(),
  userId: text('userId').notNull(),
  flightId: text('flightId').notNull(),
  status: text('status').notNull().default('pending'),
  cabin: text('cabin').notNull().default('economy'),
  totalAmount: numeric('totalAmount', { precision: 10, scale: 2 }).notNull(),
  refundAmount: numeric('refundAmount', { precision: 10, scale: 2 }),
  refundStatus: text('refundStatus'),
  contactEmail: text('contactEmail'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const passengers = pgTable('passengers', {
  id: serial('id').primaryKey(),
  bookingId: text('bookingId').notNull(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  gender: text('gender'),
  age: integer('age'),
  seatNumber: text('seatNumber'),
  meal: text('meal').default('standard'),
  extraBaggageKg: integer('extraBaggageKg').notNull().default(0),
})

export const payments = pgTable('payments', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  bookingId: text('bookingId').notNull(),
  userId: text('userId').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  method: text('method').notNull().default('card'),
  status: text('status').notNull().default('pending'),
  cardLast4: text('cardLast4'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  type: text('type').notNull().default('info'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const conversations = pgTable('conversations', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  userId: text('userId').notNull(),
  channel: text('channel').notNull().default('web'),
  state: text('state'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: text('conversationId').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const escalations = pgTable('escalations', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  bookingId: text('bookingId'),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('open'),
  channel: text('channel').notNull().default('web'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: text('userId'),
  action: text('action').notNull(),
  entity: text('entity'),
  entityId: text('entityId'),
  details: jsonb('details'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
