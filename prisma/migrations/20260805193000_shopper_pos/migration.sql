-- Admin-controlled POS upgrade flag on shops
ALTER TABLE `shops`
  ADD COLUMN `pos_enabled` TINYINT(1) NOT NULL DEFAULT 0;

-- POS product catalog (internal shop use)
CREATE TABLE IF NOT EXISTS `pos_products` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `sku` VARCHAR(80) NULL,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `stock` INT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `shop_id` CHAR(36) NOT NULL,
  `created_by` VARCHAR(36) NULL,
  `updated_by` VARCHAR(36) NULL,
  `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_pos_products_shop` (`shop_id`),
  CONSTRAINT `fk_pos_products_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- POS sales / receipts
CREATE TABLE IF NOT EXISTS `pos_sales` (
  `id` CHAR(36) NOT NULL,
  `receipt_number` VARCHAR(40) NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `payment_method` ENUM('CASH', 'CARD', 'OTHER') NOT NULL DEFAULT 'CASH',
  `note` VARCHAR(500) NULL,
  `shop_id` CHAR(36) NOT NULL,
  `created_by` VARCHAR(36) NULL,
  `updated_by` VARCHAR(36) NULL,
  `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pos_sales_receipt` (`receipt_number`),
  KEY `idx_pos_sales_shop` (`shop_id`),
  CONSTRAINT `fk_pos_sales_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pos_sale_items` (
  `id` CHAR(36) NOT NULL,
  `sale_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `quantity` INT NOT NULL DEFAULT 1,
  `line_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `created_by` VARCHAR(36) NULL,
  `updated_by` VARCHAR(36) NULL,
  `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_pos_sale_items_sale` (`sale_id`),
  CONSTRAINT `fk_pos_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `pos_sales`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pos_sale_items_product` FOREIGN KEY (`product_id`) REFERENCES `pos_products`(`id`) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
