import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMaintenanceToProjects1755600000000 implements MigrationInterface {
    name = 'AddMaintenanceToProjects1755600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("projects", new TableColumn({
            name: "maintenance",
            type: "boolean",
            default: false
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("projects", "maintenance");
    }
}