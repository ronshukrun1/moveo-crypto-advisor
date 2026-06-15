import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoinsTable1750000000000 implements MigrationInterface {
  name = 'CreateCoinsTable1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "coins" (
        "id" SERIAL NOT NULL,
        "coingeckoId" character varying NOT NULL,
        "symbol" character varying NOT NULL,
        "name" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_coins_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_coins_coingeckoId" UNIQUE ("coingeckoId"),
        CONSTRAINT "UQ_coins_symbol" UNIQUE ("symbol")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "coins" ("coingeckoId", "symbol", "name", "isActive")
      VALUES
        ('bitcoin', 'BTC', 'Bitcoin', true),
        ('ethereum', 'ETH', 'Ethereum', true),
        ('solana', 'SOL', 'Solana', true),
        ('ripple', 'XRP', 'XRP', true),
        ('dogecoin', 'DOGE', 'Dogecoin', true),
        ('cardano', 'ADA', 'Cardano', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "coins"`);
  }
}
