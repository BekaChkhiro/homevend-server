import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangePropertyIdToInteger1754485076693 implements MigrationInterface {
    name = 'ChangePropertyIdToInteger1754485076693'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing properties table and recreate with integer ID
        await queryRunner.query(`DROP TABLE IF EXISTS "properties"`);
        
        await queryRunner.query(`CREATE TABLE "properties" (
            "id" SERIAL NOT NULL,
            "userId" integer NOT NULL,
            "propertyType" character varying(50) NOT NULL,
            "dealType" character varying(20) NOT NULL,
            "city" character varying(100) NOT NULL,
            "street" character varying(200) NOT NULL,
            "streetNumber" character varying(20),
            "cadastralCode" character varying(50),
            "rooms" character varying(10),
            "bedrooms" character varying(10),
            "bathrooms" character varying(10),
            "totalFloors" character varying(10),
            "buildingStatus" character varying(50),
            "constructionYear" character varying(10),
            "condition" character varying(50),
            "projectType" character varying(50),
            "ceilingHeight" character varying(10),
            "heating" character varying(50),
            "parking" character varying(50),
            "hotWater" character varying(50),
            "buildingMaterial" character varying(50),
            "hasBalcony" boolean NOT NULL DEFAULT false,
            "balconyCount" character varying(10),
            "balconyArea" character varying(20),
            "hasPool" boolean NOT NULL DEFAULT false,
            "poolType" character varying(50),
            "hasLivingRoom" boolean NOT NULL DEFAULT false,
            "livingRoomArea" character varying(20),
            "livingRoomType" character varying(50),
            "hasLoggia" boolean NOT NULL DEFAULT false,
            "loggiaArea" character varying(20),
            "hasVeranda" boolean NOT NULL DEFAULT false,
            "verandaArea" character varying(20),
            "hasYard" boolean NOT NULL DEFAULT false,
            "yardArea" character varying(20),
            "hasStorage" boolean NOT NULL DEFAULT false,
            "storageArea" character varying(20),
            "storageType" character varying(50),
            "features" text array NOT NULL DEFAULT '{}',
            "advantages" text array NOT NULL DEFAULT '{}',
            "furnitureAppliances" text array NOT NULL DEFAULT '{}',
            "tags" text array NOT NULL DEFAULT '{}',
            "area" character varying(20) NOT NULL,
            "totalPrice" character varying(20) NOT NULL,
            "pricePerSqm" character varying(20),
            "contactName" character varying(100) NOT NULL,
            "contactPhone" character varying(20) NOT NULL,
            "descriptionGeorgian" text,
            "descriptionEnglish" text,
            "descriptionRussian" text,
            "photos" text array NOT NULL DEFAULT '{}',
            "status" character varying NOT NULL DEFAULT 'pending',
            "viewCount" integer NOT NULL DEFAULT '0',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_properties" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE INDEX "IDX_PROPERTY_USER" ON "properties" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_PROPERTY_STATUS" ON "properties" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_PROPERTY_CITY" ON "properties" ("city")`);
        await queryRunner.query(`CREATE INDEX "IDX_PROPERTY_DEAL_TYPE" ON "properties" ("dealType")`);
        await queryRunner.query(`CREATE INDEX "IDX_PROPERTY_PROPERTY_TYPE" ON "properties" ("propertyType")`);
        
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_properties_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "properties"`);
    }

}
