import { useEffect } from 'react';
import { Card } from '@/types';

interface CardMetaTagsProps {
  card: Card;
}

export const CardMetaTags: React.FC<CardMetaTagsProps> = ({ card }) => {
  useEffect(() => {
    const settings = card.settings;
    
    // SEO - Title
    if (settings?.seo?.title) {
      document.title = settings.seo.title;
    } else {
      document.title = `${card.profile.name} | Klycs`;
    }

    // SEO - Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        settings?.seo?.description || card.profile.bio || `Tarjeta digital de ${card.profile.name}`
      );
    }

    // SEO - Keywords
    if (settings?.seo?.keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', settings.seo.keywords);
    }

    // SEO - Canonical URL
    if (settings?.seo?.canonicalUrl) {
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', settings.seo.canonicalUrl);
    }

    // Open Graph - Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', settings?.sharing?.ogTitle || settings?.seo?.title || card.profile.name);

    // Open Graph - Description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', settings?.sharing?.ogDescription || card.profile.bio || `Tarjeta digital de ${card.profile.name}`);

    // Open Graph - Image
    if (settings?.sharing?.ogImage || card.profile.avatar) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', settings?.sharing?.ogImage || card.profile.avatar || '');
    }

    // Open Graph - URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', window.location.href);

    // Open Graph - Type
    let ogType = document.querySelector('meta[property="og:type"]');
    if (!ogType) {
      ogType = document.createElement('meta');
      ogType.setAttribute('property', 'og:type');
      document.head.appendChild(ogType);
    }
    ogType.setAttribute('content', 'profile');

    // Twitter Card
    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.setAttribute('name', 'twitter:card');
      document.head.appendChild(twitterCard);
    }
    twitterCard.setAttribute('content', 'summary_large_image');

    // Twitter Title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', settings?.sharing?.ogTitle || settings?.seo?.title || card.profile.name);

    // Twitter Description
    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', settings?.sharing?.ogDescription || card.profile.bio || `Tarjeta digital de ${card.profile.name}`);

    // Twitter Image
    if (settings?.sharing?.ogImage || card.profile.avatar) {
      let twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('name', 'twitter:image');
        document.head.appendChild(twitterImage);
      }
      twitterImage.setAttribute('content', settings?.sharing?.ogImage || card.profile.avatar || '');
    }

    // Favicon
    if (settings?.branding?.faviconUrl) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.setAttribute('rel', 'icon');
        document.head.appendChild(favicon);
      }
      favicon.href = settings.branding.faviconUrl;
    }

    // Analytics - Google Analytics
    if (settings?.analytics?.googleAnalyticsId) {
      // Remover scripts antiguos si existen
      const oldGAScripts = document.querySelectorAll('script[data-analytics="ga"]');
      oldGAScripts.forEach(script => script.remove());

      // Agregar gtag.js
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${settings.analytics.googleAnalyticsId}`;
      gaScript.setAttribute('data-analytics', 'ga');
      document.head.appendChild(gaScript);

      // Agregar config script
      const gaConfigScript = document.createElement('script');
      gaConfigScript.setAttribute('data-analytics', 'ga');
      gaConfigScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.analytics.googleAnalyticsId}');
      `;
      document.head.appendChild(gaConfigScript);
    }

    // Analytics - Facebook Pixel
    if (settings?.analytics?.facebookPixelId) {
      // Remover scripts antiguos si existen
      const oldFBScripts = document.querySelectorAll('script[data-analytics="fb"]');
      oldFBScripts.forEach(script => script.remove());

      const fbScript = document.createElement('script');
      fbScript.setAttribute('data-analytics', 'fb');
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${settings.analytics.facebookPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);

      // Noscript fallback
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${settings.analytics.facebookPixelId}&ev=PageView&noscript=1"/>`;
      document.body.appendChild(noscript);
    }

    // Custom Scripts
    if (settings?.analytics?.customScripts) {
      const customScriptElement = document.createElement('script');
      customScriptElement.setAttribute('data-analytics', 'custom');
      customScriptElement.innerHTML = settings.analytics.customScripts;
      document.head.appendChild(customScriptElement);
    }

    // Cleanup function
    return () => {
      // Reset title
      document.title = 'Klycs';
      
      // Remove analytics scripts on unmount
      const analyticsScripts = document.querySelectorAll('script[data-analytics]');
      analyticsScripts.forEach(script => script.remove());
    };
  }, [card]);

  return null; // Este componente no renderiza nada visible
};

export default CardMetaTags;
