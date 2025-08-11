import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  CreditCard, 
  Palette, 
  Share2, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [userProgress, setUserProgress] = useState({
    profileComplete: false,
    firstCardCreated: false,
    designCustomized: false,
    firstShare: false
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '¡Bienvenido a Klycs!',
      description: 'Tu plataforma para crear tarjetas digitales profesionales',
      icon: Sparkles,
      component: WelcomeStep
    },
    {
      id: 'profile',
      title: 'Completa tu Perfil',
      description: 'Añade información básica para personalizar tu experiencia',
      icon: User,
      component: ProfileStep
    },
    {
      id: 'first-card',
      title: 'Crea tu Primera Tarjeta',
      description: 'Diseña una tarjeta digital que represente tu marca',
      icon: CreditCard,
      component: FirstCardStep
    },
    {
      id: 'customize',
      title: 'Personaliza el Diseño',
      description: 'Elige colores y estilos que reflejen tu identidad',
      icon: Palette,
      component: CustomizeStep
    },
    {
      id: 'share',
      title: 'Comparte tu Tarjeta',
      description: 'Aprende a compartir tu tarjeta con el mundo',
      icon: Share2,
      component: ShareStep
    },
    {
      id: 'success',
      title: '¡Todo Listo!',
      description: 'Ya puedes empezar a usar Klycs profesionalmente',
      icon: CheckCircle,
      component: SuccessStep
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, steps[currentStep].id]));
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Marcar onboarding como completado en localStorage
    localStorage.setItem('klycs_onboarding_completed', 'true');
    localStorage.setItem('klycs_onboarding_completed_at', new Date().toISOString());
    
    onComplete();
    navigate('/dashboard');
  };

  const handleSkip = () => {
    if (confirm('¿Seguro que quieres saltar el onboarding? Puedes volver a acceder desde configuración.')) {
      handleComplete();
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header con progreso */}
        <div className="glass-card-ios p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Configuración Inicial</h1>
                <p className="text-sm text-slate-400">
                  Paso {currentStep + 1} de {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Saltar configuración
            </button>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Indicadores de pasos */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center space-y-2 flex-1">
                  <div 
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-600 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="text-xs text-center">
                    <div className={`font-medium ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                      {step.title.split(' ')[0]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenido del paso actual */}
        <div className="glass-card-ios p-8">
          <CurrentStepComponent
            onNext={handleNext}
            onPrevious={handlePrevious}
            userProgress={userProgress}
            setUserProgress={setUserProgress}
            user={user}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
          />
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between mt-6 px-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0
                ? 'text-slate-500 cursor-not-allowed'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <Target className="h-4 w-4" />
            <span>{steps[currentStep].description}</span>
          </div>

          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            <span>{currentStep === steps.length - 1 ? 'Finalizar' : 'Continuar'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Componentes de pasos individuales
const WelcomeStep: React.FC<any> = ({ onNext, user }) => (
  <div className="text-center space-y-6">
    <div className="h-24 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
      <Sparkles className="h-12 w-12 text-white" />
    </div>
    <div>
      <h2 className="text-3xl font-bold text-white mb-4">
        ¡Hola {user?.name || 'Bienvenido'}! 👋
      </h2>
      <p className="text-lg text-slate-300 mb-6">
        Te vamos a ayudar a configurar tu cuenta en unos simples pasos.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 bg-slate-800/50 rounded-lg">
          <CreditCard className="h-8 w-8 text-blue-400 mx-auto mb-2" />
          <h3 className="font-semibold text-white mb-1">Crear Tarjetas</h3>
          <p className="text-sm text-slate-400">Diseña tarjetas digitales profesionales</p>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-lg">
          <Palette className="h-8 w-8 text-purple-400 mx-auto mb-2" />
          <h3 className="font-semibold text-white mb-1">Personalizar</h3>
          <p className="text-sm text-slate-400">Elige colores y estilos únicos</p>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-lg">
          <Share2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <h3 className="font-semibold text-white mb-1">Compartir</h3>
          <p className="text-sm text-slate-400">Comparte con clientes y contactos</p>
        </div>
      </div>
    </div>
  </div>
);

const ProfileStep: React.FC<any> = ({ onNext, user, userProgress, setUserProgress }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    company: '',
    role: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProgress((prev: any) => ({ ...prev, profileComplete: true }));
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <User className="h-16 w-16 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Completa tu Perfil</h2>
        <p className="text-slate-300">
          Esta información nos ayuda a personalizar tu experiencia
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Empresa/Organización
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            ¿Cuál es tu rol principal?
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecciona una opción</option>
            <option value="entrepreneur">Emprendedor/a</option>
            <option value="freelancer">Freelancer</option>
            <option value="business-owner">Dueño de negocio</option>
            <option value="professional">Profesional</option>
            <option value="student">Estudiante</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Zap className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-300 mb-1">Consejo Profesional</h4>
              <p className="text-sm text-blue-200">
                Un perfil completo genera un 40% más de confianza en tus contactos y mejora las conversiones.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const FirstCardStep: React.FC<any> = ({ onNext, userProgress, setUserProgress }) => {
  const navigate = useNavigate();

  const handleCreateCard = () => {
    setUserProgress((prev: any) => ({ ...prev, firstCardCreated: true }));
    // Redirigir al creador de tarjetas en una nueva pestaña
    window.open('/dashboard/cards/new', '_blank');
    // Continuar con el onboarding
    setTimeout(() => onNext(), 1000);
  };

  return (
    <div className="text-center space-y-8">
      <div>
        <CreditCard className="h-16 w-16 text-purple-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Crea tu Primera Tarjeta</h2>
        <p className="text-slate-300 mb-6">
          Una tarjeta digital te permite compartir toda tu información profesional de forma elegante
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg text-left">
          <h3 className="font-semibold text-white mb-3">¿Qué incluir en tu tarjeta?</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Información de contacto</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Enlaces a redes sociales</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Servicios que ofreces</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Portfolio de trabajos</span>
            </li>
          </ul>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg text-left">
          <h3 className="font-semibold text-white mb-3">Beneficios</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>Actualización en tiempo real</span>
            </li>
            <li className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>Compartir con un solo enlace</span>
            </li>
            <li className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>Estadísticas de visualización</span>
            </li>
            <li className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>Diseño 100% personalizable</span>
            </li>
          </ul>
        </div>
      </div>

      <button
        onClick={handleCreateCard}
        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105"
      >
        Crear Mi Primera Tarjeta 🚀
      </button>
    </div>
  );
};

const CustomizeStep: React.FC<any> = ({ onNext, userProgress, setUserProgress }) => {
  const [selectedTheme, setSelectedTheme] = useState('professional');

  const themes = [
    { id: 'professional', name: 'Profesional', colors: ['#3B82F6', '#1E40AF'] },
    { id: 'creative', name: 'Creativo', colors: ['#8B5CF6', '#EC4899'] },
    { id: 'minimal', name: 'Minimalista', colors: ['#6B7280', '#374151'] },
    { id: 'vibrant', name: 'Vibrante', colors: ['#F59E0B', '#EF4444'] }
  ];

  const handleContinue = () => {
    setUserProgress((prev: any) => ({ ...prev, designCustomized: true }));
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Palette className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Personaliza tu Estilo</h2>
        <p className="text-slate-300">
          Elige un tema que refleje tu personalidad profesional
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedTheme === theme.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
            }`}
          >
            <div className="flex space-x-1 mb-3 justify-center">
              {theme.colors.map((color, index) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className={`font-medium text-sm ${
              selectedTheme === theme.id ? 'text-blue-300' : 'text-white'
            }`}>
              {theme.name}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Sparkles className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-300 mb-1">¡No te preocupes!</h4>
            <p className="text-sm text-yellow-200">
              Puedes cambiar el tema y personalizar colores en cualquier momento desde el editor.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleContinue}
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-600 transition-all"
        >
          Continuar con este Tema
        </button>
      </div>
    </div>
  );
};

const ShareStep: React.FC<any> = ({ onNext, userProgress, setUserProgress }) => {
  const [demoUrl] = useState('klycs.com/tu-usuario');

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(demoUrl);
    // Mostrar notificación de copiado
  };

  const handleContinue = () => {
    setUserProgress((prev: any) => ({ ...prev, firstShare: true }));
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Share2 className="h-16 w-16 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Comparte tu Tarjeta</h2>
        <p className="text-slate-300">
          Tu tarjeta estará disponible en una URL única y fácil de recordar
        </p>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-6">
        <h3 className="font-semibold text-white mb-4">Tu URL personalizada:</h3>
        <div className="flex items-center space-x-3 p-3 bg-slate-900 rounded-lg">
          <code className="flex-1 text-blue-300 font-mono">{demoUrl}</code>
          <button
            onClick={handleCopyUrl}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
          >
            Copiar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-white">Formas de compartir:</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Share2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-white">Redes Sociales</div>
                <div className="text-sm text-slate-400">LinkedIn, Twitter, Instagram</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">@</span>
              </div>
              <div>
                <div className="font-medium text-white">Email</div>
                <div className="text-sm text-slate-400">Firma de correo, newsletters</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-white">Consejos para más visitas:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
              <span className="text-slate-300">Añade el enlace a tu bio de Instagram</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
              <span className="text-slate-300">Inclúyelo en tu firma de email</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
              <span className="text-slate-300">Compártelo en tus tarjetas físicas</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
              <span className="text-slate-300">Úsalo en eventos y networking</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleContinue}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
        >
          ¡Perfecto, Continuemos!
        </button>
      </div>
    </div>
  );
};

const SuccessStep: React.FC<any> = ({ onNext }) => (
  <div className="text-center space-y-8">
    <div>
      <div className="h-20 w-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">¡Felicidades! 🎉</h2>
      <p className="text-lg text-slate-300 mb-8">
        Ya tienes todo configurado para empezar a usar Klycs como un profesional
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
        <Target className="h-8 w-8 text-green-400 mx-auto mb-3" />
        <h3 className="font-semibold text-white mb-2">Siguiente Paso</h3>
        <p className="text-sm text-slate-300">
          Explora tu dashboard y personaliza tu tarjeta aún más
        </p>
      </div>
      
      <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Zap className="h-8 w-8 text-blue-400 mx-auto mb-3" />
        <h3 className="font-semibold text-white mb-2">Pro Tip</h3>
        <p className="text-sm text-slate-300">
          Revisa las estadísticas regularmente para optimizar tu presencia
        </p>
      </div>
      
      <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-3" />
        <h3 className="font-semibold text-white mb-2">¿Necesitas Ayuda?</h3>
        <p className="text-sm text-slate-300">
          Consulta nuestra guía o contacta soporte en cualquier momento
        </p>
      </div>
    </div>

    <button
      onClick={onNext}
      className="px-12 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold text-lg rounded-lg hover:from-green-500 hover:to-blue-600 transition-all transform hover:scale-105"
    >
      Ir al Dashboard 🚀
    </button>
  </div>
);

export default OnboardingFlow;