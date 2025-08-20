import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPropertyIndexes1755900000001 implements MigrationInterface {
    name = 'AddPropertyIndexes1755900000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add composite indexes for most common filter combinations
        await queryRunner.query(`
            CREATE INDEX "IDX_properties_type_city" ON "properties" ("property_type", "city_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_deal_type_price" ON "properties" ("deal_type", "total_price")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_area_range" ON "properties" ("area")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_bedrooms_bathrooms" ON "properties" ("bedrooms", "bathrooms")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_featured_created" ON "properties" ("is_featured" DESC, "created_at" DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_city_area_price" ON "properties" ("city_id", "area_id", "total_price")
        `);

        // Text search indexes for search functionality
        await queryRunner.query(`
            CREATE INDEX "IDX_properties_title_search" ON "properties" USING gin (to_tsvector('english', "title"))
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_street_search" ON "properties" USING gin (to_tsvector('english', "street"))
        `);

        // Single column indexes for common filters
        await queryRunner.query(`
            CREATE INDEX "IDX_properties_building_status" ON "properties" ("building_status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_condition" ON "properties" ("condition")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_heating" ON "properties" ("heating")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_parking" ON "properties" ("parking")
        `);

        // Boolean indexes for amenities
        await queryRunner.query(`
            CREATE INDEX "IDX_properties_has_balcony" ON "properties" ("has_balcony") WHERE "has_balcony" = true
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_has_pool" ON "properties" ("has_pool") WHERE "has_pool" = true
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_has_yard" ON "properties" ("has_yard") WHERE "has_yard" = true
        `);

        // User and area relation indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_properties_user_id" ON "properties" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_properties_area_id" ON "properties" ("area_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all indexes in reverse order
        await queryRunner.query(`DROP INDEX "IDX_properties_area_id"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_has_yard"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_has_pool"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_has_balcony"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_parking"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_heating"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_condition"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_building_status"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_street_search"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_title_search"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_city_area_price"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_featured_created"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_bedrooms_bathrooms"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_area_range"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_deal_type_price"`);
        await queryRunner.query(`DROP INDEX "IDX_properties_type_city"`);
    }
}