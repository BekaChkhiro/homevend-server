import { AppDataSource } from '../config/database.js';
import { City } from '../models/City.js';
import { District } from '../models/District.js';

const kutaisiDistricts = [
  { nameKa: 'ბჟოლები', nameEn: 'Bzholebi', nameRu: 'Бжолеби' },
  { nameKa: 'ავტოქარხანა', nameEn: 'Avtokarkhana', nameRu: 'Автокархана' },
  { nameKa: 'ნიკეა', nameEn: 'Nikea', nameRu: 'Никеа' },
  { nameKa: 'გორა', nameEn: 'Gora', nameRu: 'Гора' },
  { nameKa: 'ჭომა', nameEn: 'Choma', nameRu: 'Чома' },
  { nameKa: 'მწვანეყვავილა', nameEn: 'Mtsvanekvavila', nameRu: 'Мцванеквавила' },
  { nameKa: 'შაომიანი', nameEn: 'Shaomiani', nameRu: 'Шаомиани' },
  { nameKa: 'მეფეთუბანი', nameEn: 'Mepetubani', nameRu: 'Мепетубани' },
  { nameKa: 'საფიჩხია', nameEn: 'Sapichkhia', nameRu: 'Сапичхия' },
  { nameKa: 'ბასტავა', nameEn: 'Bastava', nameRu: 'Бастава' },
  { nameKa: 'ბალახვანი', nameEn: 'Balakhvani', nameRu: 'Балахвани' },
  { nameKa: 'სტეკლოტარა', nameEn: 'Steklotara', nameRu: 'Стеклотара' },
  { nameKa: 'პასილოკი', nameEn: 'Pasiloki', nameRu: 'Пасилоки' },
  { nameKa: 'საღორია', nameEn: 'Saghoria', nameRu: 'Сагория' },
  { nameKa: 'ჭავჭავაძე', nameEn: 'Chavchavadze', nameRu: 'Чавчавадзе' },
  { nameKa: 'ნინოშვილი', nameEn: 'Ninoshvili', nameRu: 'Ниношвили' },
  { nameKa: 'აღმაშენებელი', nameEn: 'Agmashenebeli', nameRu: 'Агмашенебели' },
  { nameKa: 'ასათიანი', nameEn: 'Asatiani', nameRu: 'Асатиани' },
  { nameKa: 'ავანგარდი', nameEn: 'Avangardi', nameRu: 'Авангарди' },
  { nameKa: 'პლაშადკა', nameEn: 'Plashadka', nameRu: 'Плашадка' }
];

async function addKutaisiDistricts() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    const cityRepository = AppDataSource.getRepository(City);
    const districtRepository = AppDataSource.getRepository(District);
    
    // Find or create Kutaisi city
    let kutaisi = await cityRepository.findOne({
      where: [
        { nameGeorgian: 'ქუთაისი' },
        { nameEnglish: 'Kutaisi' },
        { code: 'kutaisi' }
      ]
    });
    
    if (!kutaisi) {
      console.log('Creating Kutaisi city...');
      
      const newKutaisi = cityRepository.create({
        code: 'kutaisi',
        nameGeorgian: 'ქუთაისი',
        nameEnglish: 'Kutaisi',
        nameRussian: 'Кутаиси',
        region: 'Imereti',
        isActive: true
      });
      
      kutaisi = await cityRepository.save(newKutaisi);
      console.log('✅ Kutaisi city created with ID:', kutaisi.id);
    } else {
      console.log('✅ Found Kutaisi with ID:', kutaisi.id);
    }
    
    // Add districts
    await addDistricts(kutaisi.id, districtRepository);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

async function addDistricts(cityId: number, districtRepository: any) {
  let successCount = 0;
  let skipCount = 0;
  
  for (const district of kutaisiDistricts) {
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
  console.log(`📁 Total districts for Kutaisi: ${kutaisiDistricts.length}`);
}

// Run the script
addKutaisiDistricts();