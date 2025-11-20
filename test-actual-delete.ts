import axios from 'axios';
import { AppDataSource } from './src/config/database.js';
import { Advertisement } from './src/models/Advertisement.js';

const API_BASE_URL = 'http://localhost:5000/api';

async function testActualDelete() {
  try {
    console.log('=== Testing Advertisement Delete API ===\n');

    // Initialize database
    await AppDataSource.initialize();
    const advertisementRepository = AppDataSource.getRepository(Advertisement);

    // Login as test admin
    console.log('1. Logging in as test admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'testadmin@delete.test',
      password: 'testpass123',
    });

    const token = loginResponse.data.data.token;
    console.log('✓ Got token\n');

    // Check ads before
    console.log('2. Advertisements before delete:');
    const adsBefore = await advertisementRepository.find({ order: { id: 'ASC' } });
    console.log(`Total: ${adsBefore.length}`);
    adsBefore.forEach(ad => console.log(`  - ID ${ad.id}: "${ad.title}"`));

    if (adsBefore.length === 0) {
      console.log('\n❌ No ads to test!');
      return;
    }

    // Delete first ad
    const adToDelete = adsBefore[0];
    console.log(`\n3. Deleting ad ID ${adToDelete.id}...`);

    const deleteResponse = await axios.delete(
      `${API_BASE_URL}/advertisements/${adToDelete.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('API Response:', deleteResponse.data);

    // Check database after
    console.log('\n4. Database after delete:');
    const adsAfter = await advertisementRepository.find({ order: { id: 'ASC' } });
    console.log(`Total: ${adsAfter.length}`);

    const stillExists = await advertisementRepository.findOne({ where: { id: adToDelete.id } });
    
    if (stillExists) {
      console.log(`\n❌ FAIL: Ad ${adToDelete.id} STILL in database!`);
    } else {
      console.log(`\n✅ SUCCESS: Ad ${adToDelete.id} deleted from database!`);
    }

    // Check API
    console.log('\n5. Checking API response...');
    const apiResponse = await axios.get(`${API_BASE_URL}/advertisements`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const apiAds = apiResponse.data.data.advertisements;
    const stillInApi = apiAds.find((ad: any) => ad.id === adToDelete.id);
    
    if (stillInApi) {
      console.log(`❌ PROBLEM: Ad ${adToDelete.id} still returned by API!`);
    } else {
      console.log(`✅ GOOD: Ad ${adToDelete.id} not in API response`);
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) console.error('Response:', error.response.data);
  } finally {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  }
}

testActualDelete();
