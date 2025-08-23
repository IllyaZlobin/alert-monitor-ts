import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1755970106944 implements MigrationInterface {
  name = 'Init1755970106944';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "name_vector" tsvector NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_227023051ab1fedef7a3b6c7e2" ON "locations" ("name") `);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "telegram_id" bigint NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying, "username" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_1a1e4649fd31ea6ec6b025c7bfc" UNIQUE ("telegram_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_1a1e4649fd31ea6ec6b025c7bf" ON "users" ("telegram_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_ef2fb839248017665e5033e730" ON "users" ("first_name") `);
    await queryRunner.query(
      `CREATE TABLE "users_locations" ("user_id" uuid NOT NULL, "location_id" uuid NOT NULL, CONSTRAINT "PK_ef032906be6d0a55ab892fcb88a" PRIMARY KEY ("user_id", "location_id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_a3338bbb9872375fa528508c8f" ON "users_locations" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_bd324a2253146b81547e5f3d9d" ON "users_locations" ("location_id") `);
    await queryRunner.query(
      `ALTER TABLE "users_locations" ADD CONSTRAINT "FK_a3338bbb9872375fa528508c8f5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "users_locations" ADD CONSTRAINT "FK_bd324a2253146b81547e5f3d9df" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );

    //#region manual
    await queryRunner.query(
      `
          CREATE FUNCTION plainto_tsquery_prefix(config regconfig, document text) RETURNS tsquery
          AS
          '
            SELECT CASE
              WHEN numnode(plainto_tsquery(config, DOCUMENT)) = 0 THEN ''''::tsquery
              ELSE to_tsquery(config, plainto_tsquery(config, DOCUMENT)::TEXT || '':*'')
              END;
          '
          LANGUAGE SQL
          IMMUTABLE
          RETURNS NULL ON NULL INPUT;
        `
    );
    //#endregion

    // #region manual
    await queryRunner.query(`CREATE INDEX ix_locations__name_vector ON locations USING gin(name_vector);`);
    await queryRunner.query(
      `CREATE FUNCTION set_locations_name_vector() RETURNS trigger
        LANGUAGE plpgsql
      AS
      $$
      BEGIN
        NEW.name_vector := to_tsvector('simple', NEW.name);
        RETURN NEW;
      END
      $$;`
    );
    await queryRunner.query(
      `CREATE TRIGGER set_locations_name_vector
        BEFORE INSERT OR UPDATE
          OF name
        ON locations
        FOR EACH ROW
      EXECUTE PROCEDURE set_locations_name_vector();`
    );
    await queryRunner.query(`UPDATE locations SET name_vector = to_tsvector('simple', name);`);
    // #endregion
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users_locations" DROP CONSTRAINT "FK_bd324a2253146b81547e5f3d9df"`);
    await queryRunner.query(`ALTER TABLE "users_locations" DROP CONSTRAINT "FK_a3338bbb9872375fa528508c8f5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bd324a2253146b81547e5f3d9d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a3338bbb9872375fa528508c8f"`);
    await queryRunner.query(`DROP TABLE "users_locations"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ef2fb839248017665e5033e730"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1a1e4649fd31ea6ec6b025c7bf"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_227023051ab1fedef7a3b6c7e2"`);
    await queryRunner.query(`DROP TABLE "locations"`);

    //#region manual
    await queryRunner.query(`DROP FUNCTION plainto_tsquery_prefix`);
    //#endregion

    // #region manual
    await queryRunner.query(`DROP TRIGGER set_locations_name_vector ON locations;`);
    await queryRunner.query(`DROP FUNCTION set_locations_name_vector;`);
    await queryRunner.query(`DROP INDEX ix_locations__name_vector;`);
    // #endregion
  }
}
