import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertPricesToUSD1756600000000 implements MigrationInterface {
    name = 'ConvertPricesToUSD1756600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Starting conversion of all prices to USD...');

        // Exchange rate: 1 USD = 2.72 GEL (approximate Georgian Lari to USD rate)
        const GEL_TO_USD_RATE = 1 / 2.72; // ~0.3676

        // Step 1: Ensure currency column exists
        const currencyColumnExists = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'properties'
            AND column_name = 'currency'
        `);

        if (currencyColumnExists.length === 0) {
            console.log('  📌 Adding currency column to properties table...');
            await queryRunner.query(`
                ALTER TABLE properties
                ADD COLUMN currency VARCHAR(3) DEFAULT 'GEL'
            `);
        }

        // Step 2: Convert all GEL prices to USD
        console.log('  💱 Converting GEL prices to USD...');

        // Get count of properties with GEL currency
        const gelPropertiesResult = await queryRunner.query(`
            SELECT COUNT(*) as count
            FROM properties
            WHERE currency = 'GEL' OR currency IS NULL
        `);
        const gelCount = parseInt(gelPropertiesResult[0].count);

        if (gelCount > 0) {
            console.log(`  📊 Found ${gelCount} properties with GEL prices`);

            // Convert total_price from GEL to USD
            await queryRunner.query(`
                UPDATE properties
                SET total_price = ROUND((total_price * ${GEL_TO_USD_RATE})::numeric, 2)
                WHERE (currency = 'GEL' OR currency IS NULL)
                AND total_price IS NOT NULL
            `);

            // Convert price_per_sqm from GEL to USD
            await queryRunner.query(`
                UPDATE properties
                SET price_per_sqm = ROUND((price_per_sqm * ${GEL_TO_USD_RATE})::numeric, 2)
                WHERE (currency = 'GEL' OR currency IS NULL)
                AND price_per_sqm IS NOT NULL
            `);

            console.log(`  ✅ Converted ${gelCount} properties from GEL to USD`);
        } else {
            console.log('  ℹ️  No GEL properties found to convert');
        }

        // Step 3: Set all currency values to USD
        console.log('  🔧 Setting all currency fields to USD...');
        await queryRunner.query(`
            UPDATE properties
            SET currency = 'USD'
        `);

        // Step 4: Update default value for currency column
        await queryRunner.query(`
            ALTER TABLE properties
            ALTER COLUMN currency SET DEFAULT 'USD'
        `);

        console.log('✅ All prices successfully converted to USD!');
        console.log(`   💵 Exchange rate used: 1 USD = 2.72 GEL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Reverting prices back to GEL...');

        // Exchange rate: 1 USD = 2.72 GEL
        const USD_TO_GEL_RATE = 2.72;

        // Convert all USD prices back to GEL
        console.log('  💱 Converting USD prices to GEL...');

        const usdPropertiesResult = await queryRunner.query(`
            SELECT COUNT(*) as count
            FROM properties
            WHERE currency = 'USD'
        `);
        const usdCount = parseInt(usdPropertiesResult[0].count);

        if (usdCount > 0) {
            console.log(`  📊 Found ${usdCount} properties with USD prices`);

            // Convert total_price from USD to GEL
            await queryRunner.query(`
                UPDATE properties
                SET total_price = ROUND((total_price * ${USD_TO_GEL_RATE})::numeric, 2)
                WHERE currency = 'USD'
                AND total_price IS NOT NULL
            `);

            // Convert price_per_sqm from USD to GEL
            await queryRunner.query(`
                UPDATE properties
                SET price_per_sqm = ROUND((price_per_sqm * ${USD_TO_GEL_RATE})::numeric, 2)
                WHERE currency = 'USD'
                AND price_per_sqm IS NOT NULL
            `);

            console.log(`  ✅ Converted ${usdCount} properties from USD to GEL`);
        }

        // Set all currency values back to GEL
        await queryRunner.query(`
            UPDATE properties
            SET currency = 'GEL'
        `);

        // Update default value for currency column
        await queryRunner.query(`
            ALTER TABLE properties
            ALTER COLUMN currency SET DEFAULT 'GEL'
        `);

        console.log('✅ All prices reverted to GEL!');
    }
}
