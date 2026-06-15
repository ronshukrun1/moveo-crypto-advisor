import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserSelectedCoinsTable1750200000000 implements MigrationInterface {
  name = 'CreateUserSelectedCoinsTable1750200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_selected_coins" (
        "userId" integer NOT NULL,
        "coinId" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_selected_coins" PRIMARY KEY ("userId", "coinId"),
        CONSTRAINT "FK_user_selected_coins_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_selected_coins_coinId" FOREIGN KEY ("coinId") REFERENCES "coins"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_selected_coins"`);
  }
}
