/*
  Warnings:

  - Added the required column `coverUrl` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileUrl` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "text" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coverUrl" TEXT NOT NULL,
ADD COLUMN     "profileUrl" TEXT NOT NULL;
