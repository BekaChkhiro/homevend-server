import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1734567890123 implements MigrationInterface {
    name = 'InitialMigration1734567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')
        `);
        
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "fullName" character varying(100) NOT NULL,
                "email" character varying(255) NOT NULL,
                "password" character varying(255) NOT NULL,
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_USER_EMAIL" UNIQUE ("email"),
                CONSTRAINT "PK_USER_ID" PRIMARY KEY ("id")
            )
        `);
        
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_USER_EMAIL" ON "users" ("email")
        `);
        
        await queryRunner.query(`
            CREATE TYPE "public"."properties_status_enum" AS ENUM('active', 'inactive', 'pending', 'sold')
        `);
        
        await queryRunner.query(`
            CREATE TABLE "properties" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
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
                "features" text[] NOT NULL DEFAULT '{}',
                "advantages" text[] NOT NULL DEFAULT '{}',
                "furnitureAppliances" text[] NOT NULL DEFAULT '{}',
                "tags" text[] NOT NULL DEFAULT '{}',
                "area" character varying(20) NOT NULL,
                "totalPrice" character varying(20) NOT NULL,
                "pricePerSqm" character varying(20),
                "contactName" character varying(100) NOT NULL,
                "contactPhone" character varying(20) NOT NULL,
                "descriptionGeorgian" text,
                "descriptionEnglish" text,
                "descriptionRussian" text,
                "photos" text[] NOT NULL DEFAULT '{}',
                "status" "public"."properties_status_enum" NOT NULL DEFAULT 'active',
                "viewCount" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_PROPERTY_ID" PRIMARY KEY ("id")
            )
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_PROPERTY_USER" ON "properties" ("userId")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_PROPERTY_STATUS" ON "properties" ("status")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_PROPERTY_CITY" ON "properties" ("city")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_PROPERTY_DEAL_TYPE" ON "properties" ("dealType")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_PROPERTY_PROPERTY_TYPE" ON "properties" ("propertyType")
        `);
        
        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD CONSTRAINT "FK_PROPERTY_USER" 
            FOREIGN KEY ("userId") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_PROPERTY_USER"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PROPERTY_PROPERTY_TYPE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PROPERTY_DEAL_TYPE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PROPERTY_CITY"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PROPERTY_STATUS"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PROPERTY_USER"`);
        await queryRunner.query(`DROP TABLE "properties"`);
        await queryRunner.query(`DROP TYPE "public"."properties_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USER_EMAIL"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }
}