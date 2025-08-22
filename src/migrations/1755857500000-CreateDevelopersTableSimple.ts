import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDevelopersTableSimple1755857500000 implements MigrationInterface {
    name = 'CreateDevelopersTableSimple1755857500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if developers table already exists
        const table = await queryRunner.getTable("developers");
        if (table) {
            console.log("Developers table already exists, skipping creation");
            return;
        }

        // Create developers table
        await queryRunner.query(`
            CREATE TABLE "developers" (
                "id" SERIAL NOT NULL,
                "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "owner_id" integer NOT NULL,
                "name" character varying(300) NOT NULL,
                "description" text,
                "website" character varying(255),
                "social_media_url" character varying(255),
                "phone" character varying(20),
                "email" character varying(255),
                "address" text,
                "tax_number" character varying(50),
                "registration_number" character varying(50),
                "logo_url" character varying(500),
                "banner_url" character varying(500),
                "is_verified" boolean NOT NULL DEFAULT false,
                "is_active" boolean NOT NULL DEFAULT true,
                "project_count" integer NOT NULL DEFAULT '0',
                "property_count" integer NOT NULL DEFAULT '0',
                "total_sales" numeric(12,2) NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_developers" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_developers_uuid" UNIQUE ("uuid"),
                CONSTRAINT "FK_developers_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Add developer_id column to properties table if it doesn't exist
        const hasColumn = await queryRunner.hasColumn("properties", "developer_id");
        if (!hasColumn) {
            await queryRunner.query(`
                ALTER TABLE "properties" 
                ADD COLUMN "developer_id" integer
            `);

            await queryRunner.query(`
                ALTER TABLE "properties" 
                ADD CONSTRAINT "FK_properties_developer" 
                FOREIGN KEY ("developer_id") REFERENCES "developers"("id") ON DELETE SET NULL
            `);
        }

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_developers_owner_id" ON "developers" ("owner_id")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_developers_is_verified" ON "developers" ("is_verified")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_developers_is_active" ON "developers" ("is_active")
        `);
        
        if (!hasColumn) {
            await queryRunner.query(`
                CREATE INDEX "IDX_properties_developer_id" ON "properties" ("developer_id")
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_developer_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_developers_is_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_developers_is_verified"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_developers_owner_id"`);

        // Remove foreign key constraints
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "FK_properties_developer"`);

        // Remove developer_id column from properties
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "developer_id"`);

        // Drop developers table
        await queryRunner.query(`DROP TABLE IF EXISTS "developers"`);
    }
}