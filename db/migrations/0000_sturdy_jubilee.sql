CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`input_text` text NOT NULL,
	`normalized_text` text NOT NULL,
	`analysis_json` text NOT NULL,
	`reading_json` text,
	`reframe_json` text,
	`extraction_quality` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analyses_normalized_text_idx` ON `analyses` (`normalized_text`);--> statement-breakpoint
CREATE TABLE `rate_limit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_key` text NOT NULL,
	`route_key` text NOT NULL,
	`decision` text NOT NULL,
	`cost` integer NOT NULL,
	`input_chars` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limit_events_user_route_created_at_idx` ON `rate_limit_events` (`user_key`,`route_key`,`created_at`);