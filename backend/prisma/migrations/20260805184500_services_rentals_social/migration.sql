-- Shop social / website links
ALTER TABLE `shops`
  ADD COLUMN `website` VARCHAR(500) NULL,
  ADD COLUMN `instagram_url` VARCHAR(500) NULL,
  ADD COLUMN `facebook_url` VARCHAR(500) NULL;

-- Services catalog
CREATE TABLE IF NOT EXISTS `services` (
  `id` CHAR(36) NOT NULL,
  `title` VARCHAR(250) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12, 2) NULL,
  `price_unit` ENUM('FIXED', 'FROM', 'HOURLY', 'PER_DAY', 'PER_HOUR') NOT NULL DEFAULT 'FIXED',
  `image` VARCHAR(500) NULL,
  `status` ENUM('DRAFT', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
  `shop_id` CHAR(36) NOT NULL,
  `category_id` CHAR(36) NULL,
  `city_id` CHAR(36) NULL,
  `created_by` VARCHAR(36) NULL,
  `updated_by` VARCHAR(36) NULL,
  `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_services_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`),
  CONSTRAINT `fk_services_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),
  CONSTRAINT `fk_services_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`)
);

-- Rentals catalog
CREATE TABLE IF NOT EXISTS `rentals` (
  `id` CHAR(36) NOT NULL,
  `title` VARCHAR(250) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12, 2) NULL,
  `price_unit` ENUM('FIXED', 'FROM', 'HOURLY', 'PER_DAY', 'PER_HOUR') NOT NULL DEFAULT 'PER_DAY',
  `deposit` DECIMAL(12, 2) NULL,
  `availability_note` VARCHAR(500) NULL,
  `image` VARCHAR(500) NULL,
  `status` ENUM('DRAFT', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
  `shop_id` CHAR(36) NOT NULL,
  `category_id` CHAR(36) NULL,
  `city_id` CHAR(36) NULL,
  `created_by` VARCHAR(36) NULL,
  `updated_by` VARCHAR(36) NULL,
  `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_rentals_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`),
  CONSTRAINT `fk_rentals_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),
  CONSTRAINT `fk_rentals_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`)
);
