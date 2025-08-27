import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFreeToServiceEnums1756010000000 implements MigrationInterface {
  name = 'AddFreeToServiceEnums1756010000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'free' value to enum used by service_pricing.service_type (Postgres <13 compatible)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'service_pricing_service_type_enum'
        ) THEN
          IF NOT EXISTS (
            SELECT 1 FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'service_pricing_service_type_enum'
              AND e.enumlabel = 'free'
          ) THEN
            ALTER TYPE service_pricing_service_type_enum ADD VALUE 'free';
          END IF;
        END IF;
      END$$ LANGUAGE plpgsql;
    `);

    // Add 'free' value to enum used by property_services.service_type (if present)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'property_services_service_type_enum'
        ) THEN
          IF NOT EXISTS (
            SELECT 1 FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'property_services_service_type_enum'
              AND e.enumlabel = 'free'
          ) THEN
            ALTER TYPE property_services_service_type_enum ADD VALUE 'free';
          END IF;
        END IF;
      END$$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres cannot easily remove enum values; leaving as no-op
  }
}
