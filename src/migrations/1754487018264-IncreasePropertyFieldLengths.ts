import { MigrationInterface, QueryRunner } from "typeorm";

export class IncreasePropertyFieldLengths1754487018264 implements MigrationInterface {
    name = 'IncreasePropertyFieldLengths1754487018264'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Increase VARCHAR lengths for property fields to prevent "value too long" errors
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "rooms" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "bedrooms" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "bathrooms" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "totalFloors" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "buildingStatus" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "constructionYear" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "condition" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "projectType" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "ceilingHeight" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "heating" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "parking" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "hotWater" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "buildingMaterial" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "balconyCount" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "balconyArea" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "poolType" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "livingRoomArea" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "livingRoomType" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "loggiaArea" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "verandaArea" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "yardArea" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "storageArea" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "storageType" TYPE character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to original lengths
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "rooms" TYPE character varying(10)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "bedrooms" TYPE character varying(10)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "bathrooms" TYPE character varying(10)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "totalFloors" TYPE character varying(10)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "buildingStatus" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "constructionYear" TYPE character varying(10)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "condition" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "projectType" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "ceilingHeight" TYPE character varying(10)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "heating" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "parking" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "hotWater" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "buildingMaterial" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "balconyCount" TYPE character varying(10)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "balconyArea" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "poolType" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "livingRoomArea" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "livingRoomType" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "loggiaArea" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "verandaArea" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "yardArea" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "storageArea" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ALTER COLUMN "storageType" TYPE character varying(50)`);
    }

}
