import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTitleToProperty1754551489973 implements MigrationInterface {
    name = 'AddTitleToProperty1754551489973'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add title column to properties table
        await queryRunner.query(`ALTER TABLE "properties" ADD COLUMN "title" character varying(200) NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove title column from properties table
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "title"`);
    }
}