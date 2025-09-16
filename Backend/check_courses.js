const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCourses() {
  try {
    console.log('Checking all courses in the database...\n');

    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        isPublic: true,
        creatorId: true,
        creator: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    console.log(`Total courses: ${courses.length}\n`);

    courses.forEach((course, index) => {
      console.log(`Course ${index + 1}:`);
      console.log(`  Title: ${course.title}`);
      console.log(`  Status: ${course.status}`);
      console.log(`  Is Public: ${course.isPublic}`);
      console.log(`  Creator: ${course.creator?.firstName} ${course.creator?.lastName} (${course.creator?.email})`);
      console.log(`  Enrollments: ${course._count.enrollments}`);
      console.log(`  Will show in student area: ${course.status === 'PUBLISHED' && course.isPublic ? 'YES' : 'NO'}`);
      console.log('---');
    });

    // Check how many would show in student area
    const studentVisibleCourses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        isPublic: true
      },
      select: {
        title: true
      }
    });

    console.log(`\nCourses visible to students: ${studentVisibleCourses.length}`);
    studentVisibleCourses.forEach(course => {
      console.log(`  - ${course.title}`);
    });

  } catch (error) {
    console.error('Error checking courses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourses();