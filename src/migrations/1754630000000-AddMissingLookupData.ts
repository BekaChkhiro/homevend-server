import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingLookupData1754630000000 implements MigrationInterface {
    name = 'AddMissingLookupData1754630000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing Features
        await queryRunner.query(`
            INSERT INTO features (code, name_georgian, name_english, icon_name, category, is_active, sort_order) VALUES
            ('tv', 'ტელევიზია', 'TV', 'tv', 'connectivity', true, 11),
            ('cargo-elevator', 'სატვირთო ლიფტი', 'Cargo Elevator', 'elevator', 'accessibility', true, 12),
            ('water', 'წყალი', 'Water', 'water-drop', 'utilities', true, 13),
            ('gas', 'გაზი', 'Gas', 'local-gas-station', 'utilities', true, 14),
            ('kitchen-appliances', 'სამზარეულოს ტექნიკა', 'Kitchen Appliances', 'kitchen', 'appliances', true, 15),
            ('phone', 'ტელეფონი', 'Phone', 'phone', 'connectivity', true, 16),
            ('electricity', 'ელექტროენერგია', 'Electricity', 'power', 'utilities', true, 17),
            ('intercom', 'დომოფონი', 'Intercom', 'doorbell', 'security', true, 18),
            ('fenced', 'შემოღობილი', 'Fenced', 'fence', 'security', true, 19),
            ('sewerage', 'კანალიზაცია', 'Sewerage', 'plumbing', 'utilities', true, 20)
            ON CONFLICT (code) DO NOTHING
        `);

        // Add missing Advantages
        await queryRunner.query(`
            INSERT INTO advantages (code, name_georgian, name_english, icon_name, category, is_active, sort_order) VALUES
            ('spa', 'სპა', 'Spa', 'spa', 'luxury', true, 11),
            ('fireplace', 'ბუხარი', 'Fireplace', 'fireplace', 'comfort', true, 12),
            ('bbq', 'მანგალი', 'BBQ', 'outdoor-grill', 'outdoor', true, 13),
            ('bar', 'ბარი', 'Bar', 'local-bar', 'entertainment', true, 14),
            ('gym', 'სავარჯიშო დარბაზი', 'Gym', 'fitness-center', 'fitness', true, 15),
            ('jacuzzi', 'ჯაკუზი', 'Jacuzzi', 'hot-tub', 'luxury', true, 16),
            ('fruit-trees', 'ხეხილის ბაღი', 'Fruit Trees', 'park', 'outdoor', true, 17),
            ('yard-lighting', 'ეზოს განათება', 'Yard Lighting', 'light', 'outdoor', true, 18),
            ('sauna', 'საუნა', 'Sauna', 'sauna', 'luxury', true, 19),
            ('alarm', 'სიგნალიზაცია', 'Alarm', 'alarm', 'security', true, 20),
            ('security', 'დაცვა', 'Security', 'security', 'security', true, 21),
            ('wine-cellar', 'ღვინის მარანი', 'Wine Cellar', 'wine-bar', 'luxury', true, 22),
            ('ventilation', 'ვენტილაცია', 'Ventilation', 'air', 'comfort', true, 23)
            ON CONFLICT (code) DO NOTHING
        `);

        // Add missing Furniture & Appliances
        await queryRunner.query(`
            INSERT INTO furniture_appliances (code, name_georgian, name_english, category, is_active, sort_order) VALUES
            ('stove-gas', 'გაზქურა', 'Gas Stove', 'kitchen', true, 11),
            ('air-conditioner', 'კონდიციონერი', 'Air Conditioner', 'appliances', true, 12),
            ('washing-machine', 'სარეცხი მანქანა', 'Washing Machine', 'appliances', true, 13),
            ('chairs', 'სკამები', 'Chairs', 'furniture', true, 14),
            ('furniture', 'ავეჯი', 'Furniture', 'furniture', true, 15),
            ('table', 'მაგიდა', 'Table', 'furniture', true, 16),
            ('stove-electric', 'ელექტროქურა', 'Electric Stove', 'kitchen', true, 17)
            ON CONFLICT (code) DO NOTHING
        `);

        console.log('✅ Missing lookup data added successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove added lookup data
        await queryRunner.query(`DELETE FROM features WHERE code IN (
            'tv', 'cargo-elevator', 'water', 'gas', 'kitchen-appliances',
            'phone', 'electricity', 'intercom', 'fenced', 'sewerage'
        )`);

        await queryRunner.query(`DELETE FROM advantages WHERE code IN (
            'spa', 'fireplace', 'bbq', 'bar', 'gym', 'jacuzzi',
            'fruit-trees', 'yard-lighting', 'sauna', 'alarm', 'security',
            'wine-cellar', 'ventilation'
        )`);

        await queryRunner.query(`DELETE FROM furniture_appliances WHERE code IN (
            'stove-gas', 'air-conditioner', 'washing-machine', 'chairs',
            'furniture', 'table', 'stove-electric'
        )`);

        console.log('🗑️ Added lookup data removed');
    }
}