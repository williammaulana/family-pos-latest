
ALTER TABLE `transactions`
ADD COLUMN `discount_amount` INTEGER NOT NULL DEFAULT 0,
MODIFY COLUMN `payment_method` ENUM('tunai', 'kartu_debit', 'kartu_kredit', 'e_wallet', 'qris', 'transfer_bank') NOT NULL;

ALTER TABLE `transaction_items`
ADD COLUMN `discount` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS `stock_history` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `product_id` VARCHAR(36),
  `quantity_change` INTEGER NOT NULL,
  `reason` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
);
