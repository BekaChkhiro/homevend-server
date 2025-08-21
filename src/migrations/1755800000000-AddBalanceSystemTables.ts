import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBalanceSystemTables1755800000000 implements MigrationInterface {
    name = 'AddBalanceSystemTables1755800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add balance column to users table if it doesn't exist
        const hasBalance = await queryRunner.hasColumn("users", "balance");
        if (!hasBalance) {
            await queryRunner.query(`
                ALTER TABLE "users" 
                ADD COLUMN "balance" DECIMAL(10,2) DEFAULT 0.00 NOT NULL
            `);
        }

        // Check if transaction type enum exists
        const typeEnumExists = await queryRunner.query(`
            SELECT 1 FROM pg_type WHERE typname = 'transaction_type_enum'
        `);
        
        if (typeEnumExists.length === 0) {
            await queryRunner.query(`
                CREATE TYPE "transaction_type_enum" AS ENUM(
                    'top_up', 
                    'vip_purchase', 
                    'feature_purchase', 
                    'property_post', 
                    'project_post', 
                    'refund', 
                    'admin_adjustment'
                )
            `);
        }

        // Check if transaction status enum exists
        const statusEnumExists = await queryRunner.query(`
            SELECT 1 FROM pg_type WHERE typname = 'transaction_status_enum'
        `);
        
        if (statusEnumExists.length === 0) {
            await queryRunner.query(`
                CREATE TYPE "transaction_status_enum" AS ENUM(
                    'pending', 
                    'completed', 
                    'failed', 
                    'cancelled'
                )
            `);
        }

        // Check if transactions table exists
        const tableExists = await queryRunner.hasTable("transactions");
        
        if (!tableExists) {
            await queryRunner.query(`
                CREATE TABLE "transactions" (
                    "id" SERIAL NOT NULL,
                    "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "user_id" integer NOT NULL,
                    "type" "transaction_type_enum" NOT NULL,
                    "status" "transaction_status_enum" NOT NULL DEFAULT 'pending',
                    "amount" DECIMAL(10,2) NOT NULL,
                    "balance_before" DECIMAL(10,2) NOT NULL,
                    "balance_after" DECIMAL(10,2) NOT NULL,
                    "description" text,
                    "payment_method" varchar(50),
                    "external_transaction_id" varchar(255),
                    "metadata" jsonb,
                    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
                    CONSTRAINT "UQ_transactions_uuid" UNIQUE ("uuid")
                )
            `);
        }

        // Create indexes on transactions table if they don't exist
        if (!tableExists) {
            await queryRunner.query(`CREATE INDEX "IDX_transactions_user_id" ON "transactions" ("user_id")`);
            await queryRunner.query(`CREATE INDEX "IDX_transactions_created_at" ON "transactions" ("created_at")`);
            await queryRunner.query(`CREATE INDEX "IDX_transactions_type" ON "transactions" ("type")`);
            await queryRunner.query(`CREATE INDEX "IDX_transactions_status" ON "transactions" ("status")`);

            // Add foreign key constraint
            await queryRunner.query(`
                ALTER TABLE "transactions" 
                ADD CONSTRAINT "FK_transactions_user_id" 
                FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_user_id"`);
        
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_transactions_status"`);
        await queryRunner.query(`DROP INDEX "IDX_transactions_type"`);
        await queryRunner.query(`DROP INDEX "IDX_transactions_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_transactions_user_id"`);
        
        // Drop transactions table
        await queryRunner.query(`DROP TABLE "transactions"`);
        
        // Drop enums
        await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
        await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
        
        // Remove balance column from users table
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "balance"`);
    }
}