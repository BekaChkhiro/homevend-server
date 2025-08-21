import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddPropertyServicesAndServicePricing1756000000001 implements MigrationInterface {
  name = 'AddPropertyServicesAndServicePricing1756000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create service_pricing table
    await queryRunner.createTable(
      new Table({
        name: 'service_pricing',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'service_type',
            type: 'enum',
            enum: ['vip', 'vip_plus', 'super_vip', 'auto_renew', 'color_separation'],
            isNullable: false,
          },
          {
            name: 'price_per_day',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'name_ka',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'name_en',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description_ka',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'description_en',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            default: "'service'",
          },
          {
            name: 'features',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create unique index on service_type
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_service_pricing_service_type" ON "service_pricing" ("service_type")
    `);

    // Create property_services table
    await queryRunner.createTable(
      new Table({
        name: 'property_services',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'property_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'service_type',
            type: 'enum',
            enum: ['vip', 'vip_plus', 'super_vip', 'auto_renew', 'color_separation'],
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'auto_renew_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'color_code',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'transaction_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['property_id'],
            referencedTableName: 'properties',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['transaction_id'],
            referencedTableName: 'transactions',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true
    );

    // Create unique index on property_id and service_type
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_property_services_property_service" ON "property_services" ("property_id", "service_type")
    `);

    // Add SERVICE_PURCHASE to transaction type enum
    await queryRunner.query(`
      ALTER TYPE "transactions_type_enum" 
      ADD VALUE 'service_purchase';
    `);

    // Insert service pricing data
    await queryRunner.query(`
      INSERT INTO service_pricing (service_type, price_per_day, name_ka, name_en, description_ka, description_en, is_active, category, features, created_at, updated_at)
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
        '["VIP ნიშანი", "პრიორიტეტული ჩვენება", "მეტი ყურადღება"]',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
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
        '["VIP+ ნიშანი", "მაღალი პრიორიტეტი", "ფასიანი ადგილი"]',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
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
        '["Super VIP ნიშანი", "უმაღლესი პრიორიტეტი", "პრემიუმ ადგილი"]',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
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
        '["ყოველდღიური განახლება", "მაღალი ხილვადობა", "ტოპ პოზიციებში", "ავტომატური მართვა"]',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
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
        '["ფერადი ბორდერი", "გამოყოფილი ვიზუალი", "მეტი ყურადღება", "პროფესიონალური გარეგნობა"]',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the property_services table
    await queryRunner.dropTable('property_services');
    
    // Drop the service_pricing table
    await queryRunner.dropTable('service_pricing');

    // Note: Cannot easily remove enum values in PostgreSQL, would need to recreate the enum
    // For rollback safety, we'll leave the enum values in place
  }
}