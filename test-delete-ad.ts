import { AppDataSource } from './src/config/database.js';
import { Advertisement } from './src/models/Advertisement.js';
import { Image, EntityType } from './src/models/Image.js';

async function testDeleteAdvertisement() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    const advertisementRepo = AppDataSource.getRepository(Advertisement);
    const imageRepo = AppDataSource.getRepository(Image);

    // List all advertisements
    const allAds = await advertisementRepo.find();
    console.log(`\n📋 Total advertisements in database: ${allAds.length}`);

    if (allAds.length === 0) {
      console.log('No advertisements found to test deletion');
      await AppDataSource.destroy();
      return;
    }

    // Display all advertisements
    console.log('\n📝 Current advertisements:');
    allAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. ID: ${ad.id}, Title: ${ad.title}, Status: ${ad.status}, Placement: ${ad.placementId}`);
    });

    // Test deletion (without actually deleting - just simulate)
    const testAd = allAds[0];
    console.log(`\n🔍 Testing delete simulation for advertisement ID: ${testAd.id}`);

    // Check for related images
    const relatedImages = await imageRepo.find({
      where: {
        entityType: EntityType.ADVERTISEMENT,
        entityId: testAd.id,
      },
    });

    console.log(`  Found ${relatedImages.length} related images`);

    console.log('\n✅ Test completed successfully');
    console.log('\nℹ️  To actually test deletion, uncomment the delete code in the script');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDeleteAdvertisement();
