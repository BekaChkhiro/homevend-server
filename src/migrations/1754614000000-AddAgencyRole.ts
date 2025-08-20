import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAgencyRole1754614000000 implements MigrationInterface {
    name = 'AddAgencyRole1754614000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add 'agency' to the user_role_enum
        await queryRunner.query(`
            ALTER TYPE user_role_enum ADD VALUE 'agency';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // This would require recreating the enum type and updating all references
        // For now, we'll just note that this migration isn't easily reversible
        console.log('Warning: Removing enum values from PostgreSQL is not straightforward. Manual intervention may be required.');
    }
}