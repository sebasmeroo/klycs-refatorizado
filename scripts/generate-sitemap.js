import { writeFileSync } from 'fs';
import { resolve } from 'path';

// Configuration
const DOMAIN = 'https://klycs.app'; // Replace with your actual domain
const OUTPUT_PATH = resolve('./public/sitemap.xml');

// Static routes
const staticRoutes = [
  {
    url: '/',
    changefreq: 'weekly',
    priority: '1.0',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/dashboard',
    changefreq: 'daily',
    priority: '0.9',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/analytics',
    changefreq: 'weekly',
    priority: '0.7',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/editor',
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/create',
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/about',
    changefreq: 'monthly',
    priority: '0.6',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/pricing',
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/help',
    changefreq: 'monthly',
    priority: '0.5',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/privacy',
    changefreq: 'yearly',
    priority: '0.3',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/terms',
    changefreq: 'yearly',
    priority: '0.3',
    lastmod: new Date().toISOString().split('T')[0]
  }
];

// Generate dynamic routes (this would typically fetch from your database)
async function getDynamicRoutes() {
  try {
    // In a real implementation, you would fetch public cards from your database
    // For now, we'll return an empty array
    const publicCards = [];
    
    return publicCards.map(card => ({
      url: `/card/${card.id}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: card.updatedAt || new Date().toISOString().split('T')[0]
    }));
  } catch (error) {
    console.warn('Failed to fetch dynamic routes:', error);
    return [];
  }
}

// Generate robots.txt
function generateRobotsTxt() {
  const robotsContent = `User-agent: *
Allow: /
Allow: /card/*

Disallow: /dashboard
Disallow: /editor
Disallow: /admin
Disallow: /api/
Disallow: /*.json$

Sitemap: ${DOMAIN}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Specific rules for major search engines
User-agent: Googlebot
Allow: /
Allow: /card/*
Disallow: /dashboard
Disallow: /editor

User-agent: Bingbot
Allow: /
Allow: /card/*
Disallow: /dashboard
Disallow: /editor

User-agent: Slurp
Allow: /
Allow: /card/*
Disallow: /dashboard
Disallow: /editor`;

  writeFileSync(resolve('./public/robots.txt'), robotsContent);
  console.log('✅ robots.txt generated successfully');
}

// Generate sitemap XML
async function generateSitemap() {
  try {
    console.log('🔄 Generating sitemap...');
    
    // Get dynamic routes
    const dynamicRoutes = await getDynamicRoutes();
    
    // Combine all routes
    const allRoutes = [...staticRoutes, ...dynamicRoutes];
    
    // Generate XML content
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allRoutes.map(route => `  <url>
    <loc>${DOMAIN}${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // Write sitemap file
    writeFileSync(OUTPUT_PATH, xmlContent);
    
    console.log(`✅ Sitemap generated successfully with ${allRoutes.length} URLs`);
    console.log(`📁 Output: ${OUTPUT_PATH}`);
    
    // Also generate robots.txt
    generateRobotsTxt();
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Generate sitemap index for multiple sitemaps (useful for large sites)
function generateSitemapIndex() {
  const sitemaps = [
    {
      url: `${DOMAIN}/sitemap.xml`,
      lastmod: new Date().toISOString().split('T')[0]
    }
    // Add more sitemaps here if needed (e.g., sitemap-cards.xml, sitemap-blog.xml)
  ];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${sitemap.url}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  writeFileSync(resolve('./public/sitemap-index.xml'), xmlContent);
  console.log('✅ Sitemap index generated successfully');
}

// Generate structured data for static pages
function generateStaticStructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Klycs',
    description: 'Plataforma de tarjetas de presentación digitales profesionales',
    url: DOMAIN,
    logo: `${DOMAIN}/logo.png`,
    sameAs: [
      'https://linkedin.com/company/klycs',
      'https://twitter.com/klycs',
      'https://instagram.com/klycs'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@klycs.com',
      url: `${DOMAIN}/help`
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ES'
    }
  };

  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Klycs',
    description: 'Crea tarjetas de presentación digitales modernas y profesionales',
    url: DOMAIN,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    softwareVersion: '1.0.0',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock'
    },
    author: {
      '@type': 'Organization',
      name: 'Klycs'
    },
    screenshots: [
      `${DOMAIN}/screenshots/dashboard.png`,
      `${DOMAIN}/screenshots/editor.png`
    ]
  };

  // Save structured data files
  writeFileSync(
    resolve('./public/structured-data/organization.json'),
    JSON.stringify(organizationSchema, null, 2)
  );

  writeFileSync(
    resolve('./public/structured-data/webapp.json'),
    JSON.stringify(webApplicationSchema, null, 2)
  );

  console.log('✅ Static structured data generated successfully');
}

// Main execution
async function main() {
  console.log('🚀 Starting sitemap generation...');
  
  try {
    await generateSitemap();
    generateSitemapIndex();
    generateStaticStructuredData();
    
    console.log('\n✅ All SEO files generated successfully!');
    console.log('\nGenerated files:');
    console.log('📄 /public/sitemap.xml');
    console.log('📄 /public/sitemap-index.xml');
    console.log('📄 /public/robots.txt');
    console.log('📄 /public/structured-data/organization.json');
    console.log('📄 /public/structured-data/webapp.json');
    
  } catch (error) {
    console.error('❌ Failed to generate SEO files:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateSitemap, generateRobotsTxt, generateSitemapIndex };