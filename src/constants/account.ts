import { accounts } from "@/server/db/schema";

export type Account = typeof accounts.$inferSelect;
