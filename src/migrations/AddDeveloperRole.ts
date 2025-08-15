import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeveloperRole1692345678901 implements MigrationInterface {
    name = 'AddDeveloperRole1692345678901'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if 'developer' value already exists in the enum
        const result = await queryRunner.query(`
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'developer' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
        `);
        
        // Add 'developer' value to the existing user_role_enum only if it doesn't exist
        if (result.length === 0) {
            await queryRunner.query(`ALTER TYPE "user_role_enum" ADD VALUE 'developer'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // This would require recreating the enum type and migrating data
        // For now, we'll leave the developer value in the enum
        console.log('Cannot remove enum value in PostgreSQL. Manual intervention required.');
    }
}