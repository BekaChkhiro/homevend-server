import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddProjectAmenityColumns1755700000000 implements MigrationInterface {
    name = 'AddProjectAmenityColumns1755700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if columns exist before adding them
        const table = await queryRunner.getTable("projects");
        
        const columnsToAdd = [
            { name: "has_gym", type: "boolean", default: false },
            { name: "has_swimming_pool", type: "boolean", default: false },
            { name: "has_garden", type: "boolean", default: false },
            { name: "has_parking", type: "boolean", default: false },
            { name: "has_restaurant", type: "boolean", default: false },
            { name: "has_laundry", type: "boolean", default: false },
            { name: "has_storage", type: "boolean", default: false }
        ];

        for (const columnDef of columnsToAdd) {
            const existingColumn = table?.findColumnByName(columnDef.name);
            if (!existingColumn) {
                await queryRunner.addColumn("projects", new TableColumn({
                    name: columnDef.name,
                    type: columnDef.type,
                    default: columnDef.default
                }));
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("projects", "has_storage");
        await queryRunner.dropColumn("projects", "has_laundry");
        await queryRunner.dropColumn("projects", "has_restaurant");
        await queryRunner.dropColumn("projects", "has_parking");
        await queryRunner.dropColumn("projects", "has_garden");
        await queryRunner.dropColumn("projects", "has_swimming_pool");
        await queryRunner.dropColumn("projects", "has_gym");
    }
}