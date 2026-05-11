-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('MARKET', 'LIMIT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifyToken" TEXT,
    "emailVerifyExpiry" TIMESTAMP(3),
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalLkr" DECIMAL(20,4) NOT NULL,
    "availableLkr" DECIMAL(20,4) NOT NULL,
    "lockedLkr" DECIMAL(20,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalShares" DECIMAL(20,4) NOT NULL,
    "availableShares" DECIMAL(20,4) NOT NULL,
    "lastPrice" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" "StockStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "type" "OrderType" NOT NULL,
    "price" DECIMAL(20,4),
    "quantity" DECIMAL(20,4) NOT NULL,
    "remainingQty" DECIMAL(20,4) NOT NULL,
    "lockedAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyOrderId" TEXT NOT NULL,
    "sellOrderId" TEXT NOT NULL,
    "price" DECIMAL(20,4) NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "total" DECIMAL(20,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "lockedQuantity" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "avgBuyPrice" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_userId_key" ON "Balance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_symbol_key" ON "Company"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_symbol_key" ON "Stock"("symbol");

-- CreateIndex
CREATE INDEX "Order_stockId_side_status_price_createdAt_idx" ON "Order"("stockId", "side", "status", "price", "createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Trade_stockId_createdAt_idx" ON "Trade"("stockId", "createdAt");

-- CreateIndex
CREATE INDEX "Trade_buyerId_idx" ON "Trade"("buyerId");

-- CreateIndex
CREATE INDEX "Trade_sellerId_idx" ON "Trade"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_userId_stockId_key" ON "Portfolio"("userId", "stockId");

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_buyOrderId_fkey" FOREIGN KEY ("buyOrderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_sellOrderId_fkey" FOREIGN KEY ("sellOrderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
