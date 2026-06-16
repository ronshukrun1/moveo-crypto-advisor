import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDailyContentTables1750300000000 implements MigrationInterface {
  name = 'CreateDailyContentTables1750300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "daily_insights" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "generatedForDate" date NOT NULL,
        "sourceDataSnapshot" jsonb NOT NULL,
        "contextHash" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_insights" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_daily_insights_user_date" UNIQUE ("userId", "generatedForDate"),
        CONSTRAINT "FK_daily_insights_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "daily_memes" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "templateId" integer NOT NULL,
        "imageUrl" character varying NOT NULL,
        "pageUrl" character varying NOT NULL,
        "textTop" character varying NOT NULL,
        "textBottom" character varying NOT NULL,
        "generatedForDate" date NOT NULL,
        "sourceDataSnapshot" jsonb NOT NULL,
        "contextHash" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_memes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_daily_memes_user_date" UNIQUE ("userId", "generatedForDate"),
        CONSTRAINT "FK_daily_memes_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "daily_memes"`);
    await queryRunner.query(`DROP TABLE "daily_insights"`);
  }
}
