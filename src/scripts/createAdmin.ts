import { AppDataSource } from '../config/database.js';
import { User, UserRoleEnum } from '../models/User.js';

async function createAdminUser() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connected');

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@homevend.ge' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      await AppDataSource.destroy();
      return;
    }

    // Create new admin user
    const admin = new User();
    admin.fullName = 'System Administrator';
    admin.email = 'admin@homevend.ge';
    admin.password = 'Admin123!@#'; // Will be hashed by BeforeInsert hook
    admin.role = UserRoleEnum.ADMIN;
    admin.isVerified = true;
    admin.isActive = true;

    await userRepository.save(admin);
    console.log('Admin user created successfully');
    console.log('Email: admin@homevend.ge');
    console.log('Password: Admin123!@#');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();