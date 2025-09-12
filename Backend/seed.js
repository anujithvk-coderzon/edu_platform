const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create a tutor
  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@coderzon.com' },
    update: {},
    create: {
      email: 'tutor@coderzon.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'TUTOR',
      isVerified: true,
    },
  });

  // Create a student
  const student = await prisma.user.upsert({
    where: { email: 'student@coderzon.com' },
    update: {},
    create: {
      email: 'student@coderzon.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'STUDENT',
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
  console.log('Tutor Login:');
  console.log('  Email: tutor@coderzon.com');
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