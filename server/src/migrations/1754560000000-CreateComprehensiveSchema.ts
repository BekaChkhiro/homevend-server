import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateComprehensiveSchema1754560000000 implements MigrationInterface {
    name = 'CreateComprehensiveSchema1754560000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable extensions
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);

        // Create enumerated types
        await queryRunner.query(`
            CREATE TYPE property_type_enum AS ENUM (
                'apartment', 'house', 'cottage', 'land', 'commercial', 'office', 'hotel'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE deal_type_enum AS ENUM (
                'sale', 'rent', 'mortgage', 'lease', 'daily'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE building_status_enum AS ENUM (
                'old-built', 'new-built', 'under-construction'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE construction_year_enum AS ENUM (
                'before-1955', '1955-2000', 'after-2000'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE condition_enum AS ENUM (
                'excellent', 'very-good', 'good', 'needs-renovation', 'under-renovation'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE property_status_enum AS ENUM (
                'draft', 'pending', 'active', 'inactive', 'sold', 'rented', 'expired'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE user_role_enum AS ENUM (
                'user', 'agent', 'admin'
            )
        `);

        // Create cities table
        await queryRunner.query(`
            CREATE TABLE cities (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name_georgian VARCHAR(100) NOT NULL,
                name_english VARCHAR(100),
                region VARCHAR(100),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create features table
        await queryRunner.query(`
            CREATE TABLE features (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name_georgian VARCHAR(100) NOT NULL,
                name_english VARCHAR(100),
                icon_name VARCHAR(50),
                category VARCHAR(50),
                is_active BOOLEAN DEFAULT true,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create advantages table
        await queryRunner.query(`
            CREATE TABLE advantages (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name_georgian VARCHAR(100) NOT NULL,
                name_english VARCHAR(100),
                icon_name VARCHAR(50),
                category VARCHAR(50),
                is_active BOOLEAN DEFAULT true,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create furniture_appliances table
        await queryRunner.query(`
            CREATE TABLE furniture_appliances (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name_georgian VARCHAR(100) NOT NULL,
                name_english VARCHAR(100),
                category VARCHAR(50),
                is_active BOOLEAN DEFAULT true,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create tags table
        await queryRunner.query(`
            CREATE TABLE tags (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name_georgian VARCHAR(100) NOT NULL,
                name_english VARCHAR(100),
                icon_name VARCHAR(50),
                color VARCHAR(7),
                is_active BOOLEAN DEFAULT true,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Drop existing users table if it exists and recreate with new schema
        await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
        await queryRunner.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
                email CITEXT UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(200) NOT NULL,
                phone VARCHAR(20),
                role user_role_enum DEFAULT 'user',
                is_verified BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                profile_image_url TEXT,
                last_login_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
                CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^[+]?[0-9\\s\\-()]{7,20}$')
            )
        `);

        // Drop existing properties table and recreate
        await queryRunner.query(`DROP TABLE IF EXISTS properties CASCADE`);
        await queryRunner.query(`
            CREATE TABLE properties (
                id SERIAL PRIMARY KEY,
                uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
                user_id INTEGER NOT NULL,
                
                -- Basic Information
                title VARCHAR(300) NOT NULL,
                property_type property_type_enum NOT NULL,
                deal_type deal_type_enum NOT NULL,
                
                -- Location
                city_id INTEGER NOT NULL,
                district VARCHAR(100),
                street VARCHAR(200) NOT NULL,
                street_number VARCHAR(20),
                postal_code VARCHAR(10),
                cadastral_code VARCHAR(50),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                
                -- Property Details
                rooms VARCHAR(10),
                bedrooms VARCHAR(10),
                bathrooms VARCHAR(10),
                total_floors VARCHAR(10),
                property_floor VARCHAR(10),
                building_status building_status_enum,
                construction_year construction_year_enum,
                condition condition_enum,
                project_type VARCHAR(100),
                ceiling_height DECIMAL(3,2),
                
                -- Infrastructure
                heating VARCHAR(100),
                parking VARCHAR(100),
                hot_water VARCHAR(100),
                building_material VARCHAR(100),
                
                -- Conditional Features
                has_balcony BOOLEAN DEFAULT false,
                balcony_count INTEGER,
                balcony_area DECIMAL(6,2),
                
                has_pool BOOLEAN DEFAULT false,
                pool_type VARCHAR(100),
                
                has_living_room BOOLEAN DEFAULT false,
                living_room_area DECIMAL(6,2),
                living_room_type VARCHAR(100),
                
                has_loggia BOOLEAN DEFAULT false,
                loggia_area DECIMAL(6,2),
                
                has_veranda BOOLEAN DEFAULT false,
                veranda_area DECIMAL(6,2),
                
                has_yard BOOLEAN DEFAULT false,
                yard_area DECIMAL(8,2),
                
                has_storage BOOLEAN DEFAULT false,
                storage_area DECIMAL(6,2),
                storage_type VARCHAR(100),
                
                -- Pricing
                area DECIMAL(8,2) NOT NULL,
                total_price DECIMAL(12,2) NOT NULL,
                price_per_sqm DECIMAL(10,2),
                currency VARCHAR(3) DEFAULT 'GEL',
                
                -- Contact Information
                contact_name VARCHAR(200) NOT NULL,
                contact_phone VARCHAR(20) NOT NULL,
                contact_email VARCHAR(255),
                
                -- Descriptions
                description_georgian TEXT,
                description_english TEXT,
                description_russian TEXT,
                
                -- SEO & Meta
                meta_title VARCHAR(300),
                meta_description TEXT,
                slug VARCHAR(300) UNIQUE,
                
                -- Status & Metrics
                status property_status_enum DEFAULT 'pending',
                view_count INTEGER DEFAULT 0,
                favorite_count INTEGER DEFAULT 0,
                inquiry_count INTEGER DEFAULT 0,
                is_featured BOOLEAN DEFAULT false,
                featured_until TIMESTAMP WITH TIME ZONE,
                
                -- Dates
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                published_at TIMESTAMP WITH TIME ZONE,
                expires_at TIMESTAMP WITH TIME ZONE,
                
                -- Constraints
                CONSTRAINT fk_properties_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_properties_city FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE RESTRICT,
                CONSTRAINT valid_area CHECK (area > 0),
                CONSTRAINT valid_total_price CHECK (total_price > 0),
                CONSTRAINT valid_price_per_sqm CHECK (price_per_sqm IS NULL OR price_per_sqm > 0),
                CONSTRAINT valid_balcony_count CHECK (balcony_count IS NULL OR balcony_count > 0),
                CONSTRAINT valid_coordinates CHECK (
                    (latitude IS NULL AND longitude IS NULL) OR 
                    (latitude IS NOT NULL AND longitude IS NOT NULL AND 
                     latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
                )
            )
        `);

        // Create property_photos table
        await queryRunner.query(`
            CREATE TABLE property_photos (
                id SERIAL PRIMARY KEY,
                property_id INTEGER NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                original_name VARCHAR(255),
                file_path TEXT NOT NULL,
                file_size INTEGER,
                mime_type VARCHAR(100),
                width INTEGER,
                height INTEGER,
                alt_text VARCHAR(255),
                is_primary BOOLEAN DEFAULT false,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_property_photos_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                CONSTRAINT valid_dimensions CHECK ((width IS NULL AND height IS NULL) OR (width > 0 AND height > 0))
            )
        `);

        // Create junction tables
        await queryRunner.query(`
            CREATE TABLE property_features (
                id SERIAL PRIMARY KEY,
                property_id INTEGER NOT NULL,
                feature_id INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_property_features_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                CONSTRAINT fk_property_features_feature FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
                CONSTRAINT unique_property_feature UNIQUE (property_id, feature_id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE property_advantages (
                id SERIAL PRIMARY KEY,
                property_id INTEGER NOT NULL,
                advantage_id INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_property_advantages_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                CONSTRAINT fk_property_advantages_advantage FOREIGN KEY (advantage_id) REFERENCES advantages(id) ON DELETE CASCADE,
                CONSTRAINT unique_property_advantage UNIQUE (property_id, advantage_id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE property_furniture_appliances (
                id SERIAL PRIMARY KEY,
                property_id INTEGER NOT NULL,
                furniture_appliance_id INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_property_furniture_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                CONSTRAINT fk_property_furniture_item FOREIGN KEY (furniture_appliance_id) REFERENCES furniture_appliances(id) ON DELETE CASCADE,
                CONSTRAINT unique_property_furniture UNIQUE (property_id, furniture_appliance_id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE property_tags (
                id SERIAL PRIMARY KEY,
                property_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_property_tags_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                CONSTRAINT fk_property_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
                CONSTRAINT unique_property_tag UNIQUE (property_id, tag_id)
            )
        `);

        // Additional feature tables
        await queryRunner.query(`
            CREATE TABLE user_favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                property_id INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_favorites_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                CONSTRAINT unique_user_favorite UNIQUE (user_id, property_id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE property_inquiries (
                id SERIAL PRIMARY KEY,
                property_id INTEGER NOT NULL,
                user_id INTEGER,
                full_name VARCHAR(200) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                message TEXT,
                inquiry_type VARCHAR(50) DEFAULT 'general',
                status VARCHAR(20) DEFAULT 'new',
                response TEXT,
                responded_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_inquiries_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                CONSTRAINT fk_inquiries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`
            CREATE TABLE property_views (
                id SERIAL PRIMARY KEY,
                property_id INTEGER NOT NULL,
                user_id INTEGER,
                ip_address INET,
                user_agent TEXT,
                referrer TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_views_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                CONSTRAINT fk_views_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS property_views CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS property_inquiries CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS user_favorites CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS property_tags CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS property_furniture_appliances CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS property_advantages CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS property_features CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS property_photos CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS properties CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS tags CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS furniture_appliances CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS advantages CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS features CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS cities CASCADE`);

        // Drop enums
        await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS property_status_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS condition_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS construction_year_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS building_status_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS deal_type_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS property_type_enum`);
    }
}