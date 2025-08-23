import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageEntity1755981569979 implements MigrationInterface {
  name = 'AddMessageEntity1755981569979';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "telegram_message_id" bigint NOT NULL, "text" text NOT NULL, "text_vector" tsvector NOT NULL, "message_url" character varying NOT NULL, "message_time" TIMESTAMP WITH TIME ZONE NOT NULL, "processed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 hour', CONSTRAINT "UQ_268748ac293771dc40c9b761063" UNIQUE ("telegram_message_id"), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_0777b63da90c27d6ed993dc60b" ON "messages" ("created_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_27add10dc8bfead47a3307293d" ON "messages" ("processed_at") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_268748ac293771dc40c9b76106" ON "messages" ("telegram_message_id") `
    );

    // #region manual
    await queryRunner.query(`CREATE INDEX ix_messages__text_vector ON messages USING gin(text_vector);`);
    await queryRunner.query(
      `CREATE FUNCTION set_messages_text_vector() RETURNS trigger
        LANGUAGE plpgsql
      AS
      $$
      BEGIN
        NEW.text_vector := to_tsvector('simple', NEW.text);
        RETURN NEW;
      END
      $$;`
    );
    await queryRunner.query(
      `CREATE TRIGGER set_messages_text_vector
        BEFORE INSERT OR UPDATE
          OF text
        ON messages
        FOR EACH ROW
      EXECUTE PROCEDURE set_messages_text_vector();`
    );
    await queryRunner.query(`UPDATE messages SET text_vector = to_tsvector('simple', text);`);
    // #endregion
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_268748ac293771dc40c9b76106"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_27add10dc8bfead47a3307293d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0777b63da90c27d6ed993dc60b"`);
    await queryRunner.query(`DROP TABLE "messages"`);

    // #region manual
    await queryRunner.query(`DROP TRIGGER set_messages_text_vector ON messages;`);
    await queryRunner.query(`DROP FUNCTION set_messages_text_vector;`);
    await queryRunner.query(`DROP INDEX ix_messages__text_vector;`);
    // #endregion
  }
}
