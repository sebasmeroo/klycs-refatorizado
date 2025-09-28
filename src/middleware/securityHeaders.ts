/**
 * Middleware de headers de seguridad para proteger la aplicación
 * contra vulnerabilidades comunes como XSS, clickjacking, etc.
 */

export interface SecurityHeadersConfig {
  // Content Security Policy
  csp: {
    enabled: boolean;
    directives: {
      defaultSrc: string[];
      scriptSrc: string[];
      styleSrc: string[];
      imgSrc: string[];
      connectSrc: string[];
      fontSrc: string[];
      objectSrc: string[];
      mediaSrc: string[];
      frameSrc: string[];
      childSrc: string[];
      workerSrc: string[];
      manifestSrc: string[];
      formAction: string[];
      frameAncestors: string[];
      baseUri: string[];
      upgradeInsecureRequests: boolean;
      blockAllMixedContent: boolean;
    };
    reportUri?: string;
    reportOnly: boolean;
  };
  
  // HTTP Strict Transport Security
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  
  // X-Frame-Options
  frameOptions: {
    enabled: boolean;
    policy: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    uri?: string;
  };
  
  // X-Content-Type-Options
  contentTypeOptions: {
    enabled: boolean;
    nosniff: boolean;
  };
  
  // X-XSS-Protection
  xssProtection: {
    enabled: boolean;
    mode: '0' | '1' | '1; mode=block';
  };
  
  // Referrer Policy
  referrerPolicy: {
    enabled: boolean;
    policy: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  };
  
  // Permissions Policy (Feature Policy)
  permissionsPolicy: {
    enabled: boolean;
    directives: {
      camera: string[];
      microphone: string[];
      geolocation: string[];
      payment: string[];
      usb: string[];
      midi: string[];
      notifications: string[];
      push: string[];
      speaker: string[];
      vibrate: string[];
      fullscreen: string[];
      syncXhr: string[];
    };
  };
  
  // Cross-Origin Policies
  crossOrigin: {
    embedderPolicy: {
      enabled: boolean;
      policy: 'unsafe-none' | 'require-corp' | 'credentialless';
    };
    openerPolicy: {
      enabled: boolean;
      policy: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin';
    };
    resourcePolicy: {
      enabled: boolean;
      policy: 'same-site' | 'same-origin' | 'cross-origin';
    };
  };
}

class SecurityHeadersService {
  private config: SecurityHeadersConfig;

  constructor() {
    this.config = this.getDefaultConfig();
  }

  /**
   * Configuración predeterminada de headers de seguridad
   */
  private getDefaultConfig(): SecurityHeadersConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = process.env.VITE_APP_DOMAIN || 'localhost:3000';
    const protocol = isProduction ? 'https' : 'http';

    return {
      csp: {
        enabled: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Necesario para Vite en desarrollo
            "'unsafe-eval'", // Necesario para desarrollo (remover en producción)
            'https://js.stripe.com',
            'https://maps.googleapis.com',
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com',
            'https://accounts.google.com',
            'https://apis.google.com',
            'https://firebase.googleapis.com',
            'https://www.gstatic.com',
            'https://unpkg.com',
            'https://cdn.jsdelivr.net',
            ...(isProduction ? [] : ["'unsafe-eval'", "'unsafe-inline'"])
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Necesario para styled-components y CSS-in-JS
            'https://fonts.googleapis.com',
            'https://cdnjs.cloudflare.com'
          ],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https:',
            'https://images.unsplash.com',
            'https://via.placeholder.com',
            'https://firebasestorage.googleapis.com',
            'https://lh3.googleusercontent.com'
          ],
          connectSrc: [
            "'self'",
            'https://api.stripe.com',
            'https://firestore.googleapis.com',
            'https://identitytoolkit.googleapis.com',
            'https://securetoken.googleapis.com',
            'https://firebase.googleapis.com',
            'https://firebasestorage.googleapis.com',
            'https://region1.google-analytics.com',
            'https://www.google-analytics.com',
            'https://analytics.google.com',
            'https://api.sendgrid.com',
            'https://api.twilio.com',
            'https://graph.microsoft.com',
            'https://login.microsoftonline.com',
            'https://accounts.google.com',
            'https://unpkg.com',
            'https://cdn.jsdelivr.net',
            ...(isProduction ? [] : ['ws://localhost:*', 'http://localhost:*'])
          ],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
            'https://cdnjs.cloudflare.com'
          ],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", 'https:', 'data:', 'blob:'],
          frameSrc: [
            "'self'",
            'https://js.stripe.com',
            'https://hooks.stripe.com',
            'https://accounts.google.com',
            'https://calendar.google.com',
            'https://outlook.live.com'
          ],
          childSrc: ["'self'", 'blob:'],
          workerSrc: ["'self'", 'blob:'],
          manifestSrc: ["'self'"],
          formAction: ["'self'", 'https://api.stripe.com'],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          upgradeInsecureRequests: isProduction,
          blockAllMixedContent: isProduction
        },
        reportUri: isProduction ? `${protocol}://${domain}/api/csp-report` : undefined,
        reportOnly: !isProduction
      },
      
      hsts: {
        enabled: isProduction,
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true
      },
      
      frameOptions: {
        enabled: true,
        policy: 'DENY'
      },
      
      contentTypeOptions: {
        enabled: true,
        nosniff: true
      },
      
      xssProtection: {
        enabled: true,
        mode: '1; mode=block'
      },
      
      referrerPolicy: {
        enabled: true,
        policy: 'strict-origin-when-cross-origin'
      },
      
      permissionsPolicy: {
        enabled: true,
        directives: {
          camera: ["'none'"],
          microphone: ["'none'"],
          geolocation: ["'none'"],
          payment: ["'self'", 'https://js.stripe.com'],
          usb: ["'none'"],
          midi: ["'none'"],
          notifications: ["'self'"],
          push: ["'self'"],
          speaker: ["'self'"],
          vibrate: ["'none'"],
          fullscreen: ["'self'"],
          syncXhr: ["'none'"]
        }
      },
      
      crossOrigin: {
        embedderPolicy: {
          enabled: false, // Siempre deshabilitar para evitar problemas con Firebase
          policy: 'unsafe-none'
        },
        openerPolicy: {
          enabled: true,
          policy: 'same-origin-allow-popups'
        },
        resourcePolicy: {
          enabled: false, // Siempre deshabilitar para Firebase Storage
          policy: 'cross-origin'
        }
      }
    };
  }

  /**
   * Generar headers de seguridad como objeto
   */
  generateHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (this.config.csp.enabled) {
      const cspDirectives: string[] = [];
      const directives = this.config.csp.directives;

      if (directives.defaultSrc.length > 0) {
        cspDirectives.push(`default-src ${directives.defaultSrc.join(' ')}`);
      }
      if (directives.scriptSrc.length > 0) {
        cspDirectives.push(`script-src ${directives.scriptSrc.join(' ')}`);
      }
      if (directives.styleSrc.length > 0) {
        cspDirectives.push(`style-src ${directives.styleSrc.join(' ')}`);
      }
      if (directives.imgSrc.length > 0) {
        cspDirectives.push(`img-src ${directives.imgSrc.join(' ')}`);
      }
      if (directives.connectSrc.length > 0) {
        cspDirectives.push(`connect-src ${directives.connectSrc.join(' ')}`);
      }
      if (directives.fontSrc.length > 0) {
        cspDirectives.push(`font-src ${directives.fontSrc.join(' ')}`);
      }
      if (directives.objectSrc.length > 0) {
        cspDirectives.push(`object-src ${directives.objectSrc.join(' ')}`);
      }
      if (directives.mediaSrc.length > 0) {
        cspDirectives.push(`media-src ${directives.mediaSrc.join(' ')}`);
      }
      if (directives.frameSrc.length > 0) {
        cspDirectives.push(`frame-src ${directives.frameSrc.join(' ')}`);
      }
      if (directives.childSrc.length > 0) {
        cspDirectives.push(`child-src ${directives.childSrc.join(' ')}`);
      }
      if (directives.workerSrc.length > 0) {
        cspDirectives.push(`worker-src ${directives.workerSrc.join(' ')}`);
      }
      if (directives.manifestSrc.length > 0) {
        cspDirectives.push(`manifest-src ${directives.manifestSrc.join(' ')}`);
      }
      if (directives.formAction.length > 0) {
        cspDirectives.push(`form-action ${directives.formAction.join(' ')}`);
      }
      if (directives.frameAncestors.length > 0) {
        cspDirectives.push(`frame-ancestors ${directives.frameAncestors.join(' ')}`);
      }
      if (directives.baseUri.length > 0) {
        cspDirectives.push(`base-uri ${directives.baseUri.join(' ')}`);
      }
      if (directives.upgradeInsecureRequests) {
        cspDirectives.push('upgrade-insecure-requests');
      }
      if (directives.blockAllMixedContent) {
        cspDirectives.push('block-all-mixed-content');
      }
      if (this.config.csp.reportUri) {
        cspDirectives.push(`report-uri ${this.config.csp.reportUri}`);
      }

      const headerName = this.config.csp.reportOnly 
        ? 'Content-Security-Policy-Report-Only' 
        : 'Content-Security-Policy';
      
      headers[headerName] = cspDirectives.join('; ');
    }

    // HTTP Strict Transport Security
    if (this.config.hsts.enabled) {
      let hstsValue = `max-age=${this.config.hsts.maxAge}`;
      if (this.config.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (this.config.hsts.preload) {
        hstsValue += '; preload';
      }
      headers['Strict-Transport-Security'] = hstsValue;
    }

    // X-Frame-Options
    if (this.config.frameOptions.enabled) {
      let frameOptionsValue = this.config.frameOptions.policy;
      if (this.config.frameOptions.policy === 'ALLOW-FROM' && this.config.frameOptions.uri) {
        frameOptionsValue += ` ${this.config.frameOptions.uri}`;
      }
      headers['X-Frame-Options'] = frameOptionsValue;
    }

    // X-Content-Type-Options
    if (this.config.contentTypeOptions.enabled && this.config.contentTypeOptions.nosniff) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // X-XSS-Protection
    if (this.config.xssProtection.enabled) {
      headers['X-XSS-Protection'] = this.config.xssProtection.mode;
    }

    // Referrer Policy
    if (this.config.referrerPolicy.enabled) {
      headers['Referrer-Policy'] = this.config.referrerPolicy.policy;
    }

    // Permissions Policy
    if (this.config.permissionsPolicy.enabled) {
      const permissionDirectives: string[] = [];
      const permissions = this.config.permissionsPolicy.directives;

      Object.entries(permissions).forEach(([permission, allowlist]) => {
        if (allowlist.length > 0) {
          // Formato correcto para Permissions Policy
          const values = allowlist.map(value => value === "'self'" ? 'self' : value).join(' ');
          permissionDirectives.push(`${permission}=${values}`);
        }
      });

      if (permissionDirectives.length > 0) {
        headers['Permissions-Policy'] = permissionDirectives.join(', ');
      }
    }

    // Cross-Origin Policies - Configuración para Firebase Storage
    // NUNCA aplicar COEP restrictivo que bloquea Firebase Storage
    if (this.config.crossOrigin.embedderPolicy.enabled) {
      // Solo aplicar si es unsafe-none para evitar bloqueos
      if (this.config.crossOrigin.embedderPolicy.policy === 'unsafe-none') {
        headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none';
      }
    }

    // Configurar COOP de forma permisiva
    headers['Cross-Origin-Opener-Policy'] = 'unsafe-none';

    // Configurar CORP de forma permisiva para Firebase Storage
    headers['Cross-Origin-Resource-Policy'] = 'cross-origin';

    // Headers adicionales para seguridad
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';
    headers['X-DNS-Prefetch-Control'] = 'off';
    headers['Expect-CT'] = 'enforce, max-age=86400';

    return headers;
  }

  /**
   * Generar meta tags para CSP y otros headers
   */
  generateMetaTags(): string[] {
    const metaTags: string[] = [];

    // CSP como meta tag (fallback para entornos que no soportan headers HTTP)
    if (this.config.csp.enabled && !this.config.csp.reportOnly) {
      const cspValue = this.generateHeaders()['Content-Security-Policy'];
      if (cspValue) {
        metaTags.push(`<meta http-equiv="Content-Security-Policy" content="${cspValue}">`);
      }
    }

    // X-Frame-Options
    if (this.config.frameOptions.enabled) {
      metaTags.push(`<meta http-equiv="X-Frame-Options" content="${this.config.frameOptions.policy}">`);
    }

    // X-Content-Type-Options
    if (this.config.contentTypeOptions.enabled) {
      metaTags.push(`<meta http-equiv="X-Content-Type-Options" content="nosniff">`);
    }

    // X-XSS-Protection
    if (this.config.xssProtection.enabled) {
      metaTags.push(`<meta http-equiv="X-XSS-Protection" content="${this.config.xssProtection.mode}">`);
    }

    // Referrer Policy
    if (this.config.referrerPolicy.enabled) {
      metaTags.push(`<meta name="referrer" content="${this.config.referrerPolicy.policy}">`);
    }

    return metaTags;
  }

  /**
   * Validar configuración de headers
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar CSP
    if (this.config.csp.enabled) {
      if (this.config.csp.directives.defaultSrc.length === 0) {
        errors.push('CSP default-src directive cannot be empty');
      }

      // Advertir sobre directivas peligrosas en producción
      if (process.env.NODE_ENV === 'production') {
        if (this.config.csp.directives.scriptSrc.includes("'unsafe-inline'")) {
          errors.push('CSP script-src should not include unsafe-inline in production');
        }
        if (this.config.csp.directives.scriptSrc.includes("'unsafe-eval'")) {
          errors.push('CSP script-src should not include unsafe-eval in production');
        }
      }
    }

    // Validar HSTS
    if (this.config.hsts.enabled && this.config.hsts.maxAge < 300) {
      errors.push('HSTS max-age should be at least 300 seconds');
    }

    // Validar frame options
    if (this.config.frameOptions.enabled && 
        this.config.frameOptions.policy === 'ALLOW-FROM' && 
        !this.config.frameOptions.uri) {
      errors.push('Frame Options ALLOW-FROM policy requires a URI');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Actualizar configuración
   */
  updateConfig(newConfig: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): SecurityHeadersConfig {
    return { ...this.config };
  }

  /**
   * Aplicar headers a una respuesta Express
   */
  applyToResponse(res: any): void {
    const headers = this.generateHeaders();
    Object.entries(headers).forEach(([name, value]) => {
      res.setHeader(name, value);
    });
  }

  /**
   * Generar configuración para nginx
   */
  generateNginxConfig(): string {
    const headers = this.generateHeaders();
    const nginxConfig: string[] = [];

    Object.entries(headers).forEach(([name, value]) => {
      nginxConfig.push(`add_header ${name} "${value}" always;`);
    });

    return nginxConfig.join('\n');
  }

  /**
   * Generar configuración para Apache
   */
  generateApacheConfig(): string {
    const headers = this.generateHeaders();
    const apacheConfig: string[] = [];

    Object.entries(headers).forEach(([name, value]) => {
      apacheConfig.push(`Header always set ${name} "${value}"`);
    });

    return `<IfModule mod_headers.c>\n${apacheConfig.join('\n')}\n</IfModule>`;
  }

  /**
   * Generar configuración para Cloudflare Workers
   */
  generateCloudflareWorkerConfig(): string {
    const headers = this.generateHeaders();
    
    const headersObject = JSON.stringify(headers, null, 2);
    
    return `
// Cloudflare Worker para aplicar headers de seguridad
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newResponse = new Response(response.body, response)
  
  // Aplicar headers de seguridad
  const securityHeaders = ${headersObject}
  
  Object.entries(securityHeaders).forEach(([name, value]) => {
    newResponse.headers.set(name, value)
  })
  
  return newResponse
}`;
  }

  /**
   * Reportar violación de CSP
   */
  async handleCSPReport(report: any): Promise<void> {
    try {
      // Log de la violación
      console.warn('CSP Violation Report:', {
        documentUri: report['document-uri'],
        referrer: report.referrer,
        violatedDirective: report['violated-directive'],
        effectiveDirective: report['effective-directive'],
        originalPolicy: report['original-policy'],
        blockedUri: report['blocked-uri'],
        statusCode: report['status-code'],
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
        columnNumber: report['column-number']
      });

      // En producción, podrías enviar esto a un servicio de monitoreo
      if (process.env.NODE_ENV === 'production') {
        // Ejemplo: enviar a servicio de logging externo
        // await sendToLoggingService('csp-violation', report);
      }

    } catch (error) {
      console.error('Error handling CSP report:', error);
    }
  }

  /**
   * Configuración específica para desarrollo
   */
  getDevelopmentConfig(): SecurityHeadersConfig {
    const config = { ...this.config };
    
    // Relajar CSP para desarrollo
    if (!config.csp.directives.scriptSrc.includes("'unsafe-inline'")) {
      config.csp.directives.scriptSrc.push("'unsafe-inline'");
    }
    if (!config.csp.directives.scriptSrc.includes("'unsafe-eval'")) {
      config.csp.directives.scriptSrc.push("'unsafe-eval'");
    }
    
    // Agregar localhost solo si no existe
    const localhostDomains = ['ws://localhost:*', 'http://localhost:*'];
    localhostDomains.forEach(domain => {
      if (!config.csp.directives.connectSrc.includes(domain)) {
        config.csp.directives.connectSrc.push(domain);
      }
    });
    
    config.csp.reportOnly = true;
    
    // Deshabilitar HSTS en desarrollo
    config.hsts.enabled = false;
    
    // Configurar Cross-Origin policies para desarrollo (Firebase compatible)
    config.crossOrigin.embedderPolicy.enabled = false;
    config.crossOrigin.resourcePolicy.enabled = false;
    config.crossOrigin.openerPolicy.policy = 'unsafe-none';
    
    return config;
  }

  /**
   * Configuración específica para producción
   */
  getProductionConfig(): SecurityHeadersConfig {
    const config = { ...this.config };
    
    // Endurecer CSP para producción
    config.csp.directives.scriptSrc = config.csp.directives.scriptSrc.filter(
      src => !["'unsafe-inline'", "'unsafe-eval'"].includes(src)
    );
    config.csp.reportOnly = false;
    config.csp.directives.upgradeInsecureRequests = true;
    config.csp.directives.blockAllMixedContent = true;
    
    // Habilitar HSTS en producción
    config.hsts.enabled = true;
    
    return config;
  }
}

// Instancia singleton del servicio
export const securityHeadersService = new SecurityHeadersService();

// Configuración específica para Vite
export const viteSecurityPlugin = () => {
  return {
    name: 'security-headers',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        // Aplicar headers de seguridad en desarrollo con configuración específica para Firebase
        const config = securityHeadersService.getDevelopmentConfig();
        
        // Asegurar compatibilidad con Firebase en desarrollo
        const firebaseDomains = [
          'https://firebase.googleapis.com',
          'https://firebasestorage.googleapis.com',
          'https://region1.google-analytics.com',
          'https://www.google-analytics.com',
          'https://analytics.google.com'
        ];
        
        // Agregar dominios de Firebase solo si no existen
        firebaseDomains.forEach(domain => {
          if (!config.csp.directives.connectSrc.includes(domain)) {
            config.csp.directives.connectSrc.push(domain);
          }
        });
        
        // Remover duplicados
        config.csp.directives.connectSrc = [...new Set(config.csp.directives.connectSrc)];
        
        securityHeadersService.updateConfig(config);
        securityHeadersService.applyToResponse(res);
        
        // FORZAR headers compatibles con Firebase Storage - SOBRESCRIBIR cualquier header restrictivo
        res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
        
        // Remover cualquier header que pueda causar problemas
        res.removeHeader('Cross-Origin-Embedder-Policy-Report-Only');
        
        next();
      });
    }
  };
};

// Middleware para Express
export const expressSecurityMiddleware = () => {
  return (req: any, res: any, next: any) => {
    const config = process.env.NODE_ENV === 'production' 
      ? securityHeadersService.getProductionConfig()
      : securityHeadersService.getDevelopmentConfig();
      
    securityHeadersService.updateConfig(config);
    securityHeadersService.applyToResponse(res);
    next();
  };
};

// Función utilitaria para generar HTML con headers de seguridad
export const generateSecureHTML = (content: string): string => {
  const metaTags = securityHeadersService.generateMetaTags();
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${metaTags.join('\n  ')}
  <title>Klycs - Tarjetas Digitales Profesionales</title>
</head>
<body>
  ${content}
</body>
</html>`;
};

export default securityHeadersService;