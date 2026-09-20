import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const LEAD_STATUSES = ['nuevo', 'contactado', 'descartado'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    /** ISO 3166-1 alpha-2 */
    country: text('country').notNull(),

    bikeSlug: text('bike_slug').notNull(),
    /** Nombre al momento de la consulta: sobrevive cambios del catálogo. */
    bikeName: text('bike_name').notNull(),

    status: text('status').notNull().default('nuevo'),
    notes: text('notes'),

    utmSource: text('utm_source'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // El panel ordena por fecha descendente y filtra por estado.
    index('leads_created_at_idx').on(table.createdAt.desc()),
    index('leads_status_idx').on(table.status),
    index('leads_email_idx').on(table.email),
  ]
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
