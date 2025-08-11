import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePropertyStatus1754610000000 implements MigrationInterface {
    name = 'RemovePropertyStatus1754610000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the status column from properties table
        await queryRunner.query(`ALTER TABLE properties DROP COLUMN IF EXISTS status`);
        
        // Drop the property_status_enum type
        await queryRunner.query(`DROP TYPE IF EXISTS property_status_enum`);

        console.log('✅ Removed property status column and enum');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the enum
        await queryRunner.query(`
            CREATE TYPE property_status_enum AS ENUM (
                'draft', 'pending', 'active', 'inactive', 'sold', 'rented', 'expired'
            )
        `);
        
        // Add the status column back
        await queryRunner.query(`
            ALTER TABLE properties 
            ADD COLUMN status property_status_enum DEFAULT 'pending'
        `);

        console.log('🔄 Restored property status column and enum');
    }
}