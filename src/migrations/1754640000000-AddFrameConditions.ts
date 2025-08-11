import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFrameConditions1754640000000 implements MigrationInterface {
    name = 'AddFrameConditions1754640000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new condition enum values for frame conditions
        await queryRunner.query(`
            ALTER TYPE condition_enum ADD VALUE IF NOT EXISTS 'black-frame' AFTER 'newly-renovated';
            ALTER TYPE condition_enum ADD VALUE IF NOT EXISTS 'white-frame' AFTER 'black-frame';
            ALTER TYPE condition_enum ADD VALUE IF NOT EXISTS 'green-frame' AFTER 'white-frame';
        `);
        
        console.log('✅ Added frame conditions to condition_enum');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values easily
        // We would need to recreate the entire enum and all columns using it
        console.log('⚠️  Cannot remove enum values in PostgreSQL. Manual intervention required.');
    }
}