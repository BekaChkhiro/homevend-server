import { MigrationInterface, QueryRunner } from "typeorm";
import bcrypt from "bcrypt";

export class CreateAdminUser1754487261893 implements MigrationInterface {
    name = 'CreateAdminUser1754487261893'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Hash the password using the same method as the User model
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        // Insert admin user - check if it doesn't already exist
        await queryRunner.query(
            `INSERT INTO "users" ("fullName", "email", "password", "role", "createdAt", "updatedAt") 
             SELECT 'Administrator', 'admin@homevend.ge', $1, 'admin', NOW(), NOW()
             WHERE NOT EXISTS (
                 SELECT 1 FROM "users" WHERE "email" = 'admin@homevend.ge'
             )`,
            [hashedPassword]
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove admin user
        await queryRunner.query(`DELETE FROM "users" WHERE "email" = 'admin@homevend.ge'`);
    }

}
