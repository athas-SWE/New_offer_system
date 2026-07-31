-- Consolidate businesses + stores into a single shops table

-- 1) Create shops from businesses (account = shop)
CREATE TABLE IF NOT EXISTS `shops` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `registration_number` VARCHAR(100) NULL,
  `email` VARCHAR(180) NULL,
  `phone` VARCHAR(30) NULL,
  `address` VARCHAR(500) NULL,
  `logo_url` VARCHAR(500) NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `latitude` DECIMAL(10,7) NULL,
  `longitude` DECIMAL(10,7) NULL,
  `owner_id` VARCHAR(36) NOT NULL,
  `city_id` CHAR(36) NULL,
  `created_by` VARCHAR(36) NULL,
  `updated_by` VARCHAR(36) NULL,
  `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_shops_owner` (`owner_id`),
  INDEX `idx_shops_status` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Copy business accounts into shops (keep same ids so offer remap is simple)
INSERT INTO `shops` (
  `id`, `name`, `description`, `registration_number`, `email`, `phone`, `address`, `logo_url`,
  `status`, `is_active`, `latitude`, `longitude`, `owner_id`, `city_id`,
  `created_by`, `updated_by`, `created_date`, `updated_date`, `is_deleted`
)
SELECT
  b.`id`, b.`name`, b.`description`, b.`registration_number`, b.`email`, b.`phone`, b.`address`, b.`logo_url`,
  b.`status`, 1, NULL, NULL, b.`owner_id`, b.`city_id`,
  b.`created_by`, b.`updated_by`, b.`created_date`, b.`updated_date`, b.`is_deleted`
FROM `businesses` b
WHERE NOT EXISTS (SELECT 1 FROM `shops` s WHERE s.`id` = b.`id`);

-- Merge store location details onto the shop when store shares that business
UPDATE `shops` sh
INNER JOIN `stores` st ON st.`business_id` = sh.`id` AND st.`is_deleted` = 0
SET
  sh.`address` = COALESCE(NULLIF(sh.`address`, ''), st.`address`, sh.`address`),
  sh.`phone` = COALESCE(NULLIF(sh.`phone`, ''), st.`phone`, sh.`phone`),
  sh.`description` = COALESCE(NULLIF(sh.`description`, ''), st.`description`, sh.`description`),
  sh.`latitude` = COALESCE(sh.`latitude`, st.`latitude`),
  sh.`longitude` = COALESCE(sh.`longitude`, st.`longitude`),
  sh.`city_id` = COALESCE(sh.`city_id`, st.`city_id`);

-- Insert extra store branches as additional shops under same owner
INSERT INTO `shops` (
  `id`, `name`, `description`, `registration_number`, `email`, `phone`, `address`, `logo_url`,
  `status`, `is_active`, `latitude`, `longitude`, `owner_id`, `city_id`,
  `created_by`, `updated_by`, `created_date`, `updated_date`, `is_deleted`
)
SELECT
  st.`id`,
  st.`name`,
  st.`description`,
  b.`registration_number`,
  b.`email`,
  COALESCE(st.`phone`, b.`phone`),
  COALESCE(st.`address`, b.`address`),
  b.`logo_url`,
  b.`status`,
  st.`is_active`,
  st.`latitude`,
  st.`longitude`,
  b.`owner_id`,
  COALESCE(st.`city_id`, b.`city_id`),
  st.`created_by`,
  st.`updated_by`,
  st.`created_date`,
  st.`updated_date`,
  st.`is_deleted`
FROM `stores` st
INNER JOIN `businesses` b ON b.`id` = st.`business_id`
WHERE st.`id` NOT IN (SELECT `id` FROM `shops`);

-- 2) Point offers at shops (same id as former business for main shops)
ALTER TABLE `offers` ADD COLUMN `shop_id` CHAR(36) NULL AFTER `business_id`;

UPDATE `offers` o
SET o.`shop_id` = o.`business_id`
WHERE o.`shop_id` IS NULL
  AND EXISTS (SELECT 1 FROM `shops` s WHERE s.`id` = o.`business_id`);

-- Fallback: map via store branch if needed
UPDATE `offers` o
INNER JOIN `stores` st ON st.`business_id` = o.`business_id`
SET o.`shop_id` = st.`business_id`
WHERE o.`shop_id` IS NULL;

-- Any remaining: attach to owner's first shop
UPDATE `offers` o
INNER JOIN `businesses` b ON b.`id` = o.`business_id`
INNER JOIN `shops` s ON s.`owner_id` = b.`owner_id`
SET o.`shop_id` = s.`id`
WHERE o.`shop_id` IS NULL;

-- 3) Remap analytics business_id values that still point at businesses (same ids kept)
-- (no schema change; values already match shop ids for main accounts)

-- 4) Drop old FKs / columns / tables
SET @fk_offers := (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offers' AND COLUMN_NAME = 'business_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1
);
SET @sql := IF(@fk_offers IS NOT NULL, CONCAT('ALTER TABLE `offers` DROP FOREIGN KEY `', @fk_offers, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `offers` DROP COLUMN `business_id`;
ALTER TABLE `offers` MODIFY `shop_id` CHAR(36) NOT NULL;
ALTER TABLE `offers` ADD CONSTRAINT `fk_offers_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`);

SET @fk_stores_b := (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stores' AND COLUMN_NAME = 'business_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1
);
SET @sql2 := IF(@fk_stores_b IS NOT NULL, CONCAT('ALTER TABLE `stores` DROP FOREIGN KEY `', @fk_stores_b, '`'), 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

DROP TABLE IF EXISTS `stores`;

SET @fk_biz_owner := (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'businesses' AND COLUMN_NAME = 'owner_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1
);
SET @sql3 := IF(@fk_biz_owner IS NOT NULL, CONCAT('ALTER TABLE `businesses` DROP FOREIGN KEY `', @fk_biz_owner, '`'), 'SELECT 1');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

SET @fk_biz_city := (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'businesses' AND COLUMN_NAME = 'city_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1
);
SET @sql4 := IF(@fk_biz_city IS NOT NULL, CONCAT('ALTER TABLE `businesses` DROP FOREIGN KEY `', @fk_biz_city, '`'), 'SELECT 1');
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

DROP TABLE IF EXISTS `businesses`;

ALTER TABLE `shops`
  ADD CONSTRAINT `fk_shops_owner` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`),
  ADD CONSTRAINT `fk_shops_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`);
