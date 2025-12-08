import { MigrationInterface, QueryRunner } from "typeorm";

  export class AddPriceNegotiable1765182100000 implements MigrationInterface {
      name = 'AddPriceNegotiable1765182100000'

      public async up(queryRunner: QueryRunner): Promise<void> {
          // დაამატე is_price_negotiable ველი
          await queryRunner.query(`
              ALTER TABLE "properties" 
              ADD COLUMN "is_price_negotiable" boolean NOT NULL DEFAULT false
          `);

          // გახადე total_price nullable (თუ ჯერ არ არის)
          await queryRunner.query(`
              ALTER TABLE "properties" 
              ALTER COLUMN "total_price" DROP NOT NULL
          `);
      }

      public async down(queryRunner: QueryRunner): Promise<void> {
          // წაშალე is_price_negotiable ველი
          await queryRunner.query(`
              ALTER TABLE "properties" 
              DROP COLUMN "is_price_negotiable"
          `);

          // დააბრუნე total_price NOT NULL (ყურადღება: თუ null მნიშვნელობები არსებობს, ეს ვერ იმუშავებს)
          await queryRunner.query(`
              ALTER TABLE "properties" 
              ALTER COLUMN "total_price" SET NOT NULL
          `);
      }
  }