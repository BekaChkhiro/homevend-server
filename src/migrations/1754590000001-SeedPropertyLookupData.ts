import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedPropertyLookupData1754590000001 implements MigrationInterface {
    name = 'SeedPropertyLookupData1754590000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Seed Features
        await queryRunner.query(`
            INSERT INTO features (code, name_georgian, name_english, icon_name, category, is_active, sort_order) VALUES
            ('air_conditioning', 'კონდიციონერი', 'Air Conditioning', 'ac-unit', 'comfort', true, 1),
            ('heating_system', 'გათბობის სისტემა', 'Heating System', 'thermostat', 'comfort', true, 2),
            ('internet', 'ინტერნეტი', 'Internet', 'wifi', 'connectivity', true, 3),
            ('cable_tv', 'კაბელური ტელევიზია', 'Cable TV', 'tv', 'connectivity', true, 4),
            ('security_system', 'უსაფრთხოების სისტემა', 'Security System', 'security', 'security', true, 5),
            ('elevator', 'ლიფტი', 'Elevator', 'elevator', 'accessibility', true, 6),
            ('parking_space', 'პარკინგის ადგილი', 'Parking Space', 'local-parking', 'parking', true, 7),
            ('garage', 'გარაჟი', 'Garage', 'garage', 'parking', true, 8),
            ('garden', 'ბაღი', 'Garden', 'park', 'outdoor', true, 9),
            ('terrace', 'ტერასა', 'Terrace', 'deck', 'outdoor', true, 10)
        `);

        // Seed Advantages
        await queryRunner.query(`
            INSERT INTO advantages (code, name_georgian, name_english, icon_name, category, is_active, sort_order) VALUES
            ('sea_view', 'ზღვის ხედი', 'Sea View', 'waves', 'view', true, 1),
            ('mountain_view', 'მთის ხედი', 'Mountain View', 'terrain', 'view', true, 2),
            ('city_center', 'ქალაქის ცენტრი', 'City Center', 'location-city', 'location', true, 3),
            ('metro_nearby', 'მეტროს სიახლოვე', 'Metro Nearby', 'train', 'transport', true, 4),
            ('school_nearby', 'სკოლის სიახლოვე', 'School Nearby', 'school', 'education', true, 5),
            ('hospital_nearby', 'ჰოსპიტლის სიახლოვე', 'Hospital Nearby', 'local-hospital', 'healthcare', true, 6),
            ('shopping_center', 'საყიდლების ცენტრი', 'Shopping Center', 'shopping-cart', 'shopping', true, 7),
            ('quiet_area', 'მშვიდი რაიონი', 'Quiet Area', 'volume-off', 'environment', true, 8),
            ('new_building', 'ახალი შენობა', 'New Building', 'home-work', 'building', true, 9),
            ('renovated', 'გარემონტებული', 'Renovated', 'build', 'condition', true, 10)
        `);

        // Seed Furniture & Appliances
        await queryRunner.query(`
            INSERT INTO furniture_appliances (code, name_georgian, name_english, category, is_active, sort_order) VALUES
            ('refrigerator', 'მაცივარი', 'Refrigerator', 'kitchen', true, 1),
            ('washing_machine', 'სარეცხი მანქანა', 'Washing Machine', 'appliances', true, 2),
            ('dishwasher', 'ჭურჭლის სარეცხი', 'Dishwasher', 'kitchen', true, 3),
            ('microwave', 'მიკროტალღური', 'Microwave', 'kitchen', true, 4),
            ('oven', 'ღუმელი', 'Oven', 'kitchen', true, 5),
            ('bed', 'საწოლი', 'Bed', 'bedroom', true, 6),
            ('wardrobe', 'კარადა', 'Wardrobe', 'bedroom', true, 7),
            ('sofa', 'დივანი', 'Sofa', 'living_room', true, 8),
            ('dining_table', 'სასადილო მაგიდა', 'Dining Table', 'dining', true, 9),
            ('tv', 'ტელევიზორი', 'TV', 'electronics', true, 10)
        `);

        // Seed Tags
        await queryRunner.query(`
            INSERT INTO tags (code, name_georgian, name_english, icon_name, color, is_active, sort_order) VALUES
            ('luxury', 'ლუქსი', 'Luxury', 'star', '#FFD700', true, 1),
            ('new', 'ახალი', 'New', 'fiber-new', '#4CAF50', true, 2),
            ('furnished', 'ავეჯით', 'Furnished', 'chair', '#2196F3', true, 3),
            ('pet_friendly', 'შინაური ცხოველების მოყვარული', 'Pet Friendly', 'pets', '#FF9800', true, 4),
            ('investment', 'ინვესტიცია', 'Investment', 'trending-up', '#9C27B0', true, 5),
            ('reduced_price', 'შემცირებული ფასი', 'Reduced Price', 'local-offer', '#F44336', true, 6),
            ('urgent_sale', 'სასწრაფო გაყიდვა', 'Urgent Sale', 'schedule', '#FF5722', true, 7),
            ('exclusive', 'ექსკლუზიური', 'Exclusive', 'workspace-premium', '#E91E63', true, 8),
            ('family_friendly', 'ოჯახისთვის შესაფერისი', 'Family Friendly', 'family-restroom', '#8BC34A', true, 9),
            ('student_friendly', 'სტუდენტებისთვის', 'Student Friendly', 'school', '#00BCD4', true, 10)
        `);

        console.log('✅ Property lookup data seeded successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove seeded lookup data
        await queryRunner.query(`DELETE FROM features WHERE code IN (
            'air_conditioning', 'heating_system', 'internet', 'cable_tv', 'security_system',
            'elevator', 'parking_space', 'garage', 'garden', 'terrace'
        )`);

        await queryRunner.query(`DELETE FROM advantages WHERE code IN (
            'sea_view', 'mountain_view', 'city_center', 'metro_nearby', 'school_nearby',
            'hospital_nearby', 'shopping_center', 'quiet_area', 'new_building', 'renovated'
        )`);

        await queryRunner.query(`DELETE FROM furniture_appliances WHERE code IN (
            'refrigerator', 'washing_machine', 'dishwasher', 'microwave', 'oven',
            'bed', 'wardrobe', 'sofa', 'dining_table', 'tv'
        )`);

        await queryRunner.query(`DELETE FROM tags WHERE code IN (
            'luxury', 'new', 'furnished', 'pet_friendly', 'investment',
            'reduced_price', 'urgent_sale', 'exclusive', 'family_friendly', 'student_friendly'
        )`);

        console.log('🗑️ Property lookup data removed');
    }
}