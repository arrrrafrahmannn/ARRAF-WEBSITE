CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`country` text NOT NULL,
	`service` text NOT NULL,
	`level` text NOT NULL,
	`deadline` text NOT NULL,
	`word_count` integer,
	`brief` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`file_key` text,
	`file_name` text,
	`file_type` text,
	`file_size` integer,
	`rate_key` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inquiries_rate_created_idx` ON `inquiries` (`rate_key`,`created_at`);