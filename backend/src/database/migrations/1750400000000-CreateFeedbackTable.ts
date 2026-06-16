import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedbackTable1750400000000 implements MigrationInterface {
  name = 'CreateFeedbackTable1750400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "feedback_content_type_enum" AS ENUM ('MARKET', 'NEWS', 'INSIGHT', 'MEME')
    `);
    await queryRunner.query(`
      CREATE TYPE "feedback_type_enum" AS ENUM ('UP', 'DOWN')
    `);
    await queryRunner.query(`
      CREATE TABLE "feedback" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "contentType" "feedback_content_type_enum" NOT NULL,
        "contentId" character varying(255) NOT NULL,
        "feedbackType" "feedback_type_enum" NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_feedback_user_content" UNIQUE ("userId", "contentType", "contentId"),
        CONSTRAINT "FK_feedback_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "feedback"`);
    await queryRunner.query(`DROP TYPE "feedback_type_enum"`);
    await queryRunner.query(`DROP TYPE "feedback_content_type_enum"`);
  }
}
