import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCityIdToDistricts1754984250783 implements MigrationInterface {
    name = 'AddCityIdToDistricts1754984250783'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, add the city_id column (nullable initially to allow data migration)
        await queryRunner.query(`
            ALTER TABLE "districts" 
            ADD COLUMN "city_id" integer
        `);
        
        // Add index for performance
        await queryRunner.query(`
            CREATE INDEX "IDX_DISTRICT_CITY" ON "districts" ("city_id")
        `);
        
        // Add foreign key constraint to cities table
        await queryRunner.query(`
            ALTER TABLE "districts" 
            ADD CONSTRAINT "FK_DISTRICT_CITY" 
            FOREIGN KEY ("city_id") 
            REFERENCES "cities"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "districts" 
            DROP CONSTRAINT "FK_DISTRICT_CITY"
        `);
        
        // Remove index
        await queryRunner.query(`
            DROP INDEX "IDX_DISTRICT_CITY"
        `);
        
        // Remove column
        await queryRunner.query(`
            ALTER TABLE "districts" 
            DROP COLUMN "city_id"
        `);
    }
}