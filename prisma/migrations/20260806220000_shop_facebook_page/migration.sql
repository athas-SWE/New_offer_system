-- Facebook Page connection for auto-posting listings
ALTER TABLE `shops`
  ADD COLUMN `facebook_page_id` VARCHAR(64) NULL,
  ADD COLUMN `facebook_page_name` VARCHAR(255) NULL,
  ADD COLUMN `facebook_page_access_token` TEXT NULL,
  ADD COLUMN `facebook_connected_at` DATETIME(6) NULL;
