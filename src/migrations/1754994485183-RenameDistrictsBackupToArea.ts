import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameDistrictsBackupToArea1754994485183 implements MigrationInterface {
    name = 'RenameDistrictsBackupToArea1754994485183'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing constraints and indexes first
        await queryRunner.query(`
            ALTER TABLE "districts_backup" 
            DROP CONSTRAINT "FK_DISTRICTS_BACKUP_CITY"
        `);
        
        await queryRunner.query(`
            DROP INDEX "IDX_DISTRICTS_BACKUP_NAME_KA"
        `);
        
        await queryRunner.query(`
            DROP INDEX "IDX_DISTRICTS_BACKUP_NAME_EN"
        `);
        
        await queryRunner.query(`
            DROP INDEX "IDX_DISTRICTS_BACKUP_NAME_RU"
        `);
        
        await queryRunner.query(`
            DROP INDEX "IDX_DISTRICTS_BACKUP_CITY"
        `);
        
        // Rename the table
        await queryRunner.query(`
            ALTER TABLE "districts_backup" RENAME TO "area"
        `);
        
        // Rename the primary key constraint
        await queryRunner.query(`
            ALTER TABLE "area" RENAME CONSTRAINT "PK_districts_backup_id" TO "PK_area_id"
        `);
        
        // Create new indexes with proper naming
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_AREA_NAME_KA" ON "area" ("name_ka")
        `);
        
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_AREA_NAME_EN" ON "area" ("name_en")
        `);
        
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_AREA_NAME_RU" ON "area" ("name_ru")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_AREA_CITY" ON "area" ("city_id")
        `);
        
        // Add foreign key constraint with new naming
        await queryRunner.query(`
            ALTER TABLE "area" 
            ADD CONSTRAINT "FK_AREA_CITY" 
            FOREIGN KEY ("city_id") 
            REFERENCES "cities"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop current constraints and indexes
        await queryRunner.query(`
            ALTER TABLE "area" 
            DROP CONSTRAINT "FK_AREA_CITY"
        `);
        
        await queryRunner.query(`
            DROP INDEX "IDX_AREA_NAME_KA"
        `);
        
        await queryRunner.query(`
            DROP INDEX "IDX_AREA_NAME_EN"
        `);
        
        await queryRunner.query(`
            DROP INDEX "IDX_AREA_NAME_RU"
        `);
        
        await queryRunner.query(`
            DROP INDEX "IDX_AREA_CITY"
        `);
        
        // Rename the table back
        await queryRunner.query(`
            ALTER TABLE "area" RENAME TO "districts_backup"
        `);
        
        // Rename the primary key constraint back
        await queryRunner.query(`
            ALTER TABLE "districts_backup" RENAME CONSTRAINT "PK_area_id" TO "PK_districts_backup_id"
        `);
        
        // Recreate original indexes
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
        
        // Add foreign key constraint with original naming
        await queryRunner.query(`
            ALTER TABLE "districts_backup" 
            ADD CONSTRAINT "FK_DISTRICTS_BACKUP_CITY" 
            FOREIGN KEY ("city_id") 
            REFERENCES "cities"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE
        `);
    }
}