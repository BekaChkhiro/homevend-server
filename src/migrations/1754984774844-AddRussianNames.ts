import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRussianNames1754984774844 implements MigrationInterface {
    name = 'AddRussianNames1754984774844'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add name_ru column to districts table
        await queryRunner.query(`
            ALTER TABLE "districts" 
            ADD COLUMN "name_ru" character varying(100)
        `);
        
        // Add unique index for districts name_ru
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_DISTRICT_NAME_RU" ON "districts" ("name_ru")
        `);
        
        // Add name_russian column to cities table
        await queryRunner.query(`
            ALTER TABLE "cities" 
            ADD COLUMN "name_russian" character varying(100)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove name_russian column from cities table
        await queryRunner.query(`
            ALTER TABLE "cities" 
            DROP COLUMN "name_russian"
        `);
        
        // Remove unique index for districts name_ru
        await queryRunner.query(`
            DROP INDEX "IDX_DISTRICT_NAME_RU"
        `);
        
        // Remove name_ru column from districts table
        await queryRunner.query(`
            ALTER TABLE "districts" 
            DROP COLUMN "name_ru"
        `);
    }
}