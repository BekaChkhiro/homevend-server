import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateUniversalImagesTable1756200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for entity_type
    await queryRunner.query(`
      CREATE TYPE "entity_type_enum" AS ENUM(
        'property',
        'user', 
        'agency',
        'project',
        'advertisement',
        'district',
        'developer'
      )
    `);

    await queryRunner.createTable(
      new Table({
        name: 'images',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'entity_type',
            type: 'entity_type_enum',
            comment: 'Type of entity this image belongs to',
          },
          {
            name: 'entity_id',
            type: 'integer',
            comment: 'ID of the related entity',
          },
          {
            name: 'purpose',
            type: 'varchar',
            length: '50',
            comment: 'Purpose: avatar, gallery, logo, banner, etc.',
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'original_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 's3_key',
            type: 'varchar',
            length: '500',
            comment: 'Full S3 object key',
          },
          {
            name: 'urls',
            type: 'jsonb',
            comment: 'Object with URLs for different sizes',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Width, height, size, format, etc.',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'file_size',
            type: 'integer',
          },
          {
            name: 'alt_text',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'caption',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'jsonb',
            default: "'[]'::jsonb",
          },
          {
            name: 'is_primary',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sort_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'uploaded_by',
            type: 'integer',
            isNullable: true,
            comment: 'User ID who uploaded the image',
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'For temporary images',
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
            columnNames: ['uploaded_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true
    );

    // Create indexes for performance using raw SQL
    await queryRunner.query(`
      CREATE INDEX "IDX_images_entity" ON "images" ("entity_type", "entity_id", "purpose")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_images_primary" ON "images" ("entity_type", "entity_id", "is_primary") 
      WHERE "is_primary" = true
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_images_uploaded_by" ON "images" ("uploaded_by")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_images_expires" ON "images" ("expires_at") 
      WHERE "expires_at" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_images_sort" ON "images" ("entity_type", "entity_id", "purpose", "sort_order")
    `);

    // Create trigger to update updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_images_updated_at 
      BEFORE UPDATE ON images 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS update_images_updated_at ON images');
    await queryRunner.dropTable('images');
    await queryRunner.query('DROP TYPE IF EXISTS "entity_type_enum"');
  }
}