import React from 'react';
import { createPortal } from 'react-dom';

interface IOSSectionProps {
  title: string;
  icon?: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
  spanOnOpen?: boolean;
  variant?: 'light' | 'dark';
  sectionKey?: string; // clave para abrir programáticamente
}

export const IOSSection: React.FC<IOSSectionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  className = '',
  compact = true,
  spanOnOpen = true,
  variant = 'dark',
  sectionKey
}) => {
  const [internalOpen, setInternalOpen] = React.useState<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const open = typeof isOpen === 'boolean' ? isOpen : internalOpen;

  const handleToggle = () => {
    if (onToggle) onToggle();
    else setInternalOpen(prev => !prev);
  };

  const containerSpan = open && spanOnOpen ? 'col-span-full xl:col-span-2' : '';
  const headerRounded = open ? 'rounded-t-2xl' : 'rounded-2xl';
  const headerBorder = open ? 'border-b-0' : '';

  const isDark = variant === 'dark';
  const headerBgOpen = isDark ? 'bg-[#2c2c2e] text-white' : 'bg-white text-[#1d1d1f]';
  const headerBgClosed = isDark ? 'bg-white/80 text-[#1d1d1f]' : 'bg-[#f2f2f7] text-[#1d1d1f]';
  const iconBg = (opened: boolean) => (opened ? (isDark ? 'bg-white/15 text-white' : 'bg-[#eaeaea] text-[#007aff]') : (isDark ? 'bg-[#f2f2f7] text-[#007aff]' : 'bg-[#f2f2f7] text-[#007aff]'));

  // Permite abrir la sección desde el sidebar via CustomEvent('open-section', { detail: 'section-key' })
  React.useEffect(() => {
    const handler = (e: any) => {
      if (!sectionKey) return;
      if (e?.detail === sectionKey) {
        setInternalOpen(true);
        setTimeout(() => {
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 10);
      }
    };
    window.addEventListener('open-section', handler as any);
    return () => window.removeEventListener('open-section', handler as any);
  }, [sectionKey]);

  return (
    <div ref={containerRef} className={`relative ${containerSpan} ${className}`} data-section-key={sectionKey || ''}>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between ios-smooth-transition ${headerRounded} shadow-sm ${compact ? 'px-3 py-2' : 'px-4 py-3'} ${open ? headerBgOpen : headerBgClosed} border border-black/5 ${headerBorder}`}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`flex items-center justify-center rounded-lg ${iconBg(open)} w-7 h-7`}>{icon}</div>
          )}
          <span className={`font-semibold ${compact ? 'text-[14px]' : 'text-[16px]'}`}>{title}</span>
        </div>
        <svg
          className={`h-5 w-5 ${open ? (isDark ? 'text-white/80' : 'text-[#8e8e93]') : 'text-[#8e8e93]'} transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>
      <div className={`transition-[max-height] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden ${open ? 'max-h-[3000px]' : 'max-h-0'}`}>
        <div className={`transform transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform will-change-opacity ${open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
          <div className="p-5 border border-gray-300 border-t-0 rounded-b-2xl bg-white text-[#0b0f12] shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface IOSNumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const IOSNumberField: React.FC<IOSNumberFieldProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = 'px',
}) => {
  const [inputValue, setInputValue] = React.useState<string>(String(value ?? min));

  React.useEffect(() => {
    setInputValue(String(value ?? min));
  }, [value, min]);

  const handleBlur = () => {
    const num = parseFloat(inputValue);
    if (isNaN(num) || num < min || num > max) {
      setInputValue(String(value ?? min));
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm text-[#0b0f12] dark:text-white mr-3 flex-1 truncate font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            const n = parseFloat(e.target.value);
            if (!isNaN(n) && n >= min && n <= max) onChange(n);
          }}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          className="w-24 rounded-xl px-3 py-2 border border-gray-300 bg-white text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
          placeholder={unit}
        />
        <span className="text-xs text-[#8e8e93] w-8 text-right">{unit}</span>
      </div>
    </div>
  );
};

interface IOSToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const IOSToggle: React.FC<IOSToggleProps> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm text-[#1d1d1f] dark:text-white mr-3">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#34c759]' : 'bg-[rgba(118,118,128,0.24)]'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
    </label>
  );
};

interface IOSSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode; // <option value="...">Label</option>
}

export const IOSSelect: React.FC<IOSSelectProps> = ({ label, value, onChange, children }) => {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = React.useState<{left:number; top:number; width:number}>({left:0, top:0, width:0});

  // Extrae items desde children <option>
  const items = React.useMemo(() => {
    return React.Children.toArray(children)
      .filter(Boolean)
      .map((child: any) => ({ value: String(child.props.value), label: String(child.props.children) }));
  }, [children]);

  const selected = items.find(i => i.value === value) || items[0];

  React.useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', onClickOutside);
    return () => window.removeEventListener('click', onClickOutside);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(o => !o);
    }
    if (e.key === 'Escape') setOpen(false);
  };

  const openMenu = () => {
    if (!containerRef.current) return;
    const btn = containerRef.current.querySelector('button');
    if (!btn) return;
    const rect = (btn as HTMLButtonElement).getBoundingClientRect();
    setMenuPos({ left: rect.left, top: rect.bottom + 6, width: rect.width });
    setOpen(true);
  };

  return (
    <div className="space-y-1 py-1" ref={containerRef}>
      <label className="block text-sm text-[#0b0f12] font-medium">{label}</label>
      <div className="relative">
        <button
          type="button"
          className={`w-full text-left rounded-xl px-4 py-3 bg-white text-[#111111] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 shadow-sm text-sm ios-smooth-transition ${open ? 'ring-2 ring-[#007aff]/30' : ''}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={onKeyDown}
        >
          <span>{selected?.label}</span>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8e8e93]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
          </svg>
        </button>

        {open && createPortal(
          <div className="fixed inset-0 z-[100]" aria-hidden="true">
            <div className="absolute inset-0" onClick={() => setOpen(false)} />
            <div
              className="absolute rounded-xl border border-gray-300 bg-white shadow-xl overflow-hidden"
              style={{ left: menuPos.left, top: menuPos.top, width: menuPos.width }}
            >
              <ul role="listbox" className="max-h-56 overflow-auto py-1">
                {items.map((item) => (
                  <li
                    key={item.value}
                    role="option"
                    aria-selected={item.value === value}
                    onClick={() => { onChange(item.value); setOpen(false); }}
                    className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-100 ${item.value === value ? 'bg-gray-100' : ''}`}
                  >
                    <span className="truncate text-[#0b0f12]">{item.label}</span>
                    {item.value === value && (
                      <svg className="h-4 w-4 text-[#007aff]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.42 0l-3.2-3.2a1 1 0 111.42-1.42l2.49 2.49 6.49-6.49a1 1 0 011.42 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export const IOSPanel: React.FC<{ title: string; subtitle?: string; icon?: React.ReactNode; className?: string; }> = ({ title, subtitle, icon, className = '' }) => {
  return (
    <div className={`glass-card-ios p-4 ios-smooth-transition ${className}`}>
      <div className="flex items-center gap-3 mb-1">
        {icon && <div className="ios-app-icon !w-10 !h-10">{icon}</div>}
        <div>
          <h2 className="ios-section-title text-[18px]">{title}</h2>
          {subtitle && <p className="text-sm text-[#8e8e93]">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

// Segmented control estilo iOS
export const IOSegmented: React.FC<{ label?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }>
  = ({ label, value, onChange, options }) => {
  return (
    <div className="space-y-1 py-1">
      {label && <label className="block text-sm text-[#0b0f12] font-medium">{label}</label>}
      <div className="inline-flex rounded-full bg-gray-100 border border-gray-300 p-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${value === opt.value ? 'bg-white border border-gray-300 shadow-sm text-[#0b0f12]' : 'text-[#4a4a4a] hover:text-black'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};


