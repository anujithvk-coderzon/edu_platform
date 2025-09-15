const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create an admin
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@coderzon.com' },
    update: {},
    create: {
      email: 'admin@coderzon.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      isVerified: true,
    },
  });

  // Create a student
  const student = await prisma.student.upsert({
    where: { email: 'student@coderzon.com' },
    update: {},
    create: {
      email: 'student@coderzon.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      isVerified: true,
    },
  });

  // Note: Categories are now created by users dynamically, not seeded
  // This allows for better user experience and customization

  // Note: Sample courses are removed since categories are now user-generated
  // Users will create their own courses with their own categories

  // Note: Sample enrollments removed since sample courses are removed
  // Users will create their own courses and handle enrollments

  console.log('✅ Database seeded successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('Admin Login:');
  console.log('  Email: admin@coderzon.com');
  console.log('  Password: password123');
  console.log('\nStudent Login:');
  console.log('  Email: student@coderzon.com');
  console.log('  Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });