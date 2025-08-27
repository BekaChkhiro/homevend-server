import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingGeorgianCities1756200000000 implements MigrationInterface {
    name = 'AddMissingGeorgianCities1756200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert additional Georgian cities that were missing from the initial seed
        await queryRunner.query(`
            INSERT INTO cities (code, name_georgian, name_english, name_russian, region, is_active) VALUES
            ('chiatura', 'ჭიათურა', 'Chiatura', 'Чиатура', 'Imereti', true),
            ('kvareli', 'ყვარელი', 'Kvareli', 'Кварели', 'Kakheti', true),
            ('bolnisi', 'ბოლნისი', 'Bolnisi', 'Болниси', 'Kvemo Kartli', true),
            ('tkibuli', 'ტყიბული', 'Tkibuli', 'Ткибули', 'Imereti', true),
            ('khoni', 'ხონი', 'Khoni', 'Хони', 'Imereti', true),
            ('tskaltubo', 'წყალტუბო', 'Tskaltubo', 'Цхалтубо', 'Imereti', true),
            ('gurjaani', 'გურჯაანი', 'Gurjaani', 'Гурджаани', 'Kakheti', true),
            ('dusheti', 'დუშეთი', 'Dusheti', 'Душети', 'Mtskheta-Mtianeti', true),
            ('kareli', 'ქარელი', 'Kareli', 'Карели', 'Shida Kartli', true),
            ('lanchkhuti', 'ლანჩხუთი', 'Lanchkhuti', 'Ланчхути', 'Guria', true),
            ('lagodekhi', 'ლაგოდეხი', 'Lagodekhi', 'Лагодехи', 'Kakheti', true),
            ('dedoplistskaro', 'დედოფლისწყარო', 'Dedoplistskaro', 'Дедоплисцкаро', 'Kakheti', true),
            ('sachkhere', 'საჩხერე', 'Sachkhere', 'Сачхере', 'Imereti', true),
            ('vale', 'ვალე', 'Vale', 'Вале', 'Samtskhe-Javakheti', true),
            ('tsnori', 'წნორი', 'Tsnori', 'Цнори', 'Kakheti', true),
            ('terjola', 'თერჯოლა', 'Terjola', 'Терджола', 'Imereti', true),
            ('tetritsqaro', 'თეთრიწყარო', 'Tetritsqaro', 'Тетрицкаро', 'Kvemo Kartli', true),
            ('abasha', 'აბაშა', 'Abasha', 'Абаша', 'Samegrelo', true),
            ('ninotsminda', 'ნინოწმინდა', 'Ninotsminda', 'Ниноцминда', 'Samtskhe-Javakheti', true),
            ('martvili', 'მარტვილი', 'Martvili', 'Мартвили', 'Samegrelo', true),
            ('tsalka', 'წალკა', 'Tsalka', 'Цалка', 'Kvemo Kartli', true),
            ('vani', 'ვანი', 'Vani', 'Вани', 'Imereti', true),
            ('khobi', 'ხობი', 'Khobi', 'Хоби', 'Samegrelo', true),
            ('dmanisi', 'დმანისი', 'Dmanisi', 'Дманиси', 'Kvemo Kartli', true),
            ('tsalenjikha', 'წალენჯიხა', 'Tsalenjikha', 'Цаленджиха', 'Samegrelo', true),
            ('baghdati', 'ბაღდათი', 'Baghdati', 'Багдати', 'Imereti', true),
            ('oni', 'ონი', 'Oni', 'Они', 'Racha-Lechkhumi and Kvemo Svaneti', true),
            ('ambrolauri', 'ამბროლაური', 'Ambrolauri', 'Амбролаури', 'Racha-Lechkhumi and Kvemo Svaneti', true),
            ('jvari', 'ჯვარი', 'Jvari', 'Джвари', 'Samegrelo', true),
            ('tsageri', 'ცაგერი', 'Tsageri', 'Цагери', 'Racha-Lechkhumi and Kvemo Svaneti', true),
            ('sagarejo', 'საგარეჯო', 'Sagarejo', 'Сагареджо', 'Kakheti', true)
            ON CONFLICT (code) DO NOTHING
        `);

        console.log('✅ Additional Georgian cities seeded successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the newly added cities
        await queryRunner.query(`
            DELETE FROM cities WHERE code IN (
                'chiatura', 'kvareli', 'bolnisi', 'tkibuli', 'khoni', 'tskaltubo',
                'gurjaani', 'dusheti', 'kareli', 'lanchkhuti', 'lagodekhi', 'dedoplistskaro',
                'sachkhere', 'vale', 'tsnori', 'terjola', 'tetritsqaro', 'abasha',
                'ninotsminda', 'martvili', 'tsalka', 'vani', 'khobi', 'dmanisi',
                'tsalenjikha', 'baghdati', 'oni', 'ambrolauri', 'jvari', 'tsageri', 'sagarejo'
            )
        `);

        console.log('🗑️ Additional Georgian cities removed');
    }
}