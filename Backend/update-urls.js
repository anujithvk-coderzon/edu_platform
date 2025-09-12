const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUrls() {
  try {
    console.log('🔄 Updating material URLs to use uploads root directory...');
    
    // Update all materials that have URLs with subfolders
    const result = await prisma.material.updateMany({
      where: {
        fileUrl: {
          contains: '/uploads/',
          not: {
            startsWith: '/uploads/'
          }
        }
      },
      data: {}
    });

    // Now update with specific patterns
    const patterns = [
      { from: '/uploads/videos/', to: '/uploads/' },
      { from: '/uploads/documents/', to: '/uploads/' },
      { from: '/uploads/images/', to: '/uploads/' },
      { from: '/uploads/audio/', to: '/uploads/' },
      { from: '/uploads/materials/', to: '/uploads/' },
      { from: '/uploads/general/', to: '/uploads/' },
      { from: '/uploads/thumbnails/', to: '/uploads/' },
      { from: '/uploads/avatars/', to: '/uploads/' }
    ];

    for (const pattern of patterns) {
      const materials = await prisma.material.findMany({
        where: {
          fileUrl: {
            startsWith: pattern.from
          }
        }
      });

      for (const material of materials) {
        const newUrl = material.fileUrl.replace(pattern.from, pattern.to);
        await prisma.material.update({
          where: { id: material.id },
          data: { fileUrl: newUrl }
        });
        console.log(`✅ Updated: ${material.title} -> ${newUrl}`);
      }
    }

    // Update course thumbnails
    const courses = await prisma.course.findMany({
      where: {
        thumbnail: {
          contains: '/uploads/',
          not: {
            startsWith: '/uploads/',
            endsWith: '/'
          }
        }
      }
    });

    for (const course of courses) {
      if (course.thumbnail && course.thumbnail.includes('/uploads/thumbnails/')) {
        const newThumbnail = course.thumbnail.replace('/uploads/thumbnails/', '/uploads/');
        await prisma.course.update({
          where: { id: course.id },
          data: { thumbnail: newThumbnail }
        });
        console.log(`✅ Updated course thumbnail: ${course.title} -> ${newThumbnail}`);
      }
    }

    // Update user avatars
    const users = await prisma.user.findMany({
      where: {
        avatar: {
          contains: '/uploads/avatars/'
        }
      }
    });

    for (const user of users) {
      if (user.avatar && user.avatar.includes('/uploads/avatars/')) {
        const newAvatar = user.avatar.replace('/uploads/avatars/', '/uploads/');
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar: newAvatar }
        });
        console.log(`✅ Updated user avatar: ${user.firstName} -> ${newAvatar}`);
      }
    }

    console.log('✨ All URLs updated successfully!');
  } catch (error) {
    console.error('❌ Error updating URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUrls();