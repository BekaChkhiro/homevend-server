import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDailyRentalSubcategoryToProperty1755082422000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('properties', new TableColumn({
      name: 'daily_rental_subcategory',
      type: 'varchar',
      length: '50',
      isNullable: true,
      comment: 'Daily rental subcategory: sea, mountains, villa'
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('properties', 'daily_rental_subcategory');
  }
}