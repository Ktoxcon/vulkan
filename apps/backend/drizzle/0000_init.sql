CREATE TABLE "attendance_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"invitation_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"attendance_date" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_confirmations_invitation_uq" UNIQUE("invitation_id")
);
--> statement-breakpoint
CREATE TABLE "client_interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"confirmation_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_interests_confirmation_offering_uq" UNIQUE("confirmation_id","offering_id")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "draft_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "draft_confirmations_invitation_uq" UNIQUE("invitation_id")
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(512) NOT NULL,
	"html_body" text NOT NULL,
	"text_body" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_event_uq" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "event_offering_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"action" varchar(16) NOT NULL,
	"actor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_offerings_event_offering_uq" UNIQUE("event_id","offering_id")
);
--> statement-breakpoint
CREATE TABLE "import_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"file_name" varchar(512) NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"invalid_count" integer DEFAULT 0 NOT NULL,
	"duplicate_count" integer DEFAULT 0 NOT NULL,
	"accepted_count" integer DEFAULT 0 NOT NULL,
	"valid_rows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"invalid_rows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"duplicate_rows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation_status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"status" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"roster_client_id" uuid NOT NULL,
	"token" varchar(128) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token"),
	CONSTRAINT "invitations_roster_client_uq" UNIQUE("roster_client_id")
);
--> statement-breakpoint
CREATE TABLE "offering_import_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"file_name" varchar(512) NOT NULL,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"duplicate_count" integer DEFAULT 0 NOT NULL,
	"invalid_count" integer DEFAULT 0 NOT NULL,
	"valid_rows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"invalid_rows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"duplicate_rows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(16) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"base_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"offering_name" varchar(255) NOT NULL,
	"offering_type" varchar(16) NOT NULL,
	"base_price" numeric(12, 2) NOT NULL,
	"discount_percentage" integer NOT NULL,
	"discount_amount" numeric(12, 2) NOT NULL,
	"final_price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"from_status" varchar(16),
	"to_status" varchar(16) NOT NULL,
	"changed_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"attendance_confirmation_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"service_subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"service_discount_percentage" integer DEFAULT 0 NOT NULL,
	"service_discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"service_total_after_discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"product_subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"product_discount_percentage" integer DEFAULT 0 NOT NULL,
	"product_discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"product_total_after_discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_before_discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_after_discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"sent_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portfolios_attendance_confirmation_uq" UNIQUE("attendance_confirmation_id")
);
--> statement-breakpoint
CREATE TABLE "roster_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roster_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"company" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roster_clients_roster_client_uq" UNIQUE("roster_id","client_id")
);
--> statement-breakpoint
CREATE TABLE "rosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"total_clients" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rosters_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "sales_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"capacity" integer NOT NULL,
	"event_start_date" timestamp with time zone NOT NULL,
	"event_end_date" timestamp with time zone,
	"registration_start_date" timestamp with time zone NOT NULL,
	"registration_end_date" timestamp with time zone NOT NULL,
	"reservation_timeout_minutes" integer DEFAULT 0 NOT NULL,
	"require_confirmation" boolean DEFAULT false NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seat_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"invitation_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(64) DEFAULT 'sales' NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attendance_confirmations" ADD CONSTRAINT "attendance_confirmations_event_id_sales_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sales_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_confirmations" ADD CONSTRAINT "attendance_confirmations_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_confirmations" ADD CONSTRAINT "attendance_confirmations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_interests" ADD CONSTRAINT "client_interests_confirmation_id_attendance_confirmations_id_fk" FOREIGN KEY ("confirmation_id") REFERENCES "public"."attendance_confirmations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_interests" ADD CONSTRAINT "client_interests_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_confirmations" ADD CONSTRAINT "draft_confirmations_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_event_id_sales_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sales_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_offering_changes" ADD CONSTRAINT "event_offering_changes_event_id_sales_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sales_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_offering_changes" ADD CONSTRAINT "event_offering_changes_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_offering_changes" ADD CONSTRAINT "event_offering_changes_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_offerings" ADD CONSTRAINT "event_offerings_event_id_sales_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sales_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_offerings" ADD CONSTRAINT "event_offerings_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_offerings" ADD CONSTRAINT "event_offerings_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_records" ADD CONSTRAINT "import_records_event_id_sales_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sales_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_records" ADD CONSTRAINT "import_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_status_events" ADD CONSTRAINT "invitation_status_events_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_event_id_sales_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sales_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_roster_client_id_roster_clients_id_fk" FOREIGN KEY ("roster_client_id") REFERENCES "public"."roster_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering_import_records" ADD CONSTRAINT "offering_import_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_status_events" ADD CONSTRAINT "portfolio_status_events_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_status_events" ADD CONSTRAINT "portfolio_status_events_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_event_id_sales_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sales_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_attendance_confirmation_id_attendance_confirmations_id_fk" FOREIGN KEY ("attendance_confirmation_id") REFERENCES "public"."attendance_confirmations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_clients" ADD CONSTRAINT "roster_clients_roster_id_rosters_id_fk" FOREIGN KEY ("roster_id") REFERENCES "public"."rosters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_clients" ADD CONSTRAINT "roster_clients_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_event_id_sales_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sales_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_events" ADD CONSTRAINT "sales_events_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_reservations" ADD CONSTRAINT "seat_reservations_event_id_sales_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sales_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_reservations" ADD CONSTRAINT "seat_reservations_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitations_token_idx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "seat_reservations_event_status_idx" ON "seat_reservations" USING btree ("event_id","status");