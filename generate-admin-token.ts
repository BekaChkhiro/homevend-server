import { AppDataSource } from './src/config/database.js';
import { User } from './src/models/User.js';
import { generateToken } from './src/utils/jwt.js';

async function generateAdminToken() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connected successfully\n');

    const userRepo = AppDataSource.getRepository(User);

    // Find admin user
    const adminUser = await userRepo.findOne({
      where: { role: 'admin' },
    });

    if (!adminUser) {
      console.log('❌ No admin user found in database');
      await AppDataSource.destroy();
      return;
    }

    console.log('✅ Found admin user:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Role: ${adminUser.role}\n`);

    // Generate token
    const token = generateToken({ userId: adminUser.id, email: adminUser.email });

    console.log('🔑 Generated Admin Token:');
    console.log('─────────────────────────────────────────────────');
    console.log(token);
    console.log('─────────────────────────────────────────────────\n');

    console.log('📝 Usage example with curl:');
    console.log(`curl -X DELETE http://localhost:5000/api/advertisements/14 \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "Content-Type: application/json"\n`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

generateAdminToken();
