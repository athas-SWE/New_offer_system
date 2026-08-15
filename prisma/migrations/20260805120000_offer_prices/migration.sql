-- AlterTable
ALTER TABLE `offers`
  ADD COLUMN `original_price` DECIMAL(12, 2) NULL,
  ADD COLUMN `offer_price` DECIMAL(12, 2) NULL;
