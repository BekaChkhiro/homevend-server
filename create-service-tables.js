const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: { rejectUnauthorized: false }
});

async function createServiceTables() {
  try {
    await client.connect();
    
    // Create service pricing table
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_pricing (
        id SERIAL PRIMARY KEY,
        service_type VARCHAR(50) NOT NULL UNIQUE,
        price_per_day DECIMAL(10,2) NOT NULL,
        name_ka VARCHAR(100) NOT NULL,
        name_en VARCHAR(100) NOT NULL,
        description_ka TEXT,
        description_en TEXT,
        is_active BOOLEAN DEFAULT true,
        category VARCHAR(50) DEFAULT 'service',
        features JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add service_purchase to transaction enum if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'service_purchase' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type_enum')) THEN
          ALTER TYPE transaction_type_enum ADD VALUE 'service_purchase';
        END IF;
      END$$;
    `);
    
    // Create property services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS property_services (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        service_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        auto_renew_enabled BOOLEAN DEFAULT false,
        color_code VARCHAR(7),
        transaction_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
        UNIQUE(property_id, service_type)
      );
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_property_services_property_id ON property_services(property_id);
      CREATE INDEX IF NOT EXISTS idx_property_services_service_type ON property_services(service_type);
      CREATE INDEX IF NOT EXISTS idx_property_services_expires_at ON property_services(expires_at);
    `);
    
    // Insert initial service pricing data
    await client.query(`
      INSERT INTO service_pricing (service_type, price_per_day, name_ka, name_en, description_ka, description_en, is_active, category, features)
      VALUES 
      (
        'vip', 
        2.00, 
        'VIP სტატუსი',
        'VIP Status',
        'VIP სტატუსი - თქვენი განცხადება გამოიყოფა VIP ნიშნით',
        'VIP Status - Your listing will be marked with VIP badge',
        true,
        'vip',
        '["VIP ნიშანი", "პრიორიტეტული ჩვენება", "მეტი ყურადღება"]'
      ),
      (
        'vip_plus', 
        3.50, 
        'VIP+ სტატუსი',
        'VIP+ Status',
        'VIP+ სტატუსი - გაუმჯობესებული VIP სტატუსი',
        'VIP+ Status - Enhanced VIP status',
        true,
        'vip',
        '["VIP+ ნიშანი", "მაღალი პრიორიტეტი", "ფასიანი ადგილი"]'
      ),
      (
        'super_vip', 
        5.00, 
        'Super VIP სტატუსი',
        'Super VIP Status',
        'Super VIP სტატუსი - ყველაზე მაღალი დონის VIP სტატუსი',
        'Super VIP Status - Highest level VIP status',
        true,
        'vip',
        '["Super VIP ნიშანი", "უმაღლესი პრიორიტეტი", "პრემიუმ ადგილი"]'
      ),
      (
        'auto_renew', 
        0.50, 
        'ავტომატური განახლება',
        'Auto Renew',
        'ავტომატური განახლება - თქვენი განცხადება ყოველ დღე განახლდება ავტომატურად',
        'Auto Renew - Your listing will be automatically renewed every day',
        true,
        'service',
        '["ყოველდღიური განახლება", "მაღალი ხილვადობა", "ტოპ პოზიციებში", "ავტომატური მართვა"]'
      ),
      (
        'color_separation',
        0.50,
        'ფერადი გამოყოფა',
        'Color Separation',
        'ფერადი გამოყოფა - თქვენი განცხადება გამოიყოფა ფერადი ბორდერით',
        'Color Separation - Your listing will stand out with colored border',
        true,
        'service',
        '["ფერადი ბორდერი", "გამოყოფილი ვიზუალი", "მეტი ყურადღება", "პროფესიონალური გარეგნობა"]'
      )
      ON CONFLICT (service_type) DO UPDATE SET
        price_per_day = EXCLUDED.price_per_day,
        name_ka = EXCLUDED.name_ka,
        name_en = EXCLUDED.name_en,
        description_ka = EXCLUDED.description_ka,
        description_en = EXCLUDED.description_en,
        features = EXCLUDED.features,
        updated_at = CURRENT_TIMESTAMP;
    `);
    
    console.log('✅ Service tables created successfully!');
    console.log('✅ Initial service pricing data inserted!');
    
  } catch (error) {
    console.error('❌ Error creating service tables:', error);
  } finally {
    await client.end();
  }
}

createServiceTables();