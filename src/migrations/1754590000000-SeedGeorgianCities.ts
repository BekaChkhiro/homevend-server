import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedGeorgianCities1754590000000 implements MigrationInterface {
    name = 'SeedGeorgianCities1754590000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert major Georgian cities
        await queryRunner.query(`
            INSERT INTO cities (code, name_georgian, name_english, region, is_active) VALUES
            ('tbilisi', 'თბილისი', 'Tbilisi', 'Tbilisi', true),
            ('batumi', 'ბათუმი', 'Batumi', 'Adjara', true),
            ('kutaisi', 'ქუთაისი', 'Kutaisi', 'Imereti', true),
            ('rustavi', 'რუსთავი', 'Rustavi', 'Kvemo Kartli', true),
            ('gori', 'გორი', 'Gori', 'Shida Kartli', true),
            ('zugdidi', 'ზუგდიდი', 'Zugdidi', 'Samegrelo', true),
            ('poti', 'ფოთი', 'Poti', 'Samegrelo', true),
            ('kobuleti', 'ქობულეთი', 'Kobuleti', 'Adjara', true),
            ('telavi', 'თელავი', 'Telavi', 'Kakheti', true),
            ('akhaltsikhe', 'ახალციხე', 'Akhaltsikhe', 'Samtskhe-Javakheti', true),
            ('ozurgeti', 'ოზურგეთი', 'Ozurgeti', 'Guria', true),
            ('kaspi', 'კასპი', 'Kaspi', 'Shida Kartli', true),
            ('marneuli', 'მარნეული', 'Marneuli', 'Kvemo Kartli', true),
            ('gardabani', 'გარდაბანი', 'Gardabani', 'Kvemo Kartli', true),
            ('borjomi', 'ბორჯომი', 'Borjomi', 'Samtskhe-Javakheti', true),
            ('akhalkalaki', 'ახალქალაქი', 'Akhalkalaki', 'Samtskhe-Javakheti', true),
            ('senaki', 'სენაკი', 'Senaki', 'Samegrelo', true),
            ('zestaponi', 'ზესტაფონი', 'Zestaponi', 'Imereti', true),
            ('samtredia', 'სამტრედია', 'Samtredia', 'Imereti', true),
            ('khashuri', 'ხაშური', 'Khashuri', 'Shida Kartli', true),
            ('mtskheta', 'მცხეთა', 'Mtskheta', 'Mtskheta-Mtianeti', true),
            ('gudauri', 'გუდაური', 'Gudauri', 'Mtskheta-Mtianeti', true),
            ('sighnaghi', 'სიღნაღი', 'Sighnaghi', 'Kakheti', true),
            ('mestia', 'მესტია', 'Mestia', 'Samegrelo-Zemo Svaneti', true),
            ('akhmeta', 'ახმეტა', 'Akhmeta', 'Kakheti', true)
        `);

        console.log('✅ Georgian cities seeded successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the seeded cities
        await queryRunner.query(`
            DELETE FROM cities WHERE code IN (
                'tbilisi', 'batumi', 'kutaisi', 'rustavi', 'gori', 'zugdidi', 'poti', 
                'kobuleti', 'telavi', 'akhaltsikhe', 'ozurgeti', 'kaspi', 'marneuli', 
                'gardabani', 'borjomi', 'akhalkalaki', 'senaki', 'zestaponi', 
                'samtredia', 'khashuri', 'mtskheta', 'gudauri', 'sighnaghi', 'mestia', 'akhmeta'
            )
        `);

        console.log('🗑️ Georgian cities removed');
    }
}