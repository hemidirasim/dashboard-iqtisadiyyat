-- deleted_by column-unu posts table-ına əlavə et
ALTER TABLE `posts` 
ADD COLUMN `deleted_by` INT NULL AFTER `deleted_at`;

