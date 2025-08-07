import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIndexesAndTriggers1754560000001 implements MigrationInterface {
    name = 'CreateIndexesAndTriggers1754560000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        
        // =============================================================================
        // INDEXES FOR OPTIMAL PERFORMANCE
        // =============================================================================

        // Users table indexes
        await queryRunner.query(`CREATE INDEX idx_users_email ON users(email)`);
        await queryRunner.query(`CREATE INDEX idx_users_role ON users(role)`);
        await queryRunner.query(`CREATE INDEX idx_users_is_active ON users(is_active)`);
        await queryRunner.query(`CREATE INDEX idx_users_uuid ON users(uuid)`);

        // Properties table indexes
        await queryRunner.query(`CREATE INDEX idx_properties_user_id ON properties(user_id)`);
        await queryRunner.query(`CREATE INDEX idx_properties_city_id ON properties(city_id)`);
        await queryRunner.query(`CREATE INDEX idx_properties_property_type ON properties(property_type)`);
        await queryRunner.query(`CREATE INDEX idx_properties_deal_type ON properties(deal_type)`);
        await queryRunner.query(`CREATE INDEX idx_properties_status ON properties(status)`);
        await queryRunner.query(`CREATE INDEX idx_properties_is_featured ON properties(is_featured)`);
        await queryRunner.query(`CREATE INDEX idx_properties_created_at ON properties(created_at DESC)`);
        await queryRunner.query(`CREATE INDEX idx_properties_published_at ON properties(published_at DESC)`);
        await queryRunner.query(`CREATE INDEX idx_properties_price ON properties(total_price)`);
        await queryRunner.query(`CREATE INDEX idx_properties_area ON properties(area)`);
        await queryRunner.query(`CREATE INDEX idx_properties_location ON properties(latitude, longitude)`);
        await queryRunner.query(`CREATE INDEX idx_properties_uuid ON properties(uuid)`);
        await queryRunner.query(`CREATE INDEX idx_properties_slug ON properties(slug)`);

        // Composite indexes for common queries
        await queryRunner.query(`CREATE INDEX idx_properties_search ON properties(property_type, deal_type, city_id, status)`);
        await queryRunner.query(`CREATE INDEX idx_properties_price_range ON properties(total_price) WHERE status = 'active'`);
        await queryRunner.query(`CREATE INDEX idx_properties_active ON properties(status, created_at DESC) WHERE status = 'active'`);

        // Full-text search indexes
        await queryRunner.query(`CREATE INDEX idx_properties_title_search ON properties USING gin(to_tsvector('english', title))`);
        await queryRunner.query(`CREATE INDEX idx_properties_description_search ON properties USING gin(to_tsvector('english', coalesce(description_georgian, '') || ' ' || coalesce(description_english, '')))`);

        // Master data table indexes
        await queryRunner.query(`CREATE INDEX idx_cities_code ON cities(code)`);
        await queryRunner.query(`CREATE INDEX idx_cities_is_active ON cities(is_active)`);
        await queryRunner.query(`CREATE INDEX idx_features_code ON features(code)`);
        await queryRunner.query(`CREATE INDEX idx_features_is_active ON features(is_active)`);
        await queryRunner.query(`CREATE INDEX idx_advantages_code ON advantages(code)`);
        await queryRunner.query(`CREATE INDEX idx_advantages_is_active ON advantages(is_active)`);
        await queryRunner.query(`CREATE INDEX idx_furniture_appliances_code ON furniture_appliances(code)`);
        await queryRunner.query(`CREATE INDEX idx_tags_code ON tags(code)`);

        // Junction table indexes
        await queryRunner.query(`CREATE INDEX idx_property_features_property ON property_features(property_id)`);
        await queryRunner.query(`CREATE INDEX idx_property_features_feature ON property_features(feature_id)`);
        await queryRunner.query(`CREATE INDEX idx_property_advantages_property ON property_advantages(property_id)`);
        await queryRunner.query(`CREATE INDEX idx_property_advantages_advantage ON property_advantages(advantage_id)`);
        await queryRunner.query(`CREATE INDEX idx_property_furniture_property ON property_furniture_appliances(property_id)`);
        await queryRunner.query(`CREATE INDEX idx_property_furniture_item ON property_furniture_appliances(furniture_appliance_id)`);
        await queryRunner.query(`CREATE INDEX idx_property_tags_property ON property_tags(property_id)`);
        await queryRunner.query(`CREATE INDEX idx_property_tags_tag ON property_tags(tag_id)`);

        // Photos table indexes
        await queryRunner.query(`CREATE INDEX idx_property_photos_property ON property_photos(property_id, sort_order)`);
        await queryRunner.query(`CREATE INDEX idx_property_photos_primary ON property_photos(property_id) WHERE is_primary = true`);

        // Feature tables indexes
        await queryRunner.query(`CREATE INDEX idx_user_favorites_user ON user_favorites(user_id)`);
        await queryRunner.query(`CREATE INDEX idx_user_favorites_property ON user_favorites(property_id)`);
        await queryRunner.query(`CREATE INDEX idx_property_inquiries_property ON property_inquiries(property_id)`);
        await queryRunner.query(`CREATE INDEX idx_property_inquiries_user ON property_inquiries(user_id)`);
        await queryRunner.query(`CREATE INDEX idx_property_inquiries_status ON property_inquiries(status)`);

        // Analytics indexes
        await queryRunner.query(`CREATE INDEX idx_property_views_property ON property_views(property_id, created_at DESC)`);
        await queryRunner.query(`CREATE INDEX idx_property_views_user ON property_views(user_id, created_at DESC)`);
        await queryRunner.query(`CREATE INDEX idx_property_views_ip ON property_views(ip_address, created_at DESC)`);

        // =============================================================================
        // FUNCTIONS AND TRIGGERS
        // =============================================================================

        // Function to update 'updated_at' timestamp
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);

        // Apply update triggers to relevant tables
        await queryRunner.query(`
            CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_properties_updated_at 
            BEFORE UPDATE ON properties 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_cities_updated_at 
            BEFORE UPDATE ON cities 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);

        // Function to update property view count
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_property_view_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE properties 
                SET view_count = view_count + 1 
                WHERE id = NEW.property_id;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_property_views_count 
            AFTER INSERT ON property_views 
            FOR EACH ROW EXECUTE FUNCTION update_property_view_count()
        `);

        // Function to update property favorite count
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_property_favorite_count()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    UPDATE properties SET favorite_count = favorite_count + 1 WHERE id = NEW.property_id;
                    RETURN NEW;
                ELSIF TG_OP = 'DELETE' THEN
                    UPDATE properties SET favorite_count = favorite_count - 1 WHERE id = OLD.property_id;
                    RETURN OLD;
                END IF;
                RETURN NULL;
            END;
            $$ language 'plpgsql'
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_property_favorites_count_insert 
            AFTER INSERT ON user_favorites 
            FOR EACH ROW EXECUTE FUNCTION update_property_favorite_count()
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_property_favorites_count_delete 
            AFTER DELETE ON user_favorites 
            FOR EACH ROW EXECUTE FUNCTION update_property_favorite_count()
        `);

        // Function to update property inquiry count
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_property_inquiry_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE properties 
                SET inquiry_count = inquiry_count + 1 
                WHERE id = NEW.property_id;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_property_inquiry_count_trigger 
            AFTER INSERT ON property_inquiries 
            FOR EACH ROW EXECUTE FUNCTION update_property_inquiry_count()
        `);

        // Function to generate property slug
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION generate_property_slug()
            RETURNS TRIGGER AS $$
            DECLARE
                base_slug text;
                final_slug text;
                counter integer := 0;
            BEGIN
                -- Generate base slug from title
                base_slug := regexp_replace(
                    regexp_replace(
                        regexp_replace(lower(NEW.title), '[^a-z0-9\\s-]', '', 'g'),
                        '\\s+', '-', 'g'
                    ),
                    '-+', '-', 'g'
                );
                base_slug := trim(base_slug, '-');
                
                -- Ensure uniqueness
                final_slug := base_slug;
                WHILE EXISTS(SELECT 1 FROM properties WHERE slug = final_slug AND id != NEW.id) LOOP
                    counter := counter + 1;
                    final_slug := base_slug || '-' || counter;
                END LOOP;
                
                NEW.slug := final_slug;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);

        await queryRunner.query(`
            CREATE TRIGGER generate_property_slug_trigger 
            BEFORE INSERT OR UPDATE OF title ON properties 
            FOR EACH ROW EXECUTE FUNCTION generate_property_slug()
        `);

        // Function to calculate price per square meter
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION calculate_price_per_sqm()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.area > 0 AND NEW.total_price > 0 THEN
                    NEW.price_per_sqm := ROUND((NEW.total_price / NEW.area)::numeric, 2);
                ELSE
                    NEW.price_per_sqm := NULL;
                END IF;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);

        await queryRunner.query(`
            CREATE TRIGGER calculate_price_per_sqm_trigger 
            BEFORE INSERT OR UPDATE OF total_price, area ON properties 
            FOR EACH ROW EXECUTE FUNCTION calculate_price_per_sqm()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers
        await queryRunner.query(`DROP TRIGGER IF EXISTS calculate_price_per_sqm_trigger ON properties`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS generate_property_slug_trigger ON properties`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_property_inquiry_count_trigger ON property_inquiries`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_property_favorites_count_delete ON user_favorites`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_property_favorites_count_insert ON user_favorites`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_property_views_count ON property_views`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_cities_updated_at ON cities`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_properties_updated_at ON properties`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_users_updated_at ON users`);

        // Drop functions
        await queryRunner.query(`DROP FUNCTION IF EXISTS calculate_price_per_sqm()`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS generate_property_slug()`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_property_inquiry_count()`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_property_favorite_count()`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_property_view_count()`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);

        // Drop indexes (most will be dropped automatically when tables are dropped)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_property_views_ip`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_property_views_user`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_property_views_property`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_property_inquiries_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_favorites_property`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_favorites_user`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_properties_description_search`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_properties_title_search`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_properties_active`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_properties_price_range`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_properties_search`);
    }
}