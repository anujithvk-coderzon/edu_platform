const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixVideoUrls() {
  try {
    console.log('🔍 Checking video materials with wrong URLs...');
    
    // Get all video materials
    const videoMaterials = await prisma.material.findMany({
      where: { 
        type: 'VIDEO',
        fileUrl: { startsWith: '/uploads/videos/' }
      }
    });
    
    console.log(`Found ${videoMaterials.length} video materials with /uploads/videos/ URLs`);
    
    for (const material of videoMaterials) {
      // Extract filename from the current URL
      const filename = path.basename(material.fileUrl);
      
      // Check if file exists in general folder
      const generalFilePath = path.join(__dirname, 'uploads', 'general', filename);
      
      if (fs.existsSync(generalFilePath)) {
        const newUrl = `/uploads/general/${filename}`;
        
        await prisma.material.update({
          where: { id: material.id },
          data: { fileUrl: newUrl }
        });
        
        console.log(`✅ Updated: ${material.title}`);
        console.log(`   Old: ${material.fileUrl}`);
        console.log(`   New: ${newUrl}`);
      } else {
        console.log(`❌ File not found for: ${material.title} (${filename})`);
      }
    }
    
    console.log('✨ Done fixing video URLs!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixVideoUrls();