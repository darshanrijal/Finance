CREATE TYPE "account_types" AS ENUM('CASH', 'CARD', 'SAVINGS');--> statement-breakpoint
CREATE TYPE "transactions_input_method" AS ENUM('MANUAL', 'RECIPT_SCAN', 'VOICE');--> statement-breakpoint
CREATE TYPE "transactions_type" AS ENUM('INCOME', 'EXPENSE');--> statement-breakpoint
CREATE TABLE "money_accounts" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "account_types" NOT NULL,
	"balance" numeric DEFAULT '0' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bugdets" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"last_alert_sent" timestamp with time zone,
	"lastAlertThreshold" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"type" "transactions_type" NOT NULL,
	"amount" numeric NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'COMPLETED' NOT NULL,
	"input_method" "transactions_input_method" DEFAULT 'MANUAL'::"transactions_input_method" NOT NULL,
	"voice_transcript" text,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "money_accounts" ADD CONSTRAINT "money_accounts_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "bugdets" ADD CONSTRAINT "bugdets_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE;