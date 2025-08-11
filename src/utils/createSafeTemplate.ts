import { templateDistributionService } from '@/services/templateDistribution';

declare global {
  interface Window {
    createSafeTemplate: () => Promise<void>;
    createBasicTemplate: () => Promise<void>;
    testTemplate: () => Promise<void>;
  }
}

window.createSafeTemplate = async () => {
  console.log('🛡️ Creando plantilla con CSS 100% seguro...');
  
  const safeReactCode = `function ProfileTemplate({ data }) {
  return (
    <div className="safe-profile">
      <div className="profile-card">
        <div className="avatar-section">
          <img 
            src={data.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face'} 
            alt={data.name || 'Profile'} 
            className="avatar-img"
          />
        </div>
        
        <div className="content-section">
          <h1 className="profile-name">{data.name || 'Tu Nombre Aquí'}</h1>
          <h2 className="profile-title">{data.title || 'Tu Título Profesional'}</h2>
          <p className="profile-bio">{data.bio || 'Especialista en [Tu Área] con más de X años de experiencia ayudando a empresas a alcanzar sus objetivos.'}</p>
        </div>
        
        <div className="contact-section">
          {data.email && (
            <div className="contact-item">
              <span className="contact-emoji">📧</span>
              <span className="contact-text">{data.email}</span>
            </div>
          )}
          {data.phone && (
            <div className="contact-item">
              <span className="contact-emoji">📱</span>
              <span className="contact-text">{data.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;

  const safeCSSCode = `.safe-profile {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

.profile-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  transform: translateZ(0);
}

.avatar-section {
  margin-bottom: 1.5rem;
}

.avatar-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.3);
  display: block;
  margin: 0 auto;
  object-fit: cover;
}

.content-section {
  margin-bottom: 2rem;
}

.profile-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.profile-title {
  font-size: 1.1rem;
  font-weight: 300;
  margin: 0 0 1rem 0;
  opacity: 0.9;
}

.profile-bio {
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
  opacity: 0.95;
}

.contact-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.15);
  padding: 0.75rem;
  border-radius: 10px;
  font-size: 0.9rem;
}

.contact-emoji {
  font-size: 1.1rem;
}

.contact-text {
  opacity: 0.95;
}

@media (max-width: 480px) {
  .safe-profile {
    padding: 0.5rem;
  }
  
  .profile-card {
    padding: 1.5rem;
  }
  
  .profile-name {
    font-size: 1.75rem;
  }
  
  .avatar-img {
    width: 80px;
    height: 80px;
  }
}`;

  const jsonConfig = [
    {
      id: 'name',
      label: 'Nombre Completo',
      type: 'text',
      defaultValue: 'Tu Nombre Aquí',
      editable: true
    },
    {
      id: 'title',
      label: 'Título Profesional',
      type: 'text',
      defaultValue: 'Tu Título Profesional',
      editable: true
    },
    {
      id: 'bio',
      label: 'Biografía',
      type: 'textarea',
      defaultValue: 'Especialista en [Tu Área] con más de X años de experiencia ayudando a empresas a alcanzar sus objetivos.',
      editable: true
    },
    {
      id: 'profileImage',
      label: 'Imagen de Perfil',
      type: 'image',
      defaultValue: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face',
      editable: true
    }
  ];

  try {
    const success = await templateDistributionService.updateTemplate('dnsqZpuGV4Whwg7wscin', {
      reactCode: safeReactCode,
      cssCode: safeCSSCode,
      jsonConfig: jsonConfig
    });

    if (success) {
      console.log('✅ Plantilla segura creada exitosamente');
      console.log('🎨 Diseño: Gradiente azul-púrpura sin propiedades bloqueadas');
      console.log('🛡️ CSS 100% compatible con el sanitizador');
      console.log('📱 Completamente responsive');
      console.log('');
      console.log('🔄 RECARGA LA PÁGINA AHORA: location.reload()');
    } else {
      console.error('❌ Error actualizando plantilla');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

window.createBasicTemplate = async () => {
  console.log('🎯 Creando plantilla súper básica para test...');
  
  const basicCode = `function SimpleProfile({ data }) {
  return (
    <div className="simple-card">
      <h1>{data.name || 'Funciona! 🎉'}</h1>
      <p>{data.title || 'La plantilla está renderizando'}</p>
    </div>
  );
}`;

  const basicCSS = `.simple-card {
  background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
  color: white;
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  margin: 1rem;
}

.simple-card h1 {
  margin: 0 0 1rem 0;
  font-size: 2rem;
}

.simple-card p {
  margin: 0;
  font-size: 1.2rem;
}`;

  try {
    const success = await templateDistributionService.updateTemplate('dnsqZpuGV4Whwg7wscin', {
      reactCode: basicCode,
      cssCode: basicCSS,
      jsonConfig: [
        { id: 'name', label: 'Nombre', type: 'text', defaultValue: 'Test Usuario', editable: true },
        { id: 'title', label: 'Título', type: 'text', defaultValue: 'Test Título', editable: true }
      ]
    });

    if (success) {
      console.log('✅ Plantilla básica creada');
      console.log('🔄 RECARGA: location.reload()');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

window.testTemplate = async () => {
  console.log('🧪 Creando test ultra simple...');
  
  const testCode = `function TestTemplate({ data }) {
  return (
    <div style={{
      background: '#FF6B6B',
      color: 'white',
      padding: '30px',
      borderRadius: '10px',
      textAlign: 'center'
    }}>
      <h2>🎉 FUNCIONA!</h2>
      <p>Plantilla renderizando correctamente</p>
    </div>
  );
}`;

  try {
    const success = await templateDistributionService.updateTemplate('dnsqZpuGV4Whwg7wscin', {
      reactCode: testCode,
      cssCode: '',
      jsonConfig: []
    });

    if (success) {
      console.log('✅ Test creado - RECARGA: location.reload()');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

console.log('🛡️ Safe Template Tools:');
console.log('  - createSafeTemplate() - Plantilla completa sin CSS bloqueado');
console.log('  - createBasicTemplate() - Plantilla básica funcional');
console.log('  - testTemplate() - Test ultra simple');
console.log('');
console.log('🎯 RECOMENDADO: createSafeTemplate()');

export {};
