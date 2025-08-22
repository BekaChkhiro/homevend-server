import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDevelopersTable1755857400000 implements MigrationInterface {
    name = 'CreateDevelopersTable1755857400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
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

        // Add developer_id column to properties table
        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD COLUMN "developer_id" integer
        `);

        // Add foreign key constraint for developer_id in properties
        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD CONSTRAINT "FK_properties_developer" 
            FOREIGN KEY ("developer_id") REFERENCES "developers"("id") ON DELETE SET NULL
        `);

        // First, create developer records for existing projects
        // Get all unique developer_ids from projects that reference users with 'developer' role
        await queryRunner.query(`
            INSERT INTO "developers" (owner_id, name, description, email, phone)
            SELECT DISTINCT 
                p.developer_id as owner_id,
                COALESCE(u.full_name, 'Developer Company') as name,
                'Auto-migrated developer account' as description,
                u.email,
                u.phone
            FROM "projects" p
            INNER JOIN "users" u ON u.id = p.developer_id
            WHERE u.role = 'developer'
            ON CONFLICT DO NOTHING
        `);

        // Update projects to reference the new developer records
        await queryRunner.query(`
            UPDATE "projects" p 
            SET developer_id = d.id
            FROM "developers" d
            WHERE d.owner_id = p.developer_id
        `);

        // Update projects table to reference developers instead of users
        await queryRunner.query(`
            ALTER TABLE "projects" 
            DROP CONSTRAINT IF EXISTS "FK_projects_developer"
        `);

        await queryRunner.query(`
            ALTER TABLE "projects" 
            ADD CONSTRAINT "FK_projects_developer" 
            FOREIGN KEY ("developer_id") REFERENCES "developers"("id") ON DELETE CASCADE
        `);

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
        
        await queryRunner.query(`
            CREATE INDEX "IDX_properties_developer_id" ON "properties" ("developer_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_properties_developer_id"`);
        await queryRunner.query(`DROP INDEX "IDX_developers_is_active"`);
        await queryRunner.query(`DROP INDEX "IDX_developers_is_verified"`);
        await queryRunner.query(`DROP INDEX "IDX_developers_owner_id"`);

        // Remove foreign key constraints
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_properties_developer"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_developer"`);

        // Remove developer_id column from properties
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "developer_id"`);

        // Drop developers table
        await queryRunner.query(`DROP TABLE "developers"`);

        // Restore original projects foreign key to users
        await queryRunner.query(`
            ALTER TABLE "projects" 
            ADD CONSTRAINT "FK_projects_developer" 
            FOREIGN KEY ("developer_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);
    }
}