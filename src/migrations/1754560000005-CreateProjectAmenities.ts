import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateProjectAmenities1754560000005 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create project_amenities table
        await queryRunner.createTable(
            new Table({
                name: 'project_amenities',
                columns: [
                    {
                        name: 'id',
                        type: 'serial',
                        isPrimary: true
                    },
                    {
                        name: 'project_id',
                        type: 'integer',
                        isNullable: false
                    },
                    {
                        name: 'amenity_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: false
                    },
                    {
                        name: 'distance',
                        type: 'enum',
                        enum: ['on_site', 'within_300m', 'within_500m', 'within_1km'],
                        isNullable: false
                    },
                    {
                        name: 'name_georgian',
                        type: 'varchar',
                        length: '100',
                        isNullable: true
                    },
                    {
                        name: 'name_english',
                        type: 'varchar',
                        length: '100',
                        isNullable: true
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp with time zone',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp with time zone',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false
                    }
                ],
                foreignKeys: [
                    {
                        name: 'FK_project_amenities_project',
                        referencedTableName: 'projects',
                        referencedColumnNames: ['id'],
                        columnNames: ['project_id'],
                        onDelete: 'CASCADE',
                        onUpdate: 'CASCADE'
                    }
                ]
            }),
            true
        );

        // Create unique index for project_id and amenity_type using raw SQL
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_project_amenity_unique" ON "project_amenities" ("project_id", "amenity_type")`
        );

        // Create index for project_id for faster queries
        await queryRunner.query(
            `CREATE INDEX "IDX_project_amenities_project" ON "project_amenities" ("project_id")`
        );

        // Create index for amenity_type for filtering
        await queryRunner.query(
            `CREATE INDEX "IDX_project_amenities_type" ON "project_amenities" ("amenity_type")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes using raw SQL
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_project_amenities_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_project_amenities_project"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_project_amenity_unique"`);
        
        // Drop table
        await queryRunner.dropTable('project_amenities');
    }
}