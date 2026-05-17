ALTER TABLE `users` MODIFY COLUMN `role` varchar(20) NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `categories` ADD `slug` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `products` ADD `slug` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `name` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone_number` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `refresh_token` varchar(255);--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_slug_unique` UNIQUE(`slug`);--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_slug_unique` UNIQUE(`slug`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `products` (`slug`);