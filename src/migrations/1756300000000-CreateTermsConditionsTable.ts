import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateTermsConditionsTable1756300000000 implements MigrationInterface {
    name = 'CreateTermsConditionsTable1756300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create terms_conditions table
        await queryRunner.createTable(
            new Table({
                name: "terms_conditions",
                columns: [
                    {
                        name: "id",
                        type: "serial",
                        isPrimary: true,
                    },
                    {
                        name: "sections",
                        type: "json",
                        isNullable: false,
                        default: "'[]'",
                    },
                    {
                        name: "version",
                        type: "integer",
                        default: 1,
                        isNullable: false,
                    },
                    {
                        name: "is_active",
                        type: "boolean",
                        default: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_TERMS_CONDITIONS_ACTIVE" ON "terms_conditions" ("is_active")`);
        await queryRunner.query(`CREATE INDEX "IDX_TERMS_CONDITIONS_VERSION" ON "terms_conditions" ("version")`);

        // Insert default terms and conditions using direct SQL to avoid Unicode encoding issues
        await queryRunner.query(`
            INSERT INTO terms_conditions (sections, version, is_active) VALUES (
                $1::json, $2, $3
            )
        `, [
            JSON.stringify([
                {
                    id: "1",
                    order: 0,
                    headerKa: "About Us (Georgian)",
                    headerEn: "About Us",
                    headerRu: "О нас",
                    contentKa: "Company Information in Georgian",
                    contentEn: "LLC \"Large Home 2025\" ID: 405780757\nAddress: Tbilisi, Berbuki St. N7, 2nd Building; Floor 11, Apt. N54\nEmail: info@homevend.ge\nWebsite: www.homevend.ge\n\nwww.homevend.ge is an advertising platform where users, agencies and developers can post real estate sale advertisements completely free of charge.",
                    contentRu: "ООО \"Лардж Хоум 2025\" ИД: 405780757\nАдрес: г. Тбилиси, ул. Бербуки N7, 2-й подъезд; 11 этаж, кв. N54\nЭл. почта: info@homevend.ge\nВеб-сайт: www.homevend.ge\n\nwww.homevend.ge - это платформа для размещения объявлений, где пользователи, агентства и застройщики могут совершенно бесплатно размещать объявления о продаже недвижимости."
                },
                {
                    id: "2",
                    order: 1,
                    headerKa: "Posting Advertisements (Georgian)",
                    headerEn: "Posting Advertisements",
                    headerRu: "Размещение объявлений",
                    contentKa: "Advertisement posting information in Georgian",
                    contentEn: "To post an advertisement, you need to complete a simple registration via email, Google or Facebook. Registered users, agencies and developers can post unlimited number of advertisements.",
                    contentRu: "Для размещения объявления необходимо пройти простую регистрацию через электронную почту, Google или Facebook. Зарегистрированные пользователи, агентства и застройщики могут размещать неограниченное количество объявлений."
                },
                {
                    id: "3",
                    order: 2,
                    headerKa: "Fees (Georgian)",
                    headerEn: "Fees",
                    headerRu: "Тарифы",
                    contentKa: "Fees information in Georgian",
                    contentEn: "Posting regular advertisements for sale, rental, lease, mortgage, and daily rental of real estate on the platform is free.",
                    contentRu: "Размещение обычных объявлений о продаже, аренде, лизинге, ипотеке и посуточной аренде недвижимости на платформе бесплатно."
                }
            ]),
            1,
            true
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TERMS_CONDITIONS_VERSION"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TERMS_CONDITIONS_ACTIVE"`);

        // Drop table
        await queryRunner.dropTable("terms_conditions");
    }
}