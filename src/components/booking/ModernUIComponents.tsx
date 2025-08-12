import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  ChevronDown, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Star, 
  Heart, 
  Share2, 
  MapPin, 
  Phone, 
  Mail,
  Award,
  Zap,
  TrendingUp,
  Users,
  Shield,
  Sparkles,
  X,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Floating Action Button moderno
export const FloatingActionButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  pulse?: boolean;
}> = ({ icon, onClick, className = '', pulse = false }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={pulse ? {
        scale: [1, 1.1, 1],
        boxShadow: ["0 4px 20px rgba(16, 185, 129, 0.4)", "0 8px 30px rgba(16, 185, 129, 0.6)", "0 4px 20px rgba(16, 185, 129, 0.4)"],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      } : {}}
    >
      {icon}
    </motion.button>
  );
};

// Selector dropdown moderno
export const ModernSelect: React.FC<{
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ options, value, onChange, placeholder = "Seleccionar...", className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left border border-gray-300 rounded-xl bg-white flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center">
          {selectedOption?.icon && (
            <span className="mr-3">{selectedOption.icon}</span>
          )}
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-hidden"
          >
            {options.length > 5 && (
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}
            
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="w-full p-3 text-left hover:bg-emerald-50 flex items-center transition-colors"
                  whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.05)" }}
                >
                  {option.icon && (
                    <span className="mr-3">{option.icon}</span>
                  )}
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Chip/Tag moderno
export const ModernChip: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  onRemove?: () => void;
  icon?: React.ReactNode;
  className?: string;
}> = ({ children, variant = 'default', size = 'md', onRemove, icon, className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    primary: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    success: 'bg-green-100 text-green-700 hover:bg-green-200',
    warning: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    error: 'bg-red-100 text-red-700 hover:bg-red-200'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <motion.div
      className={`inline-flex items-center rounded-full font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1.5 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
};

// Acordeón moderno
export const ModernAccordion: React.FC<{
  items: {
    title: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }[];
  allowMultiple?: boolean;
  className?: string;
}> = ({ items, allowMultiple = false, className = '' }) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      if (!allowMultiple) {
        newOpenItems.clear();
      }
      newOpenItems.add(index);
    }
    
    setOpenItems(newOpenItems);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => {
        const isOpen = openItems.has(index);
        
        return (
          <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
            <motion.button
              onClick={() => toggleItem(index)}
              className="w-full p-4 text-left bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
              whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
            >
              <div className="flex items-center">
                {item.icon && (
                  <span className="mr-3">{item.icon}</span>
                )}
                <span className="font-medium text-gray-900">{item.title}</span>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 text-gray-600">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

// Slider/Range moderno
export const ModernSlider: React.FC<{
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string;
  className?: string;
}> = ({ min, max, value, onChange, step = 1, label, formatValue = (v) => v.toString(), className = '' }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-sm text-emerald-600 font-semibold">
            {formatValue(value)}
          </span>
        </div>
      )}
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
          }}
        />
        <motion.div
          className="absolute top-1/2 w-5 h-5 bg-emerald-500 rounded-full shadow-lg transform -translate-y-1/2 pointer-events-none"
          style={{ left: `calc(${percentage}% - 10px)` }}
          whileHover={{ scale: 1.2 }}
        />
      </div>
    </div>
  );
};

// Rating component moderno
export const ModernRating: React.FC<{
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  className?: string;
}> = ({ value, onChange, max = 5, size = 'md', readonly = false, className = '' }) => {
  const [hoverValue, setHoverValue] = useState(0);
  
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const isActive = starValue <= (hoverValue || value);
        
        return (
          <motion.button
            key={index}
            onClick={() => !readonly && onChange?.(starValue)}
            onMouseEnter={() => !readonly && setHoverValue(starValue)}
            onMouseLeave={() => !readonly && setHoverValue(0)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
            whileHover={!readonly ? { scale: 1.1 } : {}}
            whileTap={!readonly ? { scale: 0.9 } : {}}
            disabled={readonly}
          >
            <Star
              className={`${sizes[size]} ${
                isActive ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
};

// Loading skeleton moderno
export const ModernSkeleton: React.FC<{
  width?: string;
  height?: string;
  rounded?: boolean;
  className?: string;
}> = ({ width = 'w-full', height = 'h-4', rounded = false, className = '' }) => {
  return (
    <motion.div
      className={`bg-gray-200 ${width} ${height} ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      animate={{
        opacity: [0.4, 0.8, 0.4],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

// Tarjeta de servicio premium
export const PremiumServiceCard: React.FC<{
  service: {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    duration: number;
    rating?: number;
    reviewCount?: number;
    isPopular?: boolean;
    isPremium?: boolean;
    icon?: string;
    image?: string;
    features?: string[];
  };
  onSelect: (serviceId: string) => void;
  className?: string;
}> = ({ service, onSelect, className = '' }) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <motion.div
      className={`relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${className}`}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        {service.isPopular && (
          <ModernChip variant="primary" size="sm" icon={<Award className="w-3 h-3" />}>
            Popular
          </ModernChip>
        )}
        {service.isPremium && (
          <ModernChip variant="warning" size="sm" icon={<Sparkles className="w-3 h-3" />}>
            Premium
          </ModernChip>
        )}
      </div>

      {/* Like button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          setIsLiked(!isLiked);
        }}
        className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-90 rounded-full shadow-md"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Heart
          className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`}
        />
      </motion.button>

      {/* Image or icon */}
      <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        {service.image ? (
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        ) : service.icon ? (
          <span className="text-5xl">{service.icon}</span>
        ) : (
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{service.name}</h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{service.description}</p>
          </div>
        </div>

        {/* Features */}
        {service.features && service.features.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {service.features.slice(0, 3).map((feature, index) => (
                <ModernChip key={index} variant="default" size="sm">
                  {feature}
                </ModernChip>
              ))}
              {service.features.length > 3 && (
                <ModernChip variant="default" size="sm">
                  +{service.features.length - 3}
                </ModernChip>
              )}
            </div>
          </div>
        )}

        {/* Rating and duration */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {service.rating && (
              <div className="flex items-center">
                <ModernRating value={service.rating} max={5} readonly size="sm" />
                <span className="ml-1 text-sm text-gray-600">({service.reviewCount})</span>
              </div>
            )}
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            {service.duration} min
          </div>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {service.originalPrice && service.originalPrice > service.price && (
              <span className="text-lg text-gray-400 line-through">
                €{service.originalPrice}
              </span>
            )}
            <span className="text-2xl font-bold text-emerald-600">
              €{service.price}
            </span>
          </div>
          
          <motion.button
            onClick={() => onSelect(service.id)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Reservar
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Información de negocio mejorada
export const BusinessInfoCard: React.FC<{
  business: {
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    rating?: number;
    reviewCount?: number;
    image?: string;
    hours?: { [key: string]: string };
    features?: string[];
  };
  className?: string;
}> = ({ business, className = '' }) => {
  return (
    <motion.div
      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with image/logo */}
      <div className="relative h-32 bg-gradient-to-br from-emerald-500 to-teal-600">
        {business.image ? (
          <img
            src={business.image}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {business.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Rating badge */}
        {business.rating && (
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-full flex items-center">
            <Star className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" />
            <span className="text-sm font-semibold">{business.rating}</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{business.name}</h2>
        
        {business.description && (
          <p className="text-gray-600 mb-4">{business.description}</p>
        )}

        {/* Contact info */}
        <div className="space-y-3 mb-4">
          {business.address && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-3 text-gray-400" />
              <span className="text-sm">{business.address}</span>
            </div>
          )}
          
          {business.phone && (
            <div className="flex items-center text-gray-600">
              <Phone className="w-4 h-4 mr-3 text-gray-400" />
              <a href={`tel:${business.phone}`} className="text-sm hover:text-emerald-600">
                {business.phone}
              </a>
            </div>
          )}
          
          {business.email && (
            <div className="flex items-center text-gray-600">
              <Mail className="w-4 h-4 mr-3 text-gray-400" />
              <a href={`mailto:${business.email}`} className="text-sm hover:text-emerald-600">
                {business.email}
              </a>
            </div>
          )}
        </div>

        {/* Features */}
        {business.features && business.features.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Características</h3>
            <div className="flex flex-wrap gap-2">
              {business.features.map((feature, index) => (
                <ModernChip key={index} variant="primary" size="sm">
                  {feature}
                </ModernChip>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex space-x-3">
          <motion.button
            className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Ver servicios
          </motion.button>
          
          <motion.button
            className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Estilos CSS para el slider
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    background: #10b981;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #10b981;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
`;

// Agregar estilos al head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = sliderStyles;
  document.head.appendChild(styleSheet);
}