import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSocialMediaUrlToAgencies1754616000000 implements MigrationInterface {
    name = 'AddSocialMediaUrlToAgencies1754616000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add social_media_url column to agencies table
        await queryRunner.query(`
            ALTER TABLE agencies ADD COLUMN social_media_url VARCHAR(255);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove social_media_url column from agencies table
        await queryRunner.query(`
            ALTER TABLE agencies DROP COLUMN IF EXISTS social_media_url;
        `);
    }
}