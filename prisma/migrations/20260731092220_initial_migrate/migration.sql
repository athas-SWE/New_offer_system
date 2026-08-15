-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `name` ENUM('ADMIN', 'BUSINESS_OWNER', 'CUSTOMER') NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `districts` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `province` VARCHAR(120) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `districts_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `district_id` CHAR(36) NOT NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `cities_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(180) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `refresh_token_hash` VARCHAR(255) NULL,
    `fcm_token` VARCHAR(512) NULL,
    `role_id` CHAR(36) NOT NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `businesses` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `registration_number` VARCHAR(100) NULL,
    `email` VARCHAR(180) NULL,
    `phone` VARCHAR(30) NULL,
    `address` VARCHAR(500) NULL,
    `logo_url` VARCHAR(500) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
    `owner_id` CHAR(36) NOT NULL,
    `city_id` CHAR(36) NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `businesses_owner_id_key`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stores` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `address` VARCHAR(500) NULL,
    `phone` VARCHAR(30) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `business_id` CHAR(36) NOT NULL,
    `city_id` CHAR(36) NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `description` TEXT NULL,
    `icon_url` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `parent_id` CHAR(36) NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offers` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(250) NOT NULL,
    `description` TEXT NULL,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `coupon_code` VARCHAR(50) NULL,
    `image` VARCHAR(500) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `qr_code` VARCHAR(500) NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    `business_id` CHAR(36) NOT NULL,
    `category_id` CHAR(36) NULL,
    `city_id` CHAR(36) NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offer_images` (
    `id` CHAR(36) NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `offer_id` CHAR(36) NOT NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `offer_id` CHAR(36) NOT NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `uq_favorites_user_offer`(`user_id`, `offer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('SYSTEM', 'OFFER', 'REVIEW', 'BUSINESS', 'PROMO') NOT NULL DEFAULT 'SYSTEM',
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `reference_id` VARCHAR(36) NULL,
    `user_id` CHAR(36) NOT NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` CHAR(36) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `is_approved` BOOLEAN NOT NULL DEFAULT true,
    `user_id` CHAR(36) NOT NULL,
    `offer_id` CHAR(36) NOT NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analytics` (
    `id` CHAR(36) NOT NULL,
    `event_type` VARCHAR(80) NOT NULL,
    `entity_type` VARCHAR(80) NULL,
    `entity_id` VARCHAR(36) NULL,
    `user_id` VARCHAR(36) NULL,
    `business_id` VARCHAR(36) NULL,
    `metadata` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `entity_type` VARCHAR(80) NOT NULL,
    `entity_id` VARCHAR(36) NULL,
    `user_id` VARCHAR(36) NULL,
    `changes` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_date` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cities` ADD CONSTRAINT `cities_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `businesses` ADD CONSTRAINT `businesses_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `businesses` ADD CONSTRAINT `businesses_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stores` ADD CONSTRAINT `stores_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stores` ADD CONSTRAINT `stores_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_images` ADD CONSTRAINT `offer_images_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
