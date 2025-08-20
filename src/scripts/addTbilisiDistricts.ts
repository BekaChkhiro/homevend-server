import { AppDataSource } from '../config/database.js';
import { City } from '../models/City.js';
import { District } from '../models/District.js';

const tbilisiDistricts = [
  { nameKa: 'ვაკე-საბურთალო', nameEn: 'Vake-Saburtalo', nameRu: 'Ваке-Сабуртало' },
  { nameKa: 'ვაკე', nameEn: 'Vake', nameRu: 'Ваке' },
  { nameKa: 'ვაშლიჯვარი', nameEn: 'Vashlijvari', nameRu: 'Вашлиджвари' },
  { nameKa: 'ვეძისი', nameEn: 'Vedzisi', nameRu: 'Ведзиси' },
  { nameKa: 'თხინვალი', nameEn: 'Tkhinvali', nameRu: 'Тхинвали' },
  { nameKa: 'კუს ტბა', nameEn: 'Kus Tba', nameRu: 'Кус Тба' },
  { nameKa: 'ლისი', nameEn: 'Lisi', nameRu: 'Лиси' },
  { nameKa: 'მუხათგვერდი', nameEn: 'Mukhatgverdi', nameRu: 'Мухатгверди' },
  { nameKa: 'მუხათწყარო', nameEn: 'Mukhatsqaro', nameRu: 'Мухацкаро' },
  { nameKa: 'ნუცუბიძის ფერდობი', nameEn: 'Nutsubidze Plateau', nameRu: 'Плато Нуцубидзе' },
  { nameKa: 'საბურთალო', nameEn: 'Saburtalo', nameRu: 'Сабуртало' },
  { nameKa: 'ლისის მიმდებარედ', nameEn: 'Near Lisi', nameRu: 'Около Лиси' },
  { nameKa: 'ბაგები', nameEn: 'Bagebi', nameRu: 'Багеби' },
  { nameKa: 'დიღომი 1-9', nameEn: 'Dighomi 1-9', nameRu: 'Дигоми 1-9' },
  { nameKa: 'სოფ. დიღომი', nameEn: 'Village Dighomi', nameRu: 'Село Дигоми' },
  { nameKa: 'დიღმის ჭალა', nameEn: 'Dighmis Chala', nameRu: 'Дигмис Чала' },
  { nameKa: 'ქოშიგორა', nameEn: 'Koshigora', nameRu: 'Кошигора' },
  { nameKa: 'დიდგორი', nameEn: 'Didgori', nameRu: 'Дидгори' },
  { nameKa: 'დიდი დიღომი', nameEn: 'Didi Dighomi', nameRu: 'Диди Дигоми' },
  { nameKa: 'ძველი თბილისი', nameEn: 'Old Tbilisi', nameRu: 'Старый Тбилиси' },
  { nameKa: 'აბანოთუბანი', nameEn: 'Abanotubani', nameRu: 'Абанотубани' },
  { nameKa: 'ავლაბარი', nameEn: 'Avlabari', nameRu: 'Авлабари' },
  { nameKa: 'ელია', nameEn: 'Elia', nameRu: 'Элия' },
  { nameKa: 'ვერა', nameEn: 'Vera', nameRu: 'Вера' },
  { nameKa: 'კრწანისი', nameEn: 'Krtsanisi', nameRu: 'Крцаниси' },
  { nameKa: 'მთაწმინდა', nameEn: 'Mtatsminda', nameRu: 'Мтацминда' },
  { nameKa: 'სოლოლაკი', nameEn: 'Sololaki', nameRu: 'Сололаки' },
  { nameKa: 'წავკისის ველი', nameEn: 'Tsavkisis Veli', nameRu: 'Цавкисис Вели' },
  { nameKa: 'ორთაჭალა', nameEn: 'Ortachala', nameRu: 'Ортачала' },
  { nameKa: 'დიდუბე-ჩუღურეთი', nameEn: 'Didube-Chughureti', nameRu: 'Дидубе-Чугурети' },
  { nameKa: 'დიდუბე', nameEn: 'Didube', nameRu: 'Дидубе' },
  { nameKa: 'დიღმის მასივი', nameEn: 'Dighmis Masivi', nameRu: 'Дигмис Массив' },
  { nameKa: 'კუკია', nameEn: 'Kukia', nameRu: 'Кукия' },
  { nameKa: 'ჩუღურეთი', nameEn: 'Chughureti', nameRu: 'Чугурети' },
  { nameKa: 'ივერთუბანი', nameEn: 'Ivertubani', nameRu: 'Ивертубани' },
  { nameKa: 'სვანეთის უბანი', nameEn: 'Svanetis Ubani', nameRu: 'Сванетис Убани' },
  { nameKa: 'გლდანი-ნაძალადევი', nameEn: 'Gldani-Nadzaladevi', nameRu: 'Глдани-Надзаладеви' },
  { nameKa: 'გლდანი', nameEn: 'Gldani', nameRu: 'Глдани' },
  { nameKa: 'გლდანულა', nameEn: 'Gldanula', nameRu: 'Глданула' },
  { nameKa: 'ზაჰესი', nameEn: 'Zahesi', nameRu: 'Захеси' },
  { nameKa: 'თბილისის ზღვა', nameEn: 'Tbilisi Sea', nameRu: 'Тбилисское море' },
  { nameKa: 'თემქა', nameEn: 'Temka', nameRu: 'Темка' },
  { nameKa: 'კონიაკის დას.', nameEn: 'Koniakis Das.', nameRu: 'Коньячный пос.' },
  { nameKa: 'ლოტკინი', nameEn: 'Lotkini', nameRu: 'Лоткини' },
  { nameKa: 'მუხიანი', nameEn: 'Mukhiani', nameRu: 'Мухиани' },
  { nameKa: 'ნაძალადევი', nameEn: 'Nadzaladevi', nameRu: 'Надзаладеви' },
  { nameKa: 'სან. ზონა', nameEn: 'San. Zone', nameRu: 'Сан. Зона' },
  { nameKa: 'სოფ. გლდანი', nameEn: 'Village Gldani', nameRu: 'Село Глдани' },
  { nameKa: 'ავშნიანი', nameEn: 'Avshniani', nameRu: 'Авшниани' },
  { nameKa: 'ავჭალა', nameEn: 'Avchala', nameRu: 'Авчала' },
  { nameKa: 'გიორგიწმინდას დას.', nameEn: 'Giorgitsmindas Das.', nameRu: 'Пос. Гиоргицминда' },
  { nameKa: 'ისანი-სამგორი', nameEn: 'Isani-Samgori', nameRu: 'Исани-Самгори' },
  { nameKa: 'აეროპორტის დას.', nameEn: 'Airport Settlement', nameRu: 'Аэропортовский пос.' },
  { nameKa: 'დამპალოს დას.', nameEn: 'Dampalos Das.', nameRu: 'Пос. Дампало' },
  { nameKa: 'ვაზისუბანი', nameEn: 'Vazisubani', nameRu: 'Вазисубани' },
  { nameKa: 'ვარკეთილი', nameEn: 'Varketili', nameRu: 'Варкетили' },
  { nameKa: 'ისანი', nameEn: 'Isani', nameRu: 'Исани' },
  { nameKa: 'ლილო', nameEn: 'Lilo', nameRu: 'Лило' },
  { nameKa: 'მესამე მასივი', nameEn: 'Third Massif', nameRu: 'Третий массив' },
  { nameKa: 'ნავთლუღი', nameEn: 'Navtlughi', nameRu: 'Навтлуги' },
  { nameKa: 'ორხევი', nameEn: 'Orkhevi', nameRu: 'Орхеви' },
  { nameKa: 'სამგორი', nameEn: 'Samgori', nameRu: 'Самгори' },
  { nameKa: 'ფონიჭალა', nameEn: 'Ponichala', nameRu: 'Поничала' },
  { nameKa: 'მოსკოვის გამზირი', nameEn: 'Moscow Avenue', nameRu: 'Московский проспект' },
  { nameKa: 'აფრიკა', nameEn: 'Africa', nameRu: 'Африка' },
  { nameKa: 'თბილისის შემოგარენი', nameEn: 'Tbilisi Suburbs', nameRu: 'Пригород Тбилиси' },
  { nameKa: 'წვერი', nameEn: 'Tsveri', nameRu: 'Цвери' },
  { nameKa: 'ახალდაბა', nameEn: 'Akhaldaba', nameRu: 'Ахалдаба' },
  { nameKa: 'ბეთანია', nameEn: 'Betania', nameRu: 'Бетания' },
  { nameKa: 'კაკლები', nameEn: 'Kaklebi', nameRu: 'Каклеби' },
  { nameKa: 'კიკეთი', nameEn: 'Kiketi', nameRu: 'Кикети' },
  { nameKa: 'კოჯორი', nameEn: 'Kojori', nameRu: 'Коджори' },
  { nameKa: 'ოქროყანა', nameEn: 'Okrokana', nameRu: 'Окрокана' },
  { nameKa: 'ტაბახმელა', nameEn: 'Tabakhmela', nameRu: 'Табахмела' },
  { nameKa: 'შინდისი', nameEn: 'Shindisi', nameRu: 'Шиндиси' },
  { nameKa: 'წავკისი', nameEn: 'Tsavkisi', nameRu: 'Цавкиси' },
  { nameKa: 'წყნეთი', nameEn: 'Tskneti', nameRu: 'Цкнети' },
  { nameKa: 'მსხალდიდი', nameEn: 'Mskhaldidi', nameRu: 'Мсхалдиди' },
  { nameKa: 'წოდორეთი', nameEn: 'Tsodoreti', nameRu: 'Цодорети' },
  { nameKa: 'ზემო ლისი', nameEn: 'Zemo Lisi', nameRu: 'Земо Лиси' },
  { nameKa: 'კვესეთი', nameEn: 'Kveseti', nameRu: 'Квесети' }
];

async function addTbilisiDistricts() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    const cityRepository = AppDataSource.getRepository(City);
    const districtRepository = AppDataSource.getRepository(District);
    
    // Find Tbilisi city
    const tbilisi = await cityRepository.findOne({
      where: [
        { nameGeorgian: 'თბილისი' },
        { nameEnglish: 'Tbilisi' },
        { code: 'tbilisi' }
      ]
    });
    
    if (!tbilisi) {
      console.error('❌ Tbilisi city not found in database');
      console.log('Creating Tbilisi city...');
      
      const newTbilisi = cityRepository.create({
        code: 'tbilisi',
        nameGeorgian: 'თბილისი',
        nameEnglish: 'Tbilisi',
        nameRussian: 'Тбилиси',
        region: 'Tbilisi',
        isActive: true
      });
      
      const savedCity = await cityRepository.save(newTbilisi);
      console.log('✅ Tbilisi city created with ID:', savedCity.id);
      
      // Now add districts
      await addDistricts(savedCity.id, districtRepository);
    } else {
      console.log('✅ Found Tbilisi with ID:', tbilisi.id);
      await addDistricts(tbilisi.id, districtRepository);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

async function addDistricts(cityId: number, districtRepository: any) {
  let successCount = 0;
  let skipCount = 0;
  
  for (const district of tbilisiDistricts) {
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
  console.log(`📁 Total districts for Tbilisi: ${tbilisiDistricts.length}`);
}

// Run the script
addTbilisiDistricts();