interface MetaTag {
  name?: string;
  property?: string;
  content: string;
  key?: string;
}

interface SEOData {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export class SEOManager {
  private static instance: SEOManager;
  private metaTags: Map<string, HTMLMetaElement> = new Map();

  static getInstance(): SEOManager {
    if (!SEOManager.instance) {
      SEOManager.instance = new SEOManager();
    }
    return SEOManager.instance;
  }

  updatePageSEO(data: SEOData): void {
    // Update title
    this.updateTitle(data.title);

    // Update meta tags
    const metaTags: MetaTag[] = [
      { name: 'description', content: data.description },
      { name: 'keywords', content: data.keywords?.join(', ') || '' },
      { name: 'author', content: data.author || 'Klycs' },
      
      // Open Graph
      { property: 'og:title', content: data.title },
      { property: 'og:description', content: data.description },
      { property: 'og:type', content: data.type || 'website' },
      { property: 'og:site_name', content: data.siteName || 'Klycs' },
      { property: 'og:locale', content: data.locale || 'es_ES' },
      
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: data.title },
      { name: 'twitter:description', content: data.description },
      { name: 'twitter:site', content: '@klycs' },
      { name: 'twitter:creator', content: '@klycs' },
      
      // Additional SEO
      { name: 'robots', content: 'index, follow, max-image-preview:large' },
      { name: 'googlebot', content: 'index, follow' },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'theme-color', content: '#3b82f6' },
    ];

    // Add URL if provided
    if (data.url) {
      metaTags.push(
        { property: 'og:url', content: data.url },
        { name: 'canonical', content: data.url }
      );
    }

    // Add image if provided
    if (data.image) {
      metaTags.push(
        { property: 'og:image', content: data.image },
        { property: 'og:image:alt', content: data.title },
        { name: 'twitter:image', content: data.image },
        { name: 'twitter:image:alt', content: data.title }
      );
    }

    // Add timestamps if provided
    if (data.publishedTime) {
      metaTags.push({ property: 'article:published_time', content: data.publishedTime });
    }
    if (data.modifiedTime) {
      metaTags.push({ property: 'article:modified_time', content: data.modifiedTime });
    }

    // Update all meta tags
    metaTags.forEach(tag => {
      if (tag.content) {
        this.updateMetaTag(tag);
      }
    });

    // Update canonical link
    if (data.url) {
      this.updateCanonicalLink(data.url);
    }
  }

  private updateTitle(title: string): void {
    document.title = title;
    
    // Also update og:title and twitter:title if they exist
    this.updateMetaTag({ property: 'og:title', content: title });
    this.updateMetaTag({ name: 'twitter:title', content: title });
  }

  private updateMetaTag(tag: MetaTag): void {
    const key = tag.name || tag.property || '';
    const selector = tag.name ? `meta[name="${tag.name}"]` : `meta[property="${tag.property}"]`;
    
    let element = document.querySelector(selector) as HTMLMetaElement;
    
    if (!element) {
      element = document.createElement('meta');
      if (tag.name) {
        element.name = tag.name;
      } else if (tag.property) {
        element.setAttribute('property', tag.property);
      }
      document.head.appendChild(element);
    }
    
    element.content = tag.content;
    this.metaTags.set(key, element);
  }

  private updateCanonicalLink(url: string): void {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    
    link.href = url;
  }

  // Predefined SEO configurations for different pages
  updateDashboardSEO(): void {
    this.updatePageSEO({
      title: 'Dashboard - Mis Tarjetas | Klycs',
      description: 'Gestiona todas tus tarjetas de presentación digitales desde un solo lugar. Crea, edita y comparte tarjetas profesionales.',
      keywords: ['dashboard', 'tarjetas digitales', 'gestión', 'profesional'],
      type: 'website',
      url: `${window.location.origin}/dashboard`
    });
  }

  updateAnalyticsSEO(): void {
    this.updatePageSEO({
      title: 'Analíticas - Estadísticas de Tarjetas | Klycs',
      description: 'Visualiza las estadísticas de rendimiento de tus tarjetas digitales. Analiza vistas, clics y engagement.',
      keywords: ['analíticas', 'estadísticas', 'rendimiento', 'métricas'],
      type: 'website',
      url: `${window.location.origin}/analytics`
    });
  }

  updateCardSEO(card: any): void {
    const imageUrl = card.profileImage || card.backgroundImage;
    
    this.updatePageSEO({
      title: `${card.title} - Tarjeta Digital | Klycs`,
      description: card.description || `Tarjeta digital profesional de ${card.title}. Conéctate y comparte información de contacto de forma moderna.`,
      keywords: ['tarjeta digital', card.title, 'contacto', 'profesional', card.type],
      type: 'profile',
      image: imageUrl,
      url: `${window.location.origin}/card/${card.id}`,
      author: card.title,
      publishedTime: card.createdAt,
      modifiedTime: card.updatedAt
    });
  }

  updateEditorSEO(): void {
    this.updatePageSEO({
      title: 'Editor Visual - Diseña tu Tarjeta | Klycs',
      description: 'Editor visual avanzado para crear tarjetas de presentación digitales únicas. Herramientas profesionales de diseño.',
      keywords: ['editor', 'diseño', 'creación', 'visual', 'herramientas'],
      type: 'website',
      url: `${window.location.origin}/editor`
    });
  }

  updateHomeSEO(): void {
    this.updatePageSEO({
      title: 'Klycs - Plataforma de Tarjetas Digitales Profesionales',
      description: 'Crea tarjetas de presentación digitales modernas y profesionales. Comparte tu información de contacto de forma innovadora y sostenible.',
      keywords: ['tarjetas digitales', 'networking', 'profesional', 'contacto', 'sostenible', 'moderno'],
      type: 'website',
      url: window.location.origin,
      image: `${window.location.origin}/og-image.png`
    });
  }

  // JSON-LD Structured Data
  addStructuredData(data: any): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  addOrganizationSchema(): void {
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Klycs',
      description: 'Plataforma de tarjetas de presentación digitales profesionales',
      url: window.location.origin,
      logo: `${window.location.origin}/logo.png`,
      sameAs: [
        'https://linkedin.com/company/klycs',
        'https://twitter.com/klycs',
        'https://instagram.com/klycs'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@klycs.com'
      }
    };

    this.addStructuredData(organizationSchema);
  }

  addWebApplicationSchema(): void {
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Klycs',
      description: 'Plataforma de tarjetas de presentación digitales',
      url: window.location.origin,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR'
      },
      author: {
        '@type': 'Organization',
        name: 'Klycs'
      }
    };

    this.addStructuredData(webAppSchema);
  }

  addPersonSchema(card: any): void {
    const personSchema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: card.title,
      description: card.description,
      image: card.profileImage,
      url: `${window.location.origin}/card/${card.id}`,
      email: card.contactInfo?.email,
      telephone: card.contactInfo?.phone,
      jobTitle: card.position,
      worksFor: card.company ? {
        '@type': 'Organization',
        name: card.company
      } : undefined,
      address: card.contactInfo?.address ? {
        '@type': 'PostalAddress',
        streetAddress: card.contactInfo.address
      } : undefined
    };

    this.addStructuredData(personSchema);
  }

  // Sitemap generation helper
  generateSitemapUrls(): string[] {
    const baseUrl = window.location.origin;
    
    return [
      `${baseUrl}/`,
      `${baseUrl}/dashboard`,
      `${baseUrl}/analytics`,
      `${baseUrl}/editor`,
      `${baseUrl}/create`,
      // Add dynamic card URLs here if needed
    ];
  }

  // Social media sharing
  shareToSocial(platform: 'facebook' | 'twitter' | 'linkedin', data: { url: string; title: string; description: string }): void {
    const encodedUrl = encodeURIComponent(data.url);
    const encodedTitle = encodeURIComponent(data.title);
    const encodedDescription = encodeURIComponent(data.description);

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }
}

// Export singleton instance
export const seoManager = SEOManager.getInstance();

// React hook for SEO management
export const useSEO = () => {
  const updateSEO = (data: SEOData) => {
    seoManager.updatePageSEO(data);
  };

  const updateTitle = (title: string) => {
    document.title = title;
  };

  return {
    updateSEO,
    updateTitle,
    updateDashboardSEO: () => seoManager.updateDashboardSEO(),
    updateAnalyticsSEO: () => seoManager.updateAnalyticsSEO(),
    updateCardSEO: (card: any) => seoManager.updateCardSEO(card),
    updateEditorSEO: () => seoManager.updateEditorSEO(),
    updateHomeSEO: () => seoManager.updateHomeSEO(),
    shareToSocial: seoManager.shareToSocial
  };
};