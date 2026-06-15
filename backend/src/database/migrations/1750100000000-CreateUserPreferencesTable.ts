import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserPreferencesTable1750100000000 implements MigrationInterface {
  name = 'CreateUserPreferencesTable1750100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "investor_profile_enum" AS ENUM (
        'BEGINNER',
        'LONG_TERM_HOLDER',
        'ACTIVE_TRADER',
        'CRYPTO_ENTHUSIAST'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_preferences" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "investorProfile" "investor_profile_enum" NOT NULL DEFAULT 'BEGINNER',
        "showMarketPrices" boolean NOT NULL DEFAULT true,
        "showNews" boolean NOT NULL DEFAULT true,
        "showAiInsight" boolean NOT NULL DEFAULT true,
        "showMeme" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_preferences_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_preferences_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_user_preferences_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_preferences"`);
    await queryRunner.query(`DROP TYPE "investor_profile_enum"`);
  }
}
