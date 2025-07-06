import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { DAYS_OF_WEEK_IN_ORDER } from "@/constants"
import { relations } from "drizzle-orm"

// PostgreSQL Enum for the days of the week
export const scheduleDayOfWeekEnum = pgEnum("dat", DAYS_OF_WEEK_IN_ORDER)

// Define reusable columns
const id = uuid("id").primaryKey().defaultRandom()
const createdAt = timestamp("createdAt").notNull().defaultNow()
const updatedAt = timestamp("updatedAt").notNull().defaultNow().$onUpdate(() => new Date())

// Events table (stores all created events)
// Fields: Unique ID, event name, optional event description, duration (in mins), owning user ID, status (public/private), creation and update timestamps
export const EventTable = pgTable("events", {
    id,
    name: text("name").notNull(),
    description: text("description"),
    durationInMins: integer("durationInMins").notNull(),
    clerkUserId: text("clerkUserId").notNull(),
    isPublic: boolean("isPublic").notNull().default(true),
    createdAt,
    updatedAt
}, table => ([
    index("clerkUserIdIndex").on(table.clerkUserId),
]))

// Schedules table (stores a schedule for every user)
// Fields: Unique ID, unique owning user ID, user timezone, creation and update timestamps
export const ScheduleTable = pgTable("schedules", {
    id,
    clerkUserId: text("clerkUserId").notNull().unique(),
    timezone: text("timezone").notNull(),
    createdAt,
    updatedAt
})

// ScheduleAvailabilities table (stores available time slots per day)
// Fields: Unique ID, reference to a schedule, availability start and end times, day of the week (Enum)
export const ScheduleAvailabilityTable = pgTable("scheduleAvailabilities", {
    id,
    scheduleId: uuid("scheduleId").notNull().references(() => ScheduleTable.id, { onDelete: "cascade" }),
    startTime: text("startTime").notNull(),
    endTime: text("endTime").notNull(),
    dayOfWeek: scheduleDayOfWeekEnum("dayOfWeek").notNull()
}, table => ([
    index("scheduleIdIndex").on(table.scheduleId)
]))

// Define relationship between ScheduleTable and ScheduleAvailabilityTable (a schedule has many abvailabilities)
export const scheduleRelations = relations(ScheduleTable, ({ many }) => ({
    availabilities: many(ScheduleAvailabilityTable),
}))

// Define relationship between ScheduleAvailabilityTable and ScheduleTable(each availability belongs to only one schedule)
export const scheduleAvailabilityRelations = relations(ScheduleAvailabilityTable, ({ one }) => ({
    schedule: one(ScheduleTable, {
        // Define foreign key relationship
        fields: [ScheduleAvailabilityTable.scheduleId],
        references: [ScheduleTable.id],
    }),
}))