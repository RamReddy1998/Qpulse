-- CreateEnum
CREATE TYPE "LearningType" AS ENUM ('BATCH', 'SELF');

-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "end_time" TIMESTAMP(3),
ADD COLUMN     "start_time" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "certifications" ADD COLUMN     "exam_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'seed';

-- AlterTable
ALTER TABLE "readiness_scores" ADD COLUMN     "certification_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "learning_type" "LearningType" NOT NULL DEFAULT 'SELF';

-- CreateIndex
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");

-- CreateIndex
CREATE INDEX "readiness_scores_certification_id_idx" ON "readiness_scores"("certification_id");

-- AddForeignKey
ALTER TABLE "readiness_scores" ADD CONSTRAINT "readiness_scores_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
