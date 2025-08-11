import React from 'react';

interface StructuredDataProps {
  data: any;
  type?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ data, type = 'application/ld+json' }) => {
  return (
    <script
      type={type}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0)
      }}
    />
  );
};

// Predefined structured data components
export const OrganizationSchema: React.FC = () => {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Klycs',
    description: 'Plataforma de tarjetas de presentación digitales profesionales',
    url: 'https://klycs.app',
    logo: 'https://klycs.app/logo.png',
    foundingDate: '2024',
    sameAs: [
      'https://linkedin.com/company/klycs',
      'https://twitter.com/klycs',
      'https://instagram.com/klycs'
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@klycs.com',
        url: 'https://klycs.app/help',
        availableLanguage: ['Spanish', 'English']
      }
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ES'
    }
  };

  return <StructuredData data={organizationData} />;
};

export const WebApplicationSchema: React.FC = () => {
  const webAppData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Klycs',
    description: 'Crea tarjetas de presentación digitales modernas y profesionales. Comparte tu información de contacto de forma innovadora.',
    url: 'https://klycs.app',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    softwareVersion: '1.0.0',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      validFrom: '2024-01-01'
    },
    author: {
      '@type': 'Organization',
      name: 'Klycs',
      url: 'https://klycs.app'
    },
    screenshot: [
      'https://klycs.app/screenshots/dashboard.png',
      'https://klycs.app/screenshots/editor.png',
      'https://klycs.app/screenshots/mobile.png'
    ],
    featureList: [
      'Creación de tarjetas digitales',
      'Editor visual avanzado',
      'Analíticas en tiempo real',
      'Compartir por QR',
      'Diseño responsive',
      'Personalización completa'
    ],
    requirements: 'Internet connection required',
    installUrl: 'https://klycs.app'
  };

  return <StructuredData data={webAppData} />;
};

interface PersonSchemaProps {
  person: {
    name: string;
    jobTitle?: string;
    company?: string;
    email?: string;
    phone?: string;
    website?: string;
    image?: string;
    description?: string;
    address?: string;
    id: string;
  };
}

export const PersonSchema: React.FC<PersonSchemaProps> = ({ person }) => {
  const personData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    description: person.description,
    image: person.image,
    url: `https://klycs.app/card/${person.id}`,
    email: person.email,
    telephone: person.phone,
    jobTitle: person.jobTitle,
    worksFor: person.company ? {
      '@type': 'Organization',
      name: person.company
    } : undefined,
    address: person.address ? {
      '@type': 'PostalAddress',
      streetAddress: person.address
    } : undefined,
    sameAs: person.website ? [person.website] : undefined
  };

  return <StructuredData data={personData} />;
};

interface BusinessCardSchemaProps {
  card: {
    id: string;
    title: string;
    description?: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    views?: number;
    image?: string;
    author?: {
      name: string;
      email?: string;
    };
  };
}

export const BusinessCardSchema: React.FC<BusinessCardSchemaProps> = ({ card }) => {
  const cardData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `https://klycs.app/card/${card.id}`,
    name: card.title,
    description: card.description || `Tarjeta digital profesional de ${card.title}`,
    url: `https://klycs.app/card/${card.id}`,
    image: card.image,
    dateCreated: card.createdAt,
    dateModified: card.updatedAt,
    author: card.author ? {
      '@type': 'Person',
      name: card.author.name,
      email: card.author.email
    } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Klycs',
      url: 'https://klycs.app'
    },
    genre: 'Business Card',
    keywords: [
      'tarjeta digital',
      'networking',
      'contacto profesional',
      card.type,
      'tarjeta de presentación'
    ],
    interactionStatistic: card.views ? {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ViewAction',
      userInteractionCount: card.views
    } : undefined,
    mainEntity: {
      '@type': 'Person',
      name: card.title
    }
  };

  return <StructuredData data={cardData} />;
};

export const BreadcrumbSchema: React.FC<{ items: Array<{ name: string; url: string }> }> = ({ items }) => {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return <StructuredData data={breadcrumbData} />;
};

export const FAQSchema: React.FC<{ faqs: Array<{ question: string; answer: string }> }> = ({ faqs }) => {
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return <StructuredData data={faqData} />;
};

export const ArticleSchema: React.FC<{
  article: {
    headline: string;
    description: string;
    author: string;
    datePublished: string;
    dateModified?: string;
    image?: string;
    url: string;
  };
}> = ({ article }) => {
  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'Klycs',
      logo: {
        '@type': 'ImageObject',
        url: 'https://klycs.app/logo.png'
      }
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    image: article.image ? {
      '@type': 'ImageObject',
      url: article.image
    } : undefined,
    url: article.url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url
    }
  };

  return <StructuredData data={articleData} />;
};

// Hook for dynamic structured data
export const useStructuredData = () => {
  const addStructuredData = (data: any) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    script.id = `structured-data-${Date.now()}`;
    document.head.appendChild(script);

    return () => {
      const element = document.getElementById(script.id);
      if (element) {
        document.head.removeChild(element);
      }
    };
  };

  const addPersonSchema = (person: any) => {
    const personData = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: person.name,
      description: person.description,
      image: person.image,
      url: `https://klycs.app/card/${person.id}`,
      email: person.email,
      telephone: person.phone,
      jobTitle: person.jobTitle,
      worksFor: person.company ? {
        '@type': 'Organization',
        name: person.company
      } : undefined
    };

    return addStructuredData(personData);
  };

  const addBusinessSchema = (business: any) => {
    const businessData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: business.name,
      description: business.description,
      image: business.logo,
      url: business.website,
      telephone: business.phone,
      email: business.email,
      address: business.address ? {
        '@type': 'PostalAddress',
        streetAddress: business.address.street,
        addressLocality: business.address.city,
        postalCode: business.address.zip,
        addressCountry: business.address.country
      } : undefined,
      openingHours: business.hours,
      priceRange: business.priceRange
    };

    return addStructuredData(businessData);
  };

  return {
    addStructuredData,
    addPersonSchema,
    addBusinessSchema
  };
};