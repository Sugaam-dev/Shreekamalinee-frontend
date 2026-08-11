import fs from 'fs';
import path from 'path';

const domain = 'https://shreekamalinee.com';
const staticUrls = [
  '',
  '/about',
  '/product',
  '/contact',
  '/payment'
];

const productRanges = [
  { start: 100, end: 149 }, // Sarees
  { start: 200, end: 265 }, // Dress Material
  { start: 300, end: 314 }, // Readymade
  { start: 400, end: 414 }  // Accessories
];

const urls = [];
const today = new Date().toISOString().split('T')[0];

// Static URLs
staticUrls.forEach(url => {
  const isHome = url === '';
  const isShop = url === '/product';
  urls.push(`  <url>
    <loc>${domain}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${isHome || isShop ? 'daily' : 'monthly'}</changefreq>
    <priority>${isHome ? '1.0' : isShop ? '0.9' : '0.7'}</priority>
  </url>`);
});

// Product URLs
productRanges.forEach(range => {
  for (let id = range.start; id <= range.end; id++) {
    urls.push(`  <url>
    <loc>${domain}/details/${id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
// Ensure public directory exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(outputPath, sitemap, 'utf8');
console.log('Sitemap generated successfully at:', outputPath);
