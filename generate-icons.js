const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

sizes.forEach(size => {
  const fontSize = Math.round(size * 0.45);
  const circleR = Math.round(size * 0.42);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#bg)"/>
  <circle cx="${size/2}" cy="${size/2}" r="${circleR}" fill="rgba(255,255,255,0.15)"/>
  <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="white">题</text>
</svg>`;

  fs.writeFileSync(path.join(outputDir, `icon-${size}.svg`), svg);
  
  // Also create a basic PNG placeholder (1x1 pixel green PNG, browsers will use SVG)
  // For production, use a real PNG generator
});

// Create an SVG that works as a universal icon
const universalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="215" fill="rgba(255,255,255,0.15)"/>
  <text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="Arial,sans-serif" font-size="230" font-weight="bold" fill="white">题</text>
</svg>`;

fs.writeFileSync(path.join(outputDir, 'icon.svg'), universalSvg);
console.log('Icons generated successfully!');
