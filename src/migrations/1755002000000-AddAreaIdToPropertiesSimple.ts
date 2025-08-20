import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAreaIdToPropertiesSimple1755002000000 implements MigrationInterface {
    name = 'AddAreaIdToPropertiesSimple1755002000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add area_id column to properties table
        await queryRunner.query(`ALTER TABLE "properties" ADD "area_id" integer`);
        
        // Add foreign key constraint to area table
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_properties_area" FOREIGN KEY ("area_id") REFERENCES "area"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        
        // Remove the old district string column
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "district"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add back the district string column
        await queryRunner.query(`ALTER TABLE "properties" ADD "district" character varying(100)`);
        
        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_properties_area"`);
        
        // Remove area_id column
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "area_id"`);
    }
}