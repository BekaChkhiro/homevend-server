import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRedemptionToDealType1754570000000 implements MigrationInterface {
    name = 'AddRedemptionToDealType1754570000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add 'redemption' to deal_type_enum
        await queryRunner.query(`ALTER TYPE deal_type_enum ADD VALUE 'redemption'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // This would require recreating the enum type which is complex
        // For production, you might want to create a new enum and migrate data
        console.warn('Removing enum values is not directly supported in PostgreSQL');
    }
}