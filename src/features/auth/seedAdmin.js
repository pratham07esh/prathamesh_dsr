import { seedAdmin } from './authApi';

export const seedDefaultAdmin = async () => {
  try {
    const data = await seedAdmin();

    if (data.success) {
      console.log('✅ Default admin seeded/verified:', data.message);
      return true;
    } else {
      console.warn('⚠️ Admin seeding result:', data.message);
      return false;
    }
  } catch (error) {
    console.error('Error seeding default admin:', error);
    return false;
  }
};
