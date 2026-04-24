/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Medicine` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku]` on the table `Medicine` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionRef]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[storeSlug]` on the table `Vendor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('HOME', 'OFFICE', 'BILLING', 'SHIPPING', 'WAREHOUSE');

-- CreateEnum
CREATE TYPE "KycDocumentType" AS ENUM ('GST', 'DRUG_LICENSE', 'PAN', 'IDENTITY', 'ADDRESS', 'OTHER');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MedicineStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'FAILED');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER', 'PAYMENT', 'PRESCRIPTION', 'SUPPORT', 'COMPLIANCE', 'SYSTEM', 'PROMOTION');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "UserActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'PROFILE_UPDATE', 'PASSWORD_CHANGE', 'ORDER_ACTION', 'PAYMENT_ACTION', 'ADMIN_ACTION');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profileImage" TEXT;

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "costPriceCents" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastRestockedAt" TIMESTAMP(3),
ADD COLUMN     "mrpCents" INTEGER,
ADD COLUMN     "reorderLevel" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sellingPriceCents" INTEGER;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "amountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "taxCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "dosageForm" TEXT,
ADD COLUMN     "hsnCode" TEXT,
ADD COLUMN     "imageUrls" JSONB,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "packSize" TEXT,
ADD COLUMN     "scheduleType" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "MedicineStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "strength" TEXT,
ADD COLUMN     "subcategory" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "checkoutSnapshot" JSONB,
ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "customerNote" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "discountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "shipmentStatus" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "shippingCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subtotalCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "discountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lineTotalCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "selectedPack" TEXT,
ADD COLUMN     "taxRate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "gatewayOrderId" TEXT,
ADD COLUMN     "gatewayPaymentId" TEXT,
ADD COLUMN     "gatewaySignature" TEXT,
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "refundAmountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "transactionRef" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "preferredCurrency" TEXT DEFAULT 'INR',
ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "businessMeta" JSONB,
ADD COLUMN     "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "onboardingStep" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "storeSlug" TEXT,
ADD COLUMN     "supportEmail" TEXT,
ADD COLUMN     "totalRatings" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AddressType" NOT NULL DEFAULT 'HOME',
    "label" TEXT,
    "fullName" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "phone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorKycDocument" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" "KycDocumentType" NOT NULL,
    "documentNumber" TEXT,
    "fileUrl" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorKycDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBatch" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "manufacturedAt" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "purchaseCostCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "inventoryId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "selectedSize" TEXT,
    "priceSnapshotCents" INTEGER,
    "currencyCode" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "orderId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" JSONB,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "orderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "paymentUpdates" BOOLEAN NOT NULL DEFAULT true,
    "supportUpdates" BOOLEAN NOT NULL DEFAULT true,
    "marketingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "courierName" TEXT,
    "trackingNumber" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "currentLocation" TEXT,
    "estimatedDeliveryAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "resolution" TEXT,
    "raisedBy" TEXT,
    "assignedTo" TEXT,
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DisputeCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "customerId" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "pickupAddress" JSONB,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "CouponType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "minOrderCents" INTEGER,
    "maxDiscountCents" INTEGER,
    "usageLimit" INTEGER,
    "perUserLimit" INTEGER DEFAULT 1,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "appliedDiscountCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "UserActivityType" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Address_userId_isDefault_idx" ON "Address"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "VendorKycDocument_vendorId_status_idx" ON "VendorKycDocument"("vendorId", "status");

-- CreateIndex
CREATE INDEX "InventoryBatch_expiryDate_idx" ON "InventoryBatch"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBatch_inventoryId_batchNumber_key" ON "InventoryBatch"("inventoryId", "batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_orderId_key" ON "Prescription"("orderId");

-- CreateIndex
CREATE INDEX "Prescription_customerId_status_createdAt_idx" ON "Prescription"("customerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "WishlistItem_customerId_createdAt_idx" ON "WishlistItem"("customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_customerId_medicineId_key" ON "WishlistItem"("customerId", "medicineId");

-- CreateIndex
CREATE INDEX "CartItem_customerId_updatedAt_idx" ON "CartItem"("customerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_requesterId_status_createdAt_idx" ON "SupportTicket"("requesterId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedTo_status_priority_idx" ON "SupportTicket"("assignedTo", "status", "priority");

-- CreateIndex
CREATE INDEX "SupportTicketMessage_ticketId_createdAt_idx" ON "SupportTicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "Shipment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_trackingNumber_key" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "Shipment_status_createdAt_idx" ON "Shipment"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeCase_caseNumber_key" ON "DisputeCase"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeCase_orderId_key" ON "DisputeCase"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeCase_paymentId_key" ON "DisputeCase"("paymentId");

-- CreateIndex
CREATE INDEX "DisputeCase_status_createdAt_idx" ON "DisputeCase"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ReturnRequest_orderId_status_createdAt_idx" ON "ReturnRequest"("orderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReturnRequest_customerId_status_idx" ON "ReturnRequest"("customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_isActive_startsAt_endsAt_idx" ON "Coupon"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "CouponRedemption_couponId_createdAt_idx" ON "CouponRedemption"("couponId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CouponRedemption_couponId_userId_orderId_key" ON "CouponRedemption"("couponId", "userId", "orderId");

-- CreateIndex
CREATE INDEX "Review_medicineId_rating_createdAt_idx" ON "Review"("medicineId", "rating", "createdAt");

-- CreateIndex
CREATE INDEX "Review_customerId_createdAt_idx" ON "Review"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_slug_key" ON "Medicine"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_sku_key" ON "Medicine"("sku");

-- CreateIndex
CREATE INDEX "Medicine_status_isActive_updatedAt_idx" ON "Medicine"("status", "isActive", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_shipmentStatus_createdAt_idx" ON "Order"("shipmentStatus", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionRef_key" ON "Payment"("transactionRef");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_storeSlug_key" ON "Vendor"("storeSlug");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorKycDocument" ADD CONSTRAINT "VendorKycDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorKycDocument" ADD CONSTRAINT "VendorKycDocument_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_raisedBy_fkey" FOREIGN KEY ("raisedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
