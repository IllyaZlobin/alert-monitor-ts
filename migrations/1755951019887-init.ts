import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1755951019887 implements MigrationInterface {
  name = 'Init1755951019887';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "telegram_id" bigint NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying, "username" character varying, CONSTRAINT "UQ_1a1e4649fd31ea6ec6b025c7bfc" UNIQUE ("telegram_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_1a1e4649fd31ea6ec6b025c7bf" ON "users" ("telegram_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_ef2fb839248017665e5033e730" ON "users" ("first_name") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_ef2fb839248017665e5033e730"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1a1e4649fd31ea6ec6b025c7bf"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
