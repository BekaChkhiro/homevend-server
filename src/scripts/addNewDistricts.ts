import { AppDataSource } from '../config/database.js';
import { City } from '../models/City.js';
import { District } from '../models/District.js';

const newDistricts = [
  { nameKa: 'ცენტრალური ვაკე', nameEn: 'Central Vake', nameRu: 'Центральный Ваке' },
  { nameKa: 'ზემო ვაკე', nameEn: 'Upper Vake', nameRu: 'Верхний Ваке' },
  { nameKa: 'ვერა', nameEn: 'Vera', nameRu: 'Вера' },
  { nameKa: 'სამგორი', nameEn: 'Samgori', nameRu: 'Самгори' },
  { nameKa: 'ისანი', nameEn: 'Isani', nameRu: 'Исани' },
  { nameKa: 'ჩუღურეთი', nameEn: 'Chughureti', nameRu: 'Чугурети' },
  { nameKa: 'დიდუბე', nameEn: 'Didube', nameRu: 'Дидубе' },
  { nameKa: 'ნაძალადევი', nameEn: 'Nadzaladevi', nameRu: 'Надзаладеви' },
  { nameKa: 'საბურთალო', nameEn: 'Saburtalo', nameRu: 'Сабуртало' },
  { nameKa: 'გლდანი', nameEn: 'Gldani', nameRu: 'Глдани' },
  { nameKa: 'მთაწმინდა', nameEn: 'Mtatsminda', nameRu: 'Мтацминда' },
  { nameKa: 'ოქროყანა', nameEn: 'Okrokana', nameRu: 'Окрокана' },
  { nameKa: 'კოჯორი', nameEn: 'Kojori', nameRu: 'Коджори' },
  { nameKa: 'კიკეთი', nameEn: 'Kiketi', nameRu: 'Кикети' },
  { nameKa: 'წყნეთი', nameEn: 'Tskneti', nameRu: 'Цкнети' }
];

async function addNewDistricts() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    const cityRepository = AppDataSource.getRepository(City);
    const districtRepository = AppDataSource.getRepository(District);
    
    // Find Tbilisi city (assuming these districts are for Tbilisi)
    const tbilisi = await cityRepository.findOne({
      where: [
        { nameGeorgian: 'თბილისი' },
        { nameEnglish: 'Tbilisi' },
        { code: 'tbilisi' }
      ]
    });
    
    if (!tbilisi) {
      console.error('❌ Tbilisi city not found in database');
      return;
    }
    
    console.log('✅ Found Tbilisi with ID:', tbilisi.id);
    
    // Add districts
    await addDistricts(tbilisi.id, districtRepository);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

async function addDistricts(cityId: number, districtRepository: any) {
  let successCount = 0;
  let skipCount = 0;
  
  for (const district of newDistricts) {
    try {
      // Check if district already exists
      const existing = await districtRepository.findOne({
        where: [
          { nameKa: district.nameKa },
          { nameEn: district.nameEn },
          { nameRu: district.nameRu }
        ]
      });
      
      if (existing) {
        console.log(`⏭️  Skipping: ${district.nameKa} (already exists)`);
        skipCount++;
        continue;
      }
      
      const newDistrict = districtRepository.create({
        ...district,
        cityId: cityId,
        isActive: true
      });
      
      await districtRepository.save(newDistrict);
      console.log(`✅ Added: ${district.nameKa}`);
      successCount++;
      
    } catch (error: any) {
      console.error(`❌ Failed to add ${district.nameKa}:`, error.message);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Successfully added: ${successCount} districts`);
  console.log(`⏭️  Skipped (already exist): ${skipCount} districts`);
  console.log(`📁 Total districts to add: ${newDistricts.length}`);
}

// Run the script
addNewDistricts();