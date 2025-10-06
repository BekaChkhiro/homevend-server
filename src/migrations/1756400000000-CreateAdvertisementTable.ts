import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAdvertisementTable1756400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create advertisements table
    await queryRunner.createTable(
      new Table({
        name: 'advertisements',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'advertiser',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'placement_id',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'start_date',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'target_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'active', 'expired', 'paused'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'views',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'clicks',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'uploaded_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Add foreign key for uploaded_by
    await queryRunner.createForeignKey(
      'advertisements',
      new TableForeignKey({
        columnNames: ['uploaded_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
    );

    // Add indexes for performance
    await queryRunner.createIndex(
      'advertisements',
      new TableIndex({
        name: 'idx_advertisements_placement_status_dates',
        columnNames: ['placement_id', 'status', 'start_date', 'end_date'],
      })
    );

    await queryRunner.createIndex(
      'advertisements',
      new TableIndex({
        name: 'idx_advertisements_status_dates',
        columnNames: ['status', 'start_date', 'end_date'],
      })
    );

    await queryRunner.createIndex(
      'advertisements',
      new TableIndex({
        name: 'idx_advertisements_placement_id',
        columnNames: ['placement_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('advertisements', 'idx_advertisements_placement_id');
    await queryRunner.dropIndex('advertisements', 'idx_advertisements_status_dates');
    await queryRunner.dropIndex('advertisements', 'idx_advertisements_placement_status_dates');

    // Drop foreign key
    const table = await queryRunner.getTable('advertisements');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('uploaded_by') !== -1
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('advertisements', foreignKey);
      }
    }

    // Drop table
    await queryRunner.dropTable('advertisements');
  }
}
