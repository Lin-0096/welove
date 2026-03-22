-- CreateTable
CREATE TABLE "TrackedCity" (
    "id" TEXT NOT NULL,
    "citySlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceSnapshot" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "citySlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "snappedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuratedPlace" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "citySlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "primaryType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "curatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuratedPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackedCity_citySlug_key" ON "TrackedCity"("citySlug");

-- CreateIndex
CREATE INDEX "PlaceSnapshot_citySlug_snappedAt_idx" ON "PlaceSnapshot"("citySlug", "snappedAt");

-- CreateIndex
CREATE INDEX "PlaceSnapshot_placeId_snappedAt_idx" ON "PlaceSnapshot"("placeId", "snappedAt");

-- CreateIndex
CREATE INDEX "CuratedPlace_citySlug_curatedAt_idx" ON "CuratedPlace"("citySlug", "curatedAt");
