import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVipStatusSystem1756000000000 implements MigrationInterface {
    name = 'AddVipStatusSystem1756000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create VIP status enum
        await queryRunner.query(`
            CREATE TYPE "vip_status_enum" AS ENUM('none', 'vip', 'vip_plus', 'super_vip')
        `);

        // Add VIP status columns to properties table
        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD COLUMN "vip_status" "vip_status_enum" DEFAULT 'none' NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD COLUMN "vip_expires_at" TIMESTAMP WITH TIME ZONE
        `);

        // Create vip_pricing table
        await queryRunner.query(`
            CREATE TABLE "vip_pricing" (
                "id" SERIAL NOT NULL,
                "vip_type" "vip_status_enum" NOT NULL,
                "price_per_day" DECIMAL(10,2) NOT NULL,
                "description_ka" text,
                "description_en" text,
                "is_active" boolean DEFAULT true NOT NULL,
                "features" jsonb,
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                CONSTRAINT "PK_vip_pricing" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_vip_pricing_vip_type" UNIQUE ("vip_type")
            )
        `);

        // Insert default VIP pricing
        await queryRunner.query(`
            INSERT INTO "vip_pricing" ("vip_type", "price_per_day", "description_ka", "description_en", "features") VALUES
            ('vip', 2.00, 'VIP სტატუსი - თქვენი განცხადება გამოირჩევა სხვებისგან', 'VIP Status - Your listing stands out from others', '["პრიორიტეტული ძიება", "VIP ნიშანი"]'),
            ('vip_plus', 4.00, 'VIP+ სტატუსი - გაძლიერებული ხილვადობა', 'VIP+ Status - Enhanced visibility', '["პრიორიტეტული ძიება", "VIP+ ნიშანი", "ფერადი კვადრატი"]'),
            ('super_vip', 8.00, 'SUPER VIP სტატუსი - მაქსიმალური ხილვადობა', 'SUPER VIP Status - Maximum visibility', '["პრიორიტეტული ძიება", "SUPER VIP ნიშანი", "გოლდ ფრეიმი", "ზედა პოზიცია"]')
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_properties_vip_status" ON "properties" ("vip_status")`);
        await queryRunner.query(`CREATE INDEX "IDX_properties_vip_expires_at" ON "properties" ("vip_expires_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_vip_pricing_vip_type" ON "vip_pricing" ("vip_type")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_vip_pricing_vip_type"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_vip_expires_at"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_vip_status"`);

        // Drop vip_pricing table
        await queryRunner.query(`DROP TABLE "vip_pricing"`);

        // Remove VIP columns from properties
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "vip_expires_at"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "vip_status"`);

        // Drop enum
        await queryRunner.query(`DROP TYPE "vip_status_enum"`);
    }
}