/*
  Warnings:

  - You are about to drop the column `commentId` on the `Like` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Like` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[likedById,postId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `likedById` to the `Like` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_userId_fkey";

-- DropIndex
DROP INDEX "Like_userId_postId_key";

-- AlterTable
ALTER TABLE "Like" DROP COLUMN "commentId",
DROP COLUMN "userId",
ADD COLUMN     "likedById" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Like_likedById_postId_key" ON "Like"("likedById", "postId");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_likedById_fkey" FOREIGN KEY ("likedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
