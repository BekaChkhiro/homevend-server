import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPricePerSqmToDistricts1755010000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('districts', new TableColumn({
      name: 'price_per_sqm',
      type: 'decimal',
      precision: 10,
      scale: 2,
      isNullable: false,
      default: 0
    }));

    // Update existing districts with sample prices
    await queryRunner.query(`
      UPDATE districts SET price_per_sqm = CASE
        WHEN name_ka = 'ცენტრალური ვაკე' THEN 2500
        WHEN name_ka = 'ზემო ვაკე' THEN 2200
        WHEN name_ka = 'ვერა' THEN 2800
        WHEN name_ka = 'სამგორი' THEN 1200
        WHEN name_ka = 'ისანი' THEN 1000
        WHEN name_ka = 'ჩუღურეთი' THEN 1500
        WHEN name_ka = 'დიდუბე' THEN 1100
        WHEN name_ka = 'ნაძალადევი' THEN 1800
        WHEN name_ka = 'საბურთალო' THEN 1600
        WHEN name_ka = 'გლდანი' THEN 900
        WHEN name_ka = 'მთაწმინდა' THEN 2600
        WHEN name_ka = 'ოქროყანა' THEN 1400
        WHEN name_ka = 'კოჯორი' THEN 1800
        WHEN name_ka = 'კიკეთი' THEN 1300
        WHEN name_ka = 'წყნეთი' THEN 2400
        ELSE 1500
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('districts', 'price_per_sqm');
  }
}