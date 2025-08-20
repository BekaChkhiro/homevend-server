import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateConditionEnum1754600000000 implements MigrationInterface {
    name = 'UpdateConditionEnum1754600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new condition enum values
        await queryRunner.query(`
            ALTER TYPE condition_enum ADD VALUE 'old-renovated' AFTER 'under-renovation'
        `);
        
        await queryRunner.query(`
            ALTER TYPE condition_enum ADD VALUE 'newly-renovated' AFTER 'old-renovated'
        `);

        console.log('✅ Updated condition enum with new values');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values
        // If you need to remove enum values, you would need to:
        // 1. Create a new enum type
        // 2. Update all columns to use the new type
        // 3. Drop the old enum type
        // For now, we'll leave this empty as removing enum values is complex
        
        console.log('⚠️ Cannot automatically revert enum value additions in PostgreSQL');
    }
}