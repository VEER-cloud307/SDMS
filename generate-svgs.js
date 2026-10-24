const fs = require('fs');
const path = require('path');

const products = [
    { file: 'ripple-cups.svg', name: 'Ripple Paper Cups', category: 'Paper Cups', color: '#8B5A2B', icon: '☕' },
    { file: 'coffee-cups.svg', name: 'Hot Coffee Cups', category: 'Paper Cups', color: '#D2691E', icon: '🥤' },
    { file: 'chai-cups.svg', name: 'Cutting Chai Cups', category: 'Tea Cups', color: '#CD853F', icon: '🫖' },
    { file: 'cold-glasses.svg', name: 'Cold Drink Glasses', category: 'Cold Cups', color: '#1E90FF', icon: '🍹' },
    { file: 'bagasse-plate.svg', name: 'Bagasse 3-Comp Plate', category: 'Eco Plates', color: '#556B2F', icon: '🍽️' },
    { file: 'paper-plate-8.svg', name: 'Round Paper Plates', category: 'Plates', color: '#4682B4', icon: '🍽️' },
    { file: 'silver-plates.svg', name: 'Silver Foil Plates', category: 'Foil Plates', color: '#708090', icon: '✨' },
    { file: 'paper-bowls.svg', name: 'Sambar Paper Bowls', category: 'Bowls', color: '#D97706', icon: '🥣' },
    { file: 'soup-bowls.svg', name: 'Soup Bagasse Bowls', category: 'Eco Bowls', color: '#059669', icon: '🍲' },
    { file: 'hinged-container.svg', name: 'Hinged Meal Box', category: 'Containers', color: '#0284C7', icon: '🍱' },
    { file: 'deli-container.svg', name: 'Deli Container & Lid', category: 'Clear Boxes', color: '#6366F1', icon: '🥡' },
    { file: 'bento-box.svg', name: '5-Comp Bento Box', category: 'Meal Trays', color: '#4F46E5', icon: '🍱' },
    { file: 'foil-roll.svg', name: 'Aluminium Foil Roll', category: 'Foil & Wrap', color: '#64748B', icon: '🌯' },
    { file: 'foil-container.svg', name: 'Aluminium Food Box', category: 'Foil Boxes', color: '#475569', icon: '🥘' },
    { file: 'wooden-spoon.svg', name: 'Wooden Spoons 160mm', category: 'Cutlery', color: '#B45309', icon: '🥄' },
    { file: 'wooden-fork.svg', name: 'Wooden Forks 160mm', category: 'Cutlery', color: '#92400E', icon: '🍴' },
    { file: 'soup-spoon.svg', name: 'Black Soup Spoons', category: 'Cutlery', color: '#1E293B', icon: '🥄' },
    { file: 'paper-straws.svg', name: 'Paper Drinking Straws', category: 'Straws', color: '#0D9488', icon: '🥤' },
    { file: 'table-napkins.svg', name: '2-Ply Table Napkins', category: 'Tissues', color: '#3B82F6', icon: '🧻' },
    { file: 'garbage-bags.svg', name: 'Black Garbage Bags', category: 'Hygiene', color: '#111827', icon: '🗑️' }
];

const targetDir = path.resolve(__dirname, 'frontend/images/products');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

products.forEach(p => {
    const gradId = `grad-${p.file.replace('.svg','')}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.color}" stop-opacity="0.15" />
      <stop offset="100%" stop-color="${p.color}" stop-opacity="0.32" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.12" />
    </filter>
  </defs>
  <rect width="400" height="300" fill="url(#${gradId})" rx="16" />
  <circle cx="200" cy="120" r="70" fill="#ffffff" filter="url(#shadow)" />
  <circle cx="200" cy="120" r="60" fill="${p.color}" opacity="0.12" />
  <text x="200" y="132" font-size="52" text-anchor="middle" dominant-baseline="central">${p.icon}</text>
  <rect x="100" y="210" width="200" height="28" rx="14" fill="#ffffff" opacity="0.95" filter="url(#shadow)" />
  <text x="200" y="228" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="700" letter-spacing="1" fill="${p.color}" text-anchor="middle">${p.category.toUpperCase()}</text>
  <text x="200" y="265" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="15" font-weight="600" fill="#1e293b" text-anchor="middle">${p.name}</text>
</svg>`;
    fs.writeFileSync(path.join(targetDir, p.file), svg, 'utf-8');
});

console.log('✅ Generated 20 high-quality SVG product illustrations successfully.');
