import { MigrationInterface, QueryRunner } from "typeorm";

export class DropDevelopersTable1755871311744 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "FK_properties_developer"`);
        
        // Drop the developers table
        await queryRunner.query(`DROP TABLE IF EXISTS "developers"`);
        
        // Remove developer_id column from properties table
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "developer_id"`);
        
        // Clean up any logs - truncate log tables if they exist
        const tableExistsQuery = `SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'query-result-cache'
        )`;
        const tableExists = await queryRunner.query(tableExistsQuery);
        if (tableExists[0].exists) {
            await queryRunner.query(`TRUNCATE TABLE "query-result-cache" CASCADE`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate developers table
        await queryRunner.query(`CREATE TABLE "developers" (
            "id" SERIAL NOT NULL,
            "name" character varying NOT NULL,
            "email" character varying NOT NULL,
            "phone" character varying,
            "address" text,
            "website" character varying,
            "description" text,
            "logo_url" character varying,
            "established_year" integer,
            "is_active" boolean NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_developers_email" UNIQUE ("email"),
            CONSTRAINT "PK_developers" PRIMARY KEY ("id")
        )`);
        
        // Add developer_id column back to properties
        await queryRunner.query(`ALTER TABLE "properties" ADD "developer_id" integer`);
        
        // Recreate foreign key constraint
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_properties_developer" FOREIGN KEY ("developer_id") REFERENCES "developers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
