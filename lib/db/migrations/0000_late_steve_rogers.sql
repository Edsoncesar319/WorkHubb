CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`job_id` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`location` text NOT NULL,
	`remote` integer NOT NULL,
	`salary` text,
	`description` text NOT NULL,
	`requirements` text NOT NULL,
	`author_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`type` text NOT NULL,
	`bio` text,
	`stack` text,
	`github` text,
	`linkedin` text,
	`company` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);