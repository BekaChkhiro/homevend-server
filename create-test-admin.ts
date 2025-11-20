import { AppDataSource } from './src/config/database.js';
import { User } from './src/models/User.js';
import bcrypt from 'bcrypt';

async function createTestAdmin() {
  try {
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);

    // Check if test admin exists
    let testAdmin = await userRepository.findOne({
      where: { email: 'testadmin@delete.test' },
    });

    if (testAdmin) {
      console.log('Test admin already exists');
    } else {
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      testAdmin = userRepository.create({
        fullName: 'Test Admin',
        email: 'testadmin@delete.test',
        password: hashedPassword,
        phoneNumber: '555-0000',
        role: 'admin',
        isVerified: true,
      });
      await userRepository.save(testAdmin);
      console.log('✓ Created test admin');
    }

    console.log('Email: testadmin@delete.test');
    console.log('Password: testpass123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

createTestAdmin();
