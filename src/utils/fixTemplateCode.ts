import { templateDistributionService } from '@/services/templateDistribution';

declare global {
  interface Window {
    showTemplateCode: () => Promise<void>;
    fixTemplateCode: () => Promise<void>;
    createSimpleTemplate: () => Promise<void>;
  }
}

window.showTemplateCode = async () => {
  console.log('📄 Mostrando código de la plantilla...');
  
  try {
    const template = await templateDistributionService.getTemplateById('dnsqZpuGV4Whwg7wscin');
    
    if (template) {
      console.log('📋 REACT CODE:');
      console.log('================');
      console.log(template.reactCode);
      console.log('');
      console.log('🎨 CSS CODE:');
      console.log('================');
      console.log(template.cssCode);
      console.log('');
      console.log('⚙️ JSON CONFIG:');
      console.log('================');
      console.log(template.jsonConfig);
    }
  } catch (error) {
    console.error('❌ Error mostrando código:', error);
  }
};

window.fixTemplateCode = async () => {
  console.log('🔧 Creando código de plantilla más simple y funcional...');
  
  const simpleReactCode = `function ProfileTemplate({ data }) {
  return (
    <div className="profile-template">
      <div className="profile-header">
        <div className="profile-avatar">
          <img 
            src={data.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face'} 
            alt={data.name || 'Profile'} 
          />
        </div>
        <h1 className="profile-name">{data.name || 'Tu Nombre Aquí'}</h1>
        <h2 className="profile-title">{data.title || 'Tu Título Profesional'}</h2>
      </div>
      
      <div className="profile-bio">
        <p>{data.bio || 'Especialista en [Tu Área] con más de X años de experiencia ayudando a empresas a alcanzar sus objetivos.'}</p>
      </div>
      
      <div className="profile-contact">
        {data.email && (
          <div className="contact-item">
            <span className="contact-icon">📧</span>
            <span>{data.email}</span>
          </div>
        )}
        {data.phone && (
          <div className="contact-item">
            <span className="contact-icon">📱</span>
            <span>{data.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}`;

  const simpleCSSCode = `.profile-template {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  margin: 1rem;
  position: relative;
  overflow: hidden;
}

.profile-template::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%);
  pointer-events: none;
}

.profile-header {
  position: relative;
  z-index: 1;
  margin-bottom: 2rem;
}

.profile-avatar {
  margin: 0 auto 1.5rem auto;
  width: 120px;
  height: 120px;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid rgba(255,255,255,0.3);
  object-fit: cover;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.profile-name {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  line-height: 1.2;
}

.profile-title {
  font-size: 1.3rem;
  font-weight: 300;
  margin: 0 0 2rem 0;
  opacity: 0.95;
  color: rgba(255,255,255,0.9);
}

.profile-bio {
  position: relative;
  z-index: 1;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  opacity: 0.95;
}

.profile-contact {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  opacity: 0.9;
  background: rgba(255,255,255,0.1);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.contact-icon {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .profile-template {
    padding: 1.5rem;
    margin: 0.5rem;
  }
  
  .profile-name {
    font-size: 2rem;
  }
  
  .profile-title {
    font-size: 1.1rem;
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
      reactCode: simpleReactCode,
      cssCode: simpleCSSCode,
      jsonConfig: jsonConfig
    });

    if (success) {
      console.log('✅ Código de plantilla simplificado y actualizado');
      console.log('🎨 Nuevo diseño: Gradiente azul-púrpura con efectos modernos');
      console.log('📱 Responsive y optimizado');
      console.log('🔄 RECARGA LA PÁGINA: location.reload()');
    } else {
      console.error('❌ Error actualizando el código');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

window.createSimpleTemplate = async () => {
  console.log('🎯 Creando plantilla súper simple para test...');
  
  const testCode = `function SimpleTest({ data }) {
  return (
    <div style={{
      background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
      color: 'white',
      padding: '40px',
      borderRadius: '20px',
      textAlign: 'center',
      margin: '20px'
    }}>
      <h1 style={{ fontSize: '2rem', margin: '0 0 20px 0' }}>
        {data.name || 'FUNCIONA! 🎉'}
      </h1>
      <p style={{ fontSize: '1.2rem', margin: '0' }}>
        {data.title || 'La plantilla está renderizando correctamente'}
      </p>
    </div>
  );
}`;

  try {
    const success = await templateDistributionService.updateTemplate('dnsqZpuGV4Whwg7wscin', {
      reactCode: testCode,
      cssCode: '',
      jsonConfig: [
        { id: 'name', label: 'Nombre', type: 'text', defaultValue: 'Test Usuario', editable: true },
        { id: 'title', label: 'Título', type: 'text', defaultValue: 'Test Título', editable: true }
      ]
    });

    if (success) {
      console.log('✅ Plantilla de test creada');
      console.log('🔄 RECARGA: location.reload()');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

console.log('🛠️ Template Code Tools:');
console.log('  - showTemplateCode() - Muestra el código actual');
console.log('  - fixTemplateCode() - Crea código mejorado y funcional');
console.log('  - createSimpleTemplate() - Crea test simple');
console.log('');
console.log('🎯 PASOS RECOMENDADOS:');
console.log('  1. showTemplateCode() - Ver código actual');
console.log('  2. fixTemplateCode() - Aplicar código mejorado');
console.log('  3. location.reload() - Recargar');

export {};
