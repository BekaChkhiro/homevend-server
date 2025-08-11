import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCeilingHeightPrecision1754620000000 implements MigrationInterface {
    name = 'FixCeilingHeightPrecision1754620000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update ceiling_height column to have precision 4 instead of 3
        await queryRunner.query(`
            ALTER TABLE properties 
            ALTER COLUMN ceiling_height TYPE DECIMAL(4,2)
        `);
        
        console.log('✅ Updated ceiling_height precision from 3,2 to 4,2');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert ceiling_height column back to precision 3
        await queryRunner.query(`
            ALTER TABLE properties 
            ALTER COLUMN ceiling_height TYPE DECIMAL(3,2)
        `);
        
        console.log('🔄 Reverted ceiling_height precision from 4,2 back to 3,2');
    }
}