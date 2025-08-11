import { ModuleStyle, AdvancedSpacing, AdvancedBorder, AdvancedLayout, AdvancedShadow, AdvancedTransform, AdvancedEffects } from '@/types';

// Función para generar CSS de animaciones
export const generateAnimationCSS = (animations: any[]) => {
  if (typeof document === 'undefined') return;
  
  let css = '';
  
  animations.forEach(animation => {
    const keyframeName = `animation-${animation.id}`;
    
    // Generate keyframes CSS
    const keyframesCSS = animation.keyframes
      .sort((a: any, b: any) => a.time - b.time)
      .map((kf: any) => {
        const transforms = [];
        if (kf.properties.translateX !== undefined) transforms.push(`translateX(${kf.properties.translateX}px)`);
        if (kf.properties.translateY !== undefined) transforms.push(`translateY(${kf.properties.translateY}px)`);
        if (kf.properties.scale !== undefined) transforms.push(`scale(${kf.properties.scale})`);
        if (kf.properties.rotate !== undefined) transforms.push(`rotate(${kf.properties.rotate}deg)`);
        
        const properties = [];
        if (transforms.length > 0) properties.push(`transform: ${transforms.join(' ')}`);
        if (kf.properties.opacity !== undefined) properties.push(`opacity: ${kf.properties.opacity}`);
        if (kf.properties.backgroundColor) properties.push(`background-color: ${kf.properties.backgroundColor}`);
        if (kf.properties.borderRadius !== undefined) properties.push(`border-radius: ${kf.properties.borderRadius}px`);
        if (kf.properties.boxShadow) properties.push(`box-shadow: ${kf.properties.boxShadow}`);
        
        return `${kf.time}% { ${properties.join('; ')} }`;
      })
      .join('\n    ');

    css += `@keyframes ${keyframeName} {\n    ${keyframesCSS}\n}\n`;
  });
  
  // Remove existing animation styles
  const existingStyle = document.getElementById('dynamic-animations');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Add new animation styles
  const styleElement = document.createElement('style');
  styleElement.id = 'dynamic-animations';
  styleElement.textContent = css;
  document.head.appendChild(styleElement);
};

export const generateStyleFromModule = (moduleStyle: ModuleStyle, includeSpacing: boolean = true): React.CSSProperties => {
  const style: React.CSSProperties = {};

  // Basic styles (backwards compatibility)
  if (moduleStyle.backgroundColor) {
    style.backgroundColor = moduleStyle.backgroundColor;
  }
  if (moduleStyle.textColor) {
    style.color = moduleStyle.textColor;
  }
  if (moduleStyle.borderRadius) {
    style.borderRadius = moduleStyle.borderRadius;
  }
  // Solo incluir padding y margin si se especifica
  if (includeSpacing && moduleStyle.padding) {
    style.padding = moduleStyle.padding;
  }
  if (includeSpacing && moduleStyle.margin) {
    style.margin = moduleStyle.margin;
  }

  // Advanced text styles
  if (moduleStyle.textStyle) {
    const textStyle = moduleStyle.textStyle;
    style.fontFamily = textStyle.fontFamily;
    style.fontSize = `${textStyle.fontSize}px`;
    style.fontWeight = textStyle.fontWeight;
    style.fontStyle = textStyle.fontStyle;
    style.textDecoration = textStyle.textDecoration;
    style.textAlign = textStyle.textAlign;
    style.lineHeight = textStyle.lineHeight;
    style.letterSpacing = `${textStyle.letterSpacing}px`;
    style.wordSpacing = `${textStyle.wordSpacing}px`;
    style.textTransform = textStyle.textTransform;
    style.whiteSpace = textStyle.whiteSpace;
    
    if (textStyle.textShadow) {
      style.textShadow = textStyle.textShadow;
    }
    
    // Gradient text
    if (textStyle.gradient?.enabled) {
      style.background = `linear-gradient(${textStyle.gradient.direction}, ${textStyle.gradient.colors.join(', ')})`;
      style.WebkitBackgroundClip = 'text';
      style.WebkitTextFillColor = 'transparent';
      style.backgroundClip = 'text';
    }
    
    // Text outline
    if (textStyle.outline?.enabled) {
      style.WebkitTextStroke = `${textStyle.outline.width}px ${textStyle.outline.color}`;
    }
    
    // Text glow
    if (textStyle.glow?.enabled) {
      const glowShadow = `0 0 ${textStyle.glow.size}px ${textStyle.glow.color}`;
      style.textShadow = style.textShadow ? `${style.textShadow}, ${glowShadow}` : glowShadow;
    }
  }

  // Background image from image editor
  if (moduleStyle.backgroundImage) {
    style.backgroundImage = `url(${moduleStyle.backgroundImage})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
    style.backgroundRepeat = 'no-repeat';
  }

  // Gradient backgrounds
  if (moduleStyle.gradient) {
    const gradient = moduleStyle.gradient;
    let gradientCSS = '';
    
    const stops = gradient.stops
      .sort((a: any, b: any) => a.position - b.position)
      .map((stop: any) => `${stop.color} ${stop.position}%`)
      .join(', ');
    
    switch (gradient.type) {
      case 'linear':
        gradientCSS = `linear-gradient(${gradient.angle}deg, ${stops})`;
        break;
      case 'radial':
        gradientCSS = `radial-gradient(${gradient.size} at ${gradient.center.x}% ${gradient.center.y}%, ${stops})`;
        break;
      case 'conic':
        gradientCSS = `conic-gradient(from ${gradient.angle}deg at ${gradient.center.x}% ${gradient.center.y}%, ${stops})`;
        break;
    }
    
    style.background = gradientCSS;
  }

  // Pattern backgrounds
  if (moduleStyle.pattern && moduleStyle.pattern.enabled) {
    const pattern = moduleStyle.pattern;
    // Create SVG pattern
    const patternSVG = `data:image/svg+xml;base64,${btoa(pattern.svg)}`;
    style.backgroundImage = `url(${patternSVG})`;
    style.backgroundSize = `${pattern.scale * 100}px`;
    style.backgroundRepeat = 'repeat';
    style.opacity = pattern.opacity;
  }

  // Advanced spacing
  if (moduleStyle.spacing) {
    const { padding, margin, gap } = moduleStyle.spacing;
    style.paddingTop = `${padding.top}${padding.unit}`;
    style.paddingRight = `${padding.right}${padding.unit}`;
    style.paddingBottom = `${padding.bottom}${padding.unit}`;
    style.paddingLeft = `${padding.left}${padding.unit}`;
    style.marginTop = `${margin.top}${margin.unit}`;
    style.marginRight = `${margin.right}${margin.unit}`;
    style.marginBottom = `${margin.bottom}${margin.unit}`;
    style.marginLeft = `${margin.left}${margin.unit}`;
    style.gap = `${gap.value}${gap.unit}`;
  }

  // Advanced borders
  if (moduleStyle.border) {
    const { radius, width, style: borderStyle, color } = moduleStyle.border;
    style.borderTopLeftRadius = `${radius.topLeft}${radius.unit}`;
    style.borderTopRightRadius = `${radius.topRight}${radius.unit}`;
    style.borderBottomLeftRadius = `${radius.bottomLeft}${radius.unit}`;
    style.borderBottomRightRadius = `${radius.bottomRight}${radius.unit}`;
    style.borderTopWidth = `${width.top}${width.unit}`;
    style.borderRightWidth = `${width.right}${width.unit}`;
    style.borderBottomWidth = `${width.bottom}${width.unit}`;
    style.borderLeftWidth = `${width.left}${width.unit}`;
    style.borderStyle = borderStyle;
    style.borderColor = color;
  }

  // Advanced layout
  if (moduleStyle.layout) {
    const { width, height, positioning, overflow, zIndex, display } = moduleStyle.layout;
    
    // Width
    switch (width.type) {
      case 'auto':
        style.width = 'auto';
        break;
      case 'full':
        style.width = '100%';
        break;
      case 'custom':
        style.width = `${width.value}${width.unit}`;
        break;
      case 'fit-content':
        style.width = 'fit-content';
        break;
      case 'min-content':
        style.width = 'min-content';
        break;
      case 'max-content':
        style.width = 'max-content';
        break;
    }

    // Height
    switch (height.type) {
      case 'auto':
        style.height = 'auto';
        break;
      case 'full':
        style.height = '100%';
        break;
      case 'custom':
        style.height = `${height.value}${height.unit}`;
        break;
      case 'fit-content':
        style.height = 'fit-content';
        break;
      case 'min-content':
        style.height = 'min-content';
        break;
    }

    // Positioning
    style.position = positioning.type;
    if (positioning.top !== undefined) style.top = `${positioning.top}${positioning.unit || 'px'}`;
    if (positioning.right !== undefined) style.right = `${positioning.right}${positioning.unit || 'px'}`;
    if (positioning.bottom !== undefined) style.bottom = `${positioning.bottom}${positioning.unit || 'px'}`;
    if (positioning.left !== undefined) style.left = `${positioning.left}${positioning.unit || 'px'}`;

    // Other layout properties
    style.overflow = overflow;
    style.zIndex = zIndex;
    style.display = display;

    // Flex properties
    if (display === 'flex') {
      if (moduleStyle.layout.flexDirection) style.flexDirection = moduleStyle.layout.flexDirection;
      if (moduleStyle.layout.justifyContent) style.justifyContent = moduleStyle.layout.justifyContent;
      if (moduleStyle.layout.alignItems) style.alignItems = moduleStyle.layout.alignItems;
      if (moduleStyle.layout.gap) style.gap = `${moduleStyle.layout.gap}px`;
    }
  }

  // Animation styles
  if (moduleStyle.animations && moduleStyle.animations.length > 0) {
    const activeAnimations = moduleStyle.animations.filter(anim => anim.enabled);
    if (activeAnimations.length > 0) {
      // Generate CSS keyframes and inject them
      generateAnimationCSS(activeAnimations);
      
      const animationNames = activeAnimations.map(anim => `animation-${anim.id}`);
      const animationDurations = activeAnimations.map(anim => `${anim.duration}s`);
      const animationTimings = activeAnimations.map(anim => anim.timing);
      const animationDelays = activeAnimations.map(anim => `${anim.delay}s`);
      const animationIterations = activeAnimations.map(anim => anim.iteration);
      const animationDirections = activeAnimations.map(anim => anim.direction);
      const animationFillModes = activeAnimations.map(anim => anim.fillMode);
      
      style.animationName = animationNames.join(', ');
      style.animationDuration = animationDurations.join(', ');
      style.animationTimingFunction = animationTimings.join(', ');
      style.animationDelay = animationDelays.join(', ');
      style.animationIterationCount = animationIterations.join(', ');
      style.animationDirection = animationDirections.join(', ');
      style.animationFillMode = animationFillModes.join(', ');
    }
  }

  // Advanced shadows
  if (moduleStyle.shadow?.enabled && moduleStyle.shadow.shadows.length > 0) {
    const shadowStrings = moduleStyle.shadow.shadows.map(shadow => {
      const { x, y, blur, spread, color, opacity, inset } = shadow;
      const shadowColor = `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
      return `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px ${shadowColor}`;
    });
    style.boxShadow = shadowStrings.join(', ');
  }

  // Advanced transforms
  if (moduleStyle.transform) {
    const { scale, rotate, translateX, translateY, skewX, skewY, perspective } = moduleStyle.transform;
    const transforms = [];
    
    if (scale !== 1) transforms.push(`scale(${scale})`);
    if (rotate !== 0) transforms.push(`rotate(${rotate}deg)`);
    if (translateX !== 0) transforms.push(`translateX(${translateX}px)`);
    if (translateY !== 0) transforms.push(`translateY(${translateY}px)`);
    if (skewX !== 0) transforms.push(`skewX(${skewX}deg)`);
    if (skewY !== 0) transforms.push(`skewY(${skewY}deg)`);
    if (perspective !== 0) transforms.push(`perspective(${perspective}px)`);
    
    if (transforms.length > 0) {
      style.transform = transforms.join(' ');
    }
    
    if (moduleStyle.transform.transformOrigin) {
      style.transformOrigin = moduleStyle.transform.transformOrigin;
    }
  }

  // Advanced effects
  if (moduleStyle.effects) {
    const { opacity, blur, brightness, contrast, saturate, hueRotate, sepia, grayscale } = moduleStyle.effects;
    
    if (opacity !== 1) style.opacity = opacity;
    
    const filters = [];
    if (blur > 0) filters.push(`blur(${blur}px)`);
    if (brightness !== 1) filters.push(`brightness(${brightness})`);
    if (contrast !== 1) filters.push(`contrast(${contrast})`);
    if (saturate !== 1) filters.push(`saturate(${saturate})`);
    if (hueRotate !== 0) filters.push(`hue-rotate(${hueRotate}deg)`);
    if (sepia > 0) filters.push(`sepia(${sepia})`);
    if (grayscale > 0) filters.push(`grayscale(${grayscale})`);
    
    if (filters.length > 0) {
      style.filter = filters.join(' ');
    }

    // Backdrop filters
    if (moduleStyle.effects.backdrop) {
      const backdropFilters = [];
      const { blur, brightness, contrast, saturate } = moduleStyle.effects.backdrop;
      
      if (blur > 0) backdropFilters.push(`blur(${blur}px)`);
      if (brightness !== 1) backdropFilters.push(`brightness(${brightness})`);
      if (contrast !== 1) backdropFilters.push(`contrast(${contrast})`);
      if (saturate !== 1) backdropFilters.push(`saturate(${saturate})`);
      
      if (backdropFilters.length > 0) {
        style.backdropFilter = backdropFilters.join(' ');
      }
    }
  }

  return style;
};

export const getDefaultSpacing = (): AdvancedSpacing => ({
  padding: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
  margin: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
  gap: { value: 0, unit: 'px' }
});

export const getDefaultBorder = (): AdvancedBorder => ({
  radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0, unit: 'px' },
  width: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
  style: 'solid',
  color: '#e2e8f0'
});

export const getDefaultLayout = (): AdvancedLayout => ({
  width: { type: 'auto' },
  height: { type: 'auto' },
  positioning: { type: 'relative' },
  overflow: 'visible',
  zIndex: 0,
  display: 'block'
});

export const getDefaultShadow = (): AdvancedShadow => ({
  enabled: false,
  shadows: []
});

export const getDefaultTransform = (): AdvancedTransform => ({
  scale: 1,
  rotate: 0,
  translateX: 0,
  translateY: 0,
  skewX: 0,
  skewY: 0,
  perspective: 0,
  transformOrigin: 'center'
});

export const getDefaultEffects = (): AdvancedEffects => ({
  opacity: 1,
  blur: 0,
  brightness: 1,
  contrast: 1,
  saturate: 1,
  hueRotate: 0,
  sepia: 0,
  grayscale: 0
});

export const getDefaultModuleStyle = (): ModuleStyle => ({
  spacing: getDefaultSpacing(),
  border: getDefaultBorder(),
  layout: getDefaultLayout(),
  shadow: getDefaultShadow(),
  transform: getDefaultTransform(),
  effects: getDefaultEffects()
});

// Utility to merge styles safely
export const mergeModuleStyles = (base: ModuleStyle, override: Partial<ModuleStyle>): ModuleStyle => {
  return {
    ...base,
    ...override,
    spacing: override.spacing ? { ...base.spacing, ...override.spacing } : base.spacing,
    border: override.border ? { ...base.border, ...override.border } : base.border,
    layout: override.layout ? { ...base.layout, ...override.layout } : base.layout,
    shadow: override.shadow ? { ...base.shadow, ...override.shadow } : base.shadow,
    transform: override.transform ? { ...base.transform, ...override.transform } : base.transform,
    effects: override.effects ? { ...base.effects, ...override.effects } : base.effects,
  };
};

// Utility to convert legacy styles to new format
export const convertLegacyStyle = (legacyStyle: any): ModuleStyle => {
  const newStyle = getDefaultModuleStyle();
  
  // Convert basic properties
  if (legacyStyle.backgroundColor) newStyle.backgroundColor = legacyStyle.backgroundColor;
  if (legacyStyle.textColor) newStyle.textColor = legacyStyle.textColor;
  if (legacyStyle.borderRadius) newStyle.borderRadius = legacyStyle.borderRadius;
  if (legacyStyle.padding) newStyle.padding = legacyStyle.padding;
  if (legacyStyle.margin) newStyle.margin = legacyStyle.margin;
  
  return newStyle;
};

// Utility to check if a style is using advanced features
export const isAdvancedStyle = (style: ModuleStyle): boolean => {
  return !!(
    style.spacing ||
    style.border ||
    style.layout ||
    style.shadow?.enabled ||
    style.transform ||
    style.effects
  );
};

// Utility to generate CSS class names dynamically
export const generateCSSClasses = (style: ModuleStyle): string => {
  const classes = [];
  
  // Add responsive classes if needed
  if (style.layout?.width?.type === 'full') {
    classes.push('w-full');
  }
  
  if (style.layout?.display === 'flex') {
    classes.push('flex');
  }
  
  return classes.join(' ');
};