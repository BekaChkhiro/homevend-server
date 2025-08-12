import { AppDataSource } from '../config/database.js';
import { City } from '../models/City.js';
import { District } from '../models/District.js';

const batumiDistricts = [
  { nameKa: 'კახაბრის უბანი', nameEn: 'Kakhaberi District', nameRu: 'Район Кахабери' },
  { nameKa: 'თამარის დასახლება', nameEn: 'Tamar Settlement', nameRu: 'Поселение Тамар' },
  { nameKa: 'ბონი-გოროდოკის უბანი', nameEn: 'Boni-Gorodok District', nameRu: 'Район Бони-Городок' },
  { nameKa: 'მახინჯაური', nameEn: 'Makhinjauri', nameRu: 'Махинджаури' },
  { nameKa: 'ძველი ბათუმის უბანი', nameEn: 'Old Batumi District', nameRu: 'Район Старый Батуми' },
  { nameKa: 'რუსთაველის უბანი', nameEn: 'Rustaveli District', nameRu: 'Район Руставели' },
  { nameKa: 'ბაგრატიონის უბანი', nameEn: 'Bagrationi District', nameRu: 'Район Багратиони' },
  { nameKa: 'აღმაშენებლის უბანი', nameEn: 'Agmashenebeli District', nameRu: 'Район Агмашенебели' },
  { nameKa: 'ჯავახიშვილის უბანი', nameEn: 'Javakhishvili District', nameRu: 'Район Джавахишвили' },
  { nameKa: 'ხიმშიაშვილის უბანი', nameEn: 'Khimshiashvili District', nameRu: 'Район Химшиашвили' },
  { nameKa: 'აეროპორტის უბანი', nameEn: 'Airport District', nameRu: 'Район Аэропорта' }
];

async function addBatumiDistricts() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    const cityRepository = AppDataSource.getRepository(City);
    const districtRepository = AppDataSource.getRepository(District);
    
    // Find or create Batumi city
    let batumi = await cityRepository.findOne({
      where: [
        { nameGeorgian: 'ბათუმი' },
        { nameEnglish: 'Batumi' },
        { code: 'batumi' }
      ]
    });
    
    if (!batumi) {
      console.log('Creating Batumi city...');
      
      const newBatumi = cityRepository.create({
        code: 'batumi',
        nameGeorgian: 'ბათუმი',
        nameEnglish: 'Batumi',
        nameRussian: 'Батуми',
        region: 'Adjara',
        isActive: true
      });
      
      batumi = await cityRepository.save(newBatumi);
      console.log('✅ Batumi city created with ID:', batumi.id);
    } else {
      console.log('✅ Found Batumi with ID:', batumi.id);
    }
    
    // Add districts
    await addDistricts(batumi.id, districtRepository);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

async function addDistricts(cityId: number, districtRepository: any) {
  let successCount = 0;
  let skipCount = 0;
  
  for (const district of batumiDistricts) {
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
  console.log(`📁 Total districts for Batumi: ${batumiDistricts.length}`);
}

// Run the script
addBatumiDistricts();