import { MigrationInterface, QueryRunner } from 'typeorm';

export class MessageRemoveExpiresAt1756313284707 implements MigrationInterface {
  name = 'MessageRemoveExpiresAt1756313284707';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "expires_at"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + '01:00:00')`
    );
  }
}
