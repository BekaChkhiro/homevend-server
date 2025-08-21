import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionMetadataIndexes1756100000000 implements MigrationInterface {
    name = 'AddTransactionMetadataIndexes1756100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add indexes on metadata fields for efficient transaction searching
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_transactions_metadata_property_id" 
            ON "transactions" USING GIN ((metadata->>'propertyId'));
        `);
        
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_transactions_metadata_purchase_type" 
            ON "transactions" USING GIN ((metadata->>'purchaseType'));
        `);
        
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_transactions_metadata_vip_service_type" 
            ON "transactions" USING GIN ((metadata->'vipService'->>'serviceType'));
        `);
        
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_transactions_metadata_purchased_at" 
            ON "transactions" USING GIN ((metadata->'purchaseDetails'->>'purchasedAt'));
        `);

        // Add a composite index for common queries
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_transactions_user_type_created" 
            ON "transactions" ("user_id", "type", "created_at" DESC);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_transactions_metadata_property_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_transactions_metadata_purchase_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_transactions_metadata_vip_service_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_transactions_metadata_purchased_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_transactions_user_type_created"`);
    }
}