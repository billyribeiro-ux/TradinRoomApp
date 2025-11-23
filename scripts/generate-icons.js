const sharp = require('sharp');

// Microsoft-grade icon generation
async function generateIcons() {
  console.log('🎨 Generating Microsoft-grade PWA icons...');
  
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#1a1a1a"/>
      <circle cx="256" cy="256" r="160" fill="#2563eb"/>
      <path d="M 256 150 L 310 256 L 256 256 L 256 362 L 202 256 L 256 256 Z" fill="white"/>
    </svg>
  `;
  
  // Generate 192x192
  await sharp(Buffer.from(svg))
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png');
  
  console.log('✅ Created icon-192.png');
  
  // Generate 512x512
  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile('public/icon-512.png');
  
  console.log('✅ Created icon-512.png');
  
  console.log('🎯 Microsoft-grade icons generated successfully!');
}

generateIcons().catch(console.error);
