-- CreateEnum
CREATE TYPE "VetoFormat" AS ENUM ('BO1', 'BO3', 'BO5');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "VetoRoom" (
    "id" TEXT NOT NULL,
    "format" "VetoFormat" NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'ACTIVE',
    "team1Name" TEXT NOT NULL,
    "team2Name" TEXT NOT NULL,
    "mapPool" JSONB NOT NULL,
    "vetoState" JSONB,
    "team1Token" TEXT NOT NULL,
    "team2Token" TEXT NOT NULL,
    "spectatorToken" TEXT NOT NULL,
    "team1SessionId" TEXT,
    "team2SessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VetoRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VetoRoom_team1Token_key" ON "VetoRoom"("team1Token");

-- CreateIndex
CREATE UNIQUE INDEX "VetoRoom_team2Token_key" ON "VetoRoom"("team2Token");

-- CreateIndex
CREATE UNIQUE INDEX "VetoRoom_spectatorToken_key" ON "VetoRoom"("spectatorToken");

-- CreateIndex
CREATE INDEX "VetoRoom_status_idx" ON "VetoRoom"("status");

-- CreateIndex
CREATE INDEX "VetoRoom_expiresAt_idx" ON "VetoRoom"("expiresAt");
