-- Add deleted_by column to posts table
ALTER TABLE `posts` ADD COLUMN `deleted_by` INT NULL AFTER `deleted_at`;

