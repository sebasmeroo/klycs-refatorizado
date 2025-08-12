import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Definiciones de animaciones predefinidas
export const bookingAnimations = {
  // Animaciones de entrada
  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
    transition: { duration: 0.4, ease: "easeOut" }
  },
  
  fadeInDown: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 30 },
    transition: { duration: 0.4, ease: "easeOut" }
  },
  
  slideInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  slideInRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  // Animaciones de lista staggered
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },
  
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  // Animaciones de hover
  hoverScale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { duration: 0.2 }
  },
  
  hoverLift: {
    whileHover: { y: -4, transition: { duration: 0.2 } },
    whileTap: { y: 0, transition: { duration: 0.1 } }
  },
  
  hoverGlow: {
    whileHover: { 
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.3 }
    }
  },
  
  // Animaciones de botones
  buttonPress: {
    whileTap: { scale: 0.95 },
    transition: { duration: 0.1 }
  },
  
  buttonPulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  
  // Animaciones de progreso
  progressBar: {
    initial: { width: 0 },
    animate: (progress: number) => ({
      width: `${progress}%`,
      transition: { duration: 0.8, ease: "easeOut" }
    })
  },
  
  // Animaciones de calendario
  calendarDay: {
    whileHover: { 
      scale: 1.1,
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      transition: { duration: 0.2 }
    },
    whileTap: { scale: 0.95 }
  },
  
  selectedDay: {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.2, 1],
      backgroundColor: ["#10b981", "#059669", "#10b981"],
      transition: { duration: 0.5, ease: "easeOut" }
    }
  },
  
  // Animaciones de éxito
  successCheck: {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        duration: 0.6, 
        ease: "backOut",
        delay: 0.2 
      }
    }
  },
  
  celebrationPop: {
    initial: { scale: 0 },
    animate: { 
      scale: [0, 1.2, 1],
      transition: { 
        duration: 0.6, 
        ease: "backOut"
      }
    }
  }
};

// Componentes de animación reutilizables
interface AnimatedContainerProps {
  children: React.ReactNode;
  animation?: keyof typeof bookingAnimations;
  delay?: number;
  className?: string;
  custom?: any;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animation = 'fadeInUp',
  delay = 0,
  className = '',
  custom
}) => {
  const animationConfig = bookingAnimations[animation];
  
  return (
    <motion.div
      className={className}
      initial={animationConfig.initial}
      animate={animationConfig.animate}
      exit={animationConfig.exit}
      transition={{ ...animationConfig.transition, delay }}
      custom={custom}
      {...(animationConfig.whileHover && { whileHover: animationConfig.whileHover })}
      {...(animationConfig.whileTap && { whileTap: animationConfig.whileTap })}
    >
      {children}
    </motion.div>
  );
};

// Contenedor para listas con animación staggered
export const StaggeredList: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      variants={bookingAnimations.staggerContainer}
      initial="initial"
      animate="animate"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={bookingAnimations.staggerItem}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Componente de progreso animado
export const AnimatedProgress: React.FC<{
  progress: number;
  height?: string;
  backgroundColor?: string;
  progressColor?: string;
  className?: string;
}> = ({ 
  progress, 
  height = 'h-2', 
  backgroundColor = 'bg-gray-200',
  progressColor = 'bg-emerald-500',
  className = '' 
}) => {
  return (
    <div className={`w-full ${backgroundColor} rounded-full overflow-hidden ${height} ${className}`}>
      <motion.div
        className={`${height} ${progressColor} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
};

// Botón animado
export const AnimatedButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  pulse?: boolean;
  className?: string;
}> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  pulse = false,
  className = '' 
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-300 flex items-center justify-center';
  
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-50',
    outline: 'bg-transparent text-emerald-600 border border-emerald-600 hover:bg-emerald-50'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      animate={pulse ? {
        scale: [1, 1.05, 1],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      } : {}}
    >
      {loading && (
        <motion.div
          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
      {children}
    </motion.button>
  );
};

// Card animada
export const AnimatedCard: React.FC<{
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ children, hover = true, className = '', onClick }) => {
  return (
    <motion.div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      whileHover={hover ? {
        y: -4,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        borderColor: "rgba(16, 185, 129, 0.3)",
        transition: { duration: 0.3 }
      } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// Input animado
export const AnimatedInput: React.FC<{
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  icon?: React.ReactNode;
  error?: boolean;
}> = ({ type = 'text', placeholder, value, onChange, className = '', icon, error = false }) => {
  return (
    <motion.div
      className="relative"
      whileFocus={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <motion.input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-lg ${
          icon ? 'pl-12' : ''
        } ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        whileFocus={{
          borderColor: error ? "#ef4444" : "#10b981",
          boxShadow: error ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "0 0 0 3px rgba(16, 185, 129, 0.1)"
        }}
      />
    </motion.div>
  );
};

// Número animado (contador)
export const AnimatedCounter: React.FC<{
  from: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}> = ({ from, to, duration = 1, prefix = '', suffix = '', className = '' }) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={from}
        animate={to}
        transition={{ duration, ease: "easeOut" }}
        onUpdate={(latest) => {
          if (typeof latest === 'number') {
            const element = document.getElementById('animated-counter');
            if (element) {
              element.textContent = `${prefix}${Math.round(latest)}${suffix}`;
            }
          }
        }}
      >
        <span id="animated-counter">{prefix}{from}{suffix}</span>
      </motion.span>
    </motion.span>
  );
};

// Indicador de paso animado
export const AnimatedStepIndicator: React.FC<{
  steps: number;
  currentStep: number;
  className?: string;
}> = ({ steps, currentStep, className = '' }) => {
  return (
    <div className={`flex items-center justify-center space-x-4 ${className}`}>
      {Array.from({ length: steps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        
        return (
          <React.Fragment key={stepNumber}>
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                isCompleted
                  ? 'bg-emerald-500 text-white'
                  : isActive
                  ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500'
                  : 'bg-gray-100 text-gray-400'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isActive ? {
                scale: [1, 1.1, 1],
                transition: { duration: 0.5, ease: "easeOut" }
              } : {}}
            >
              {isCompleted ? (
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </motion.svg>
              ) : (
                stepNumber
              )}
            </motion.div>
            {index < steps - 1 && (
              <motion.div
                className={`w-12 h-1 rounded-full transition-all duration-300 ${
                  stepNumber < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: stepNumber < currentStep ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ originX: 0 }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Tooltip animado
export const AnimatedTooltip: React.FC<{
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg whitespace-nowrap ${positionClasses[position]}`}
            initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Badge animado
export const AnimatedBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info';
  pulse?: boolean;
  className?: string;
}> = ({ children, variant = 'info', pulse = false, className = '' }) => {
  const variants = {
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <motion.span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variants[variant]} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        ...(pulse && {
          scale: [1, 1.05, 1],
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        })
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.span>
  );
};