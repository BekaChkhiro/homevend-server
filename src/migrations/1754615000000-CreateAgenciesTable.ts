import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAgenciesTable1754615000000 implements MigrationInterface {
    name = 'CreateAgenciesTable1754615000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create agencies table
        await queryRunner.query(`
            CREATE TABLE agencies (
                id SERIAL PRIMARY KEY,
                uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
                owner_id INTEGER NOT NULL,
                
                -- Agency Information
                name VARCHAR(300) NOT NULL,
                description TEXT,
                website VARCHAR(255),
                phone VARCHAR(20),
                email VARCHAR(255),
                
                -- Address
                address VARCHAR(200),
                city_id INTEGER,
                
                -- Logo and branding
                logo_url TEXT,
                banner_url TEXT,
                
                -- Business details
                tax_number VARCHAR(50),
                license_number VARCHAR(50),
                
                -- Status
                is_verified BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                
                -- Statistics
                agent_count INTEGER DEFAULT 0,
                property_count INTEGER DEFAULT 0,
                total_sales INTEGER DEFAULT 0,
                
                -- Timestamps
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT fk_agencies_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_agencies_city FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
                CONSTRAINT valid_email_agency CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
                CONSTRAINT valid_phone_agency CHECK (phone IS NULL OR phone ~* '^[+]?[0-9\\s\\-()]{7,20}$')
            )
        `);

        // Add agency_id column to users table (for agents belonging to agencies)
        await queryRunner.query(`
            ALTER TABLE users ADD COLUMN agency_id INTEGER;
        `);
        
        await queryRunner.query(`
            ALTER TABLE users ADD CONSTRAINT fk_users_agency 
            FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;
        `);

        // Add agency_id column to properties table (for properties belonging to agencies)
        await queryRunner.query(`
            ALTER TABLE properties ADD COLUMN agency_id INTEGER;
        `);
        
        await queryRunner.query(`
            ALTER TABLE properties ADD CONSTRAINT fk_properties_agency 
            FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;
        `);

        // Create indexes for better performance
        await queryRunner.query(`
            CREATE INDEX idx_agencies_owner_id ON agencies(owner_id);
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_agencies_city_id ON agencies(city_id);
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_agencies_is_active ON agencies(is_active);
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_users_agency_id ON users(agency_id);
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_properties_agency_id ON properties(agency_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_properties_agency_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_agency_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_agencies_is_active`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_agencies_city_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_agencies_owner_id`);

        // Remove foreign key constraints and columns
        await queryRunner.query(`ALTER TABLE properties DROP CONSTRAINT IF EXISTS fk_properties_agency`);
        await queryRunner.query(`ALTER TABLE properties DROP COLUMN IF EXISTS agency_id`);
        
        await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_agency`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS agency_id`);

        // Drop agencies table
        await queryRunner.query(`DROP TABLE IF EXISTS agencies CASCADE`);
    }
}