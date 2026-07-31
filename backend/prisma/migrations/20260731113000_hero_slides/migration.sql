-- CreateTable
CREATE TABLE `hero_slides` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `subtitle` VARCHAR(500) NULL,
    `image_url` VARCHAR(700) NOT NULL,
    `cta_label` VARCHAR(80) NULL,
    `cta_link` VARCHAR(300) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
