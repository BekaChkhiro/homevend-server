import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveCityIdFromDistricts1754995718382 implements MigrationInterface {
    name = 'RemoveCityIdFromDistricts1754995718382'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint first
        await queryRunner.query(`
            ALTER TABLE "districts" 
            DROP CONSTRAINT "FK_DISTRICT_CITY"
        `);
        
        // Remove index
        await queryRunner.query(`
            DROP INDEX "IDX_DISTRICT_CITY"
        `);
        
        // Remove the city_id column
        await queryRunner.query(`
            ALTER TABLE "districts" 
            DROP COLUMN "city_id"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add the city_id column back
        await queryRunner.query(`
            ALTER TABLE "districts" 
            ADD COLUMN "city_id" integer
        `);
        
        // Add index back
        await queryRunner.query(`
            CREATE INDEX "IDX_DISTRICT_CITY" ON "districts" ("city_id")
        `);
        
        // Add foreign key constraint back
        await queryRunner.query(`
            ALTER TABLE "districts" 
            ADD CONSTRAINT "FK_DISTRICT_CITY" 
            FOREIGN KEY ("city_id") 
            REFERENCES "cities"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE
        `);
    }
}