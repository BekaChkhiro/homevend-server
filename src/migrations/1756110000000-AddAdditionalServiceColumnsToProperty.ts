import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdditionalServiceColumnsToProperty1756110000000 implements MigrationInterface {
    name = 'AddAdditionalServiceColumnsToProperty1756110000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add auto-renew columns
        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD COLUMN IF NOT EXISTS "auto_renew_enabled" BOOLEAN DEFAULT FALSE
        `);

        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD COLUMN IF NOT EXISTS "auto_renew_expires_at" TIMESTAMP WITH TIME ZONE
        `);

        // Add color separation columns
        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD COLUMN IF NOT EXISTS "color_separation_enabled" BOOLEAN DEFAULT FALSE
        `);

        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD COLUMN IF NOT EXISTS "color_separation_expires_at" TIMESTAMP WITH TIME ZONE
        `);

        // Add indexes for better query performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_auto_renew_enabled" 
            ON "properties" ("auto_renew_enabled")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_auto_renew_expires" 
            ON "properties" ("auto_renew_expires_at")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_color_separation_enabled" 
            ON "properties" ("color_separation_enabled")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_color_separation_expires" 
            ON "properties" ("color_separation_expires_at")
        `);

        // Add composite index for active services
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_active_services" 
            ON "properties" ("auto_renew_enabled", "color_separation_enabled", "created_at")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_active_services"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_color_separation_expires"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_color_separation_enabled"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_auto_renew_expires"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_auto_renew_enabled"`);

        // Drop columns
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "color_separation_expires_at"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "color_separation_enabled"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "auto_renew_expires_at"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "auto_renew_enabled"`);
    }
}