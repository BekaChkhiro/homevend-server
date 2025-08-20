import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddProjectIdToProperty1755082423000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add project_id column to properties table
    await queryRunner.addColumn('properties', new TableColumn({
      name: 'project_id',
      type: 'integer',
      isNullable: true,
    }));

    // Add foreign key constraint
    await queryRunner.createForeignKey('properties', new TableForeignKey({
      columnNames: ['project_id'],
      referencedTableName: 'projects',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('properties');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('project_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('properties', foreignKey);
    }

    // Drop column
    await queryRunner.dropColumn('properties', 'project_id');
  }
}