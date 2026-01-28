const sharp = require('sharp');

const inputPath = '/home/ubuntu/clawd/2026-01-28-02-37-26-shoggoth-profile-final.png';
const outputPath = '/home/ubuntu/clawd/shoggoth-profile-resized.png';

async function resizeImage() {
  try {
    await sharp(inputPath)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .png({
        quality: 90,
        compressionLevel: 9
      })
      .toFile(outputPath);

    const stats = require('fs').statSync(outputPath);
    console.log(`✅ Resized image saved to: ${outputPath}`);
    console.log(`📏 Size: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Error resizing image:', error);
    process.exit(1);
  }
}

resizeImage();
