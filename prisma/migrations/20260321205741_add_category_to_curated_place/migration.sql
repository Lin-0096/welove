-- DropIndex
DROP INDEX "CuratedPlace_citySlug_curatedAt_idx";

-- AlterTable
ALTER TABLE "CuratedPlace" ADD COLUMN     "category" TEXT;

-- CreateIndex
CREATE INDEX "CuratedPlace_citySlug_category_curatedAt_idx" ON "CuratedPlace"("citySlug", "category", "curatedAt");
