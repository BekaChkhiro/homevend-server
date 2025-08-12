import { MigrationInterface, QueryRunner } from "typeorm";

export class BackupAndClearDistricts1754988390552 implements MigrationInterface {
    name = 'BackupAndClearDistricts1754988390552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create backup table with same structure as districts
        await queryRunner.query(`
            CREATE TABLE "districts_backup" (
                "id" SERIAL NOT NULL,
                "city_id" integer NOT NULL,
                "name_ka" character varying(100) NOT NULL,
                "name_en" character varying(100) NOT NULL,
                "name_ru" character varying(100) NOT NULL,
                "description" text,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_districts_backup_id" PRIMARY KEY ("id")
            )
        `);
        
        // Copy all data from districts to districts_backup
        await queryRunner.query(`
            INSERT INTO "districts_backup" 
            (id, city_id, name_ka, name_en, name_ru, description, is_active, created_at, updated_at)
            SELECT id, city_id, name_ka, name_en, name_ru, description, is_active, created_at, updated_at
            FROM "districts"
        `);
        
        // Create indexes on backup table for reference
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_DISTRICTS_BACKUP_NAME_KA" ON "districts_backup" ("name_ka")
        `);
        
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_DISTRICTS_BACKUP_NAME_EN" ON "districts_backup" ("name_en")
        `);
        
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_DISTRICTS_BACKUP_NAME_RU" ON "districts_backup" ("name_ru")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_DISTRICTS_BACKUP_CITY" ON "districts_backup" ("city_id")
        `);
        
        // Add foreign key reference to cities table
        await queryRunner.query(`
            ALTER TABLE "districts_backup" 
            ADD CONSTRAINT "FK_DISTRICTS_BACKUP_CITY" 
            FOREIGN KEY ("city_id") 
            REFERENCES "cities"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE
        `);
        
        // Clear the original districts table (but keep the structure)
        await queryRunner.query(`DELETE FROM "districts"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore data from backup to original table
        await queryRunner.query(`
            INSERT INTO "districts" 
            (id, city_id, name_ka, name_en, name_ru, description, is_active, created_at, updated_at)
            SELECT id, city_id, name_ka, name_en, name_ru, description, is_active, created_at, updated_at
            FROM "districts_backup"
        `);
        
        // Drop the backup table
        await queryRunner.query(`DROP TABLE "districts_backup"`);
    }
}