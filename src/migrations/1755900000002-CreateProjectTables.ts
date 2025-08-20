import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjectTables1755900000002 implements MigrationInterface {
    name = 'CreateProjectTables1755900000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create project_type_enum
        await queryRunner.query(`CREATE TYPE "project_type_enum" AS ENUM('private_house', 'apartment_building')`);
        
        // Create delivery_status_enum
        await queryRunner.query(`CREATE TYPE "delivery_status_enum" AS ENUM('completed_with_renovation', 'green_frame', 'black_frame', 'white_frame')`);
        
        // Create room_type_enum
        await queryRunner.query(`CREATE TYPE "room_type_enum" AS ENUM('studio', 'one_bedroom', 'two_bedroom', 'three_bedroom', 'four_bedroom', 'five_plus_bedroom')`);
        
        // Create projects table
        await queryRunner.query(`CREATE TABLE "projects" (
            "id" SERIAL NOT NULL,
            "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "developer_id" integer NOT NULL,
            "project_name" character varying(300) NOT NULL,
            "description" text,
            "city_id" integer NOT NULL,
            "area_id" integer,
            "street" character varying(200) NOT NULL,
            "street_number" character varying(20),
            "latitude" numeric(10,8),
            "longitude" numeric(11,8),
            "project_type" "project_type_enum" NOT NULL,
            "delivery_status" "delivery_status_enum" NOT NULL,
            "delivery_date" date,
            "number_of_buildings" integer NOT NULL,
            "total_apartments" integer NOT NULL,
            "number_of_floors" integer NOT NULL,
            "parking_spaces" integer,
            "has_grocery_store" boolean NOT NULL DEFAULT false,
            "has_bike_path" boolean NOT NULL DEFAULT false,
            "has_sports_field" boolean NOT NULL DEFAULT false,
            "has_children_area" boolean NOT NULL DEFAULT false,
            "has_square" boolean NOT NULL DEFAULT false,
            "pharmacy_300m" boolean NOT NULL DEFAULT false,
            "kindergarten_300m" boolean NOT NULL DEFAULT false,
            "school_300m" boolean NOT NULL DEFAULT false,
            "bus_stop_300m" boolean NOT NULL DEFAULT false,
            "grocery_store_300m" boolean NOT NULL DEFAULT false,
            "bike_path_300m" boolean NOT NULL DEFAULT false,
            "sports_field_300m" boolean NOT NULL DEFAULT false,
            "stadium_300m" boolean NOT NULL DEFAULT false,
            "square_300m" boolean NOT NULL DEFAULT false,
            "pharmacy_500m" boolean NOT NULL DEFAULT false,
            "kindergarten_500m" boolean NOT NULL DEFAULT false,
            "school_500m" boolean NOT NULL DEFAULT false,
            "university_500m" boolean NOT NULL DEFAULT false,
            "bus_stop_500m" boolean NOT NULL DEFAULT false,
            "grocery_store_500m" boolean NOT NULL DEFAULT false,
            "bike_path_500m" boolean NOT NULL DEFAULT false,
            "sports_field_500m" boolean NOT NULL DEFAULT false,
            "stadium_500m" boolean NOT NULL DEFAULT false,
            "square_500m" boolean NOT NULL DEFAULT false,
            "hospital_1km" boolean NOT NULL DEFAULT false,
            "security_service" boolean NOT NULL DEFAULT false,
            "has_lobby" boolean NOT NULL DEFAULT false,
            "has_concierge" boolean NOT NULL DEFAULT false,
            "video_surveillance" boolean NOT NULL DEFAULT false,
            "has_lighting" boolean NOT NULL DEFAULT false,
            "landscaping" boolean NOT NULL DEFAULT false,
            "yard_cleaning" boolean NOT NULL DEFAULT false,
            "entrance_cleaning" boolean NOT NULL DEFAULT false,
            "has_doorman" boolean NOT NULL DEFAULT false,
            "fire_system" boolean NOT NULL DEFAULT false,
            "main_door_lock" boolean NOT NULL DEFAULT false,
            "is_active" boolean NOT NULL DEFAULT true,
            "view_count" integer NOT NULL DEFAULT '0',
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_projects_uuid" UNIQUE ("uuid"),
            CONSTRAINT "PK_projects" PRIMARY KEY ("id")
        )`);

        // Create project_pricing table
        await queryRunner.query(`CREATE TABLE "project_pricing" (
            "id" SERIAL NOT NULL,
            "project_id" integer NOT NULL,
            "room_type" "room_type_enum" NOT NULL,
            "number_of_rooms" integer NOT NULL,
            "total_area" numeric(10,2) NOT NULL,
            "living_area" numeric(10,2),
            "balcony_area" numeric(10,2),
            "price_per_sqm" numeric(10,2) NOT NULL,
            "total_price_from" numeric(12,2) NOT NULL,
            "total_price_to" numeric(12,2),
            "available_units" integer NOT NULL DEFAULT '1',
            "total_units" integer NOT NULL DEFAULT '1',
            "has_balcony" boolean NOT NULL DEFAULT false,
            "has_terrace" boolean NOT NULL DEFAULT false,
            "has_loggia" boolean NOT NULL DEFAULT false,
            "floor_from" integer,
            "floor_to" integer,
            "is_available" boolean NOT NULL DEFAULT true,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "PK_project_pricing" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_project_pricing_project_room" UNIQUE ("project_id", "room_type")
        )`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_developer" FOREIGN KEY ("developer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_city" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        // Skip area constraint as areas table may not exist
        // await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_area" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_pricing" ADD CONSTRAINT "FK_project_pricing_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_projects_developer" ON "projects" ("developer_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_projects_city" ON "projects" ("city_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_projects_area" ON "projects" ("area_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_projects_type" ON "projects" ("project_type")`);
        await queryRunner.query(`CREATE INDEX "IDX_projects_status" ON "projects" ("delivery_status")`);
        await queryRunner.query(`CREATE INDEX "IDX_projects_active" ON "projects" ("is_active")`);
        await queryRunner.query(`CREATE INDEX "IDX_project_pricing_project" ON "project_pricing" ("project_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_project_pricing_room_type" ON "project_pricing" ("room_type")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_project_pricing_room_type"`);
        await queryRunner.query(`DROP INDEX "IDX_project_pricing_project"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_active"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_status"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_type"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_area"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_city"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_developer"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "project_pricing" DROP CONSTRAINT "FK_project_pricing_project"`);
        // Skip area constraint as it was not created
        // await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_area"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_city"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_developer"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "project_pricing"`);
        await queryRunner.query(`DROP TABLE "projects"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE "room_type_enum"`);
        await queryRunner.query(`DROP TYPE "delivery_status_enum"`);
        await queryRunner.query(`DROP TYPE "project_type_enum"`);
    }
}