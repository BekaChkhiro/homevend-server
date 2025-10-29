import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveContactEmailFromProperties1756500000000 implements MigrationInterface {
    name = 'RemoveContactEmailFromProperties1756500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the contact_email column from properties table
        await queryRunner.query(`ALTER TABLE properties DROP COLUMN IF EXISTS contact_email`);

        console.log('✅ Removed contact_email column from properties table');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add the contact_email column back
        await queryRunner.query(`
            ALTER TABLE properties
            ADD COLUMN contact_email VARCHAR(255)
        `);

        console.log('🔄 Restored contact_email column to properties table');
    }
}
