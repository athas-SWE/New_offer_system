-- DropForeignKey
ALTER TABLE `offers` DROP FOREIGN KEY `fk_offers_shop`;

-- DropForeignKey
ALTER TABLE `shops` DROP FOREIGN KEY `fk_shops_city`;

-- DropForeignKey
ALTER TABLE `shops` DROP FOREIGN KEY `fk_shops_owner`;

-- DropIndex
DROP INDEX `fk_offers_shop` ON `offers`;

-- DropIndex
DROP INDEX `fk_shops_city` ON `shops`;

-- DropIndex
DROP INDEX `idx_shops_owner` ON `shops`;

-- DropIndex
DROP INDEX `idx_shops_status` ON `shops`;

-- AlterTable
ALTER TABLE `shops` ADD COLUMN `location_url` VARCHAR(1000) NULL,
    MODIFY `owner_id` CHAR(36) NOT NULL;

-- AddForeignKey
ALTER TABLE `shops` ADD CONSTRAINT `shops_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shops` ADD CONSTRAINT `shops_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
