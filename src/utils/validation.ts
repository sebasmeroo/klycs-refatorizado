// Validation schemas using Zod
// Note: Install with: npm install zod

// Type definitions for when Zod is available
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)/; // At least one letter and one number

// Basic validation functions (fallback when Zod is not available)
export const validateEmail = (email: string): ValidationResult<string> => {
  if (!email) {
    return { success: false, errors: { email: 'El email es requerido' } };
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return { success: false, errors: { email: 'Email inválido' } };
  }
  
  return { success: true, data: email };
};

export const validatePassword = (password: string): ValidationResult<string> => {
  if (!password) {
    return { success: false, errors: { password: 'La contraseña es requerida' } };
  }
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { success: false, errors: { password: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` } };
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return { success: false, errors: { password: 'La contraseña debe contener al menos una letra y un número' } };
  }
  
  return { success: true, data: password };
};

export const validateName = (name: string): ValidationResult<string> => {
  if (!name) {
    return { success: false, errors: { name: 'El nombre es requerido' } };
  }
  
  if (name.length < 2) {
    return { success: false, errors: { name: 'El nombre debe tener al menos 2 caracteres' } };
  }
  
  if (name.length > 50) {
    return { success: false, errors: { name: 'El nombre no puede tener más de 50 caracteres' } };
  }
  
  return { success: true, data: name.trim() };
};

export const validateUrl = (url: string): ValidationResult<string> => {
  if (!url) {
    return { success: false, errors: { url: 'La URL es requerida' } };
  }
  
  try {
    new URL(url);
    return { success: true, data: url };
  } catch {
    return { success: false, errors: { url: 'URL inválida' } };
  }
};

// Login form validation
export interface LoginFormData {
  email: string;
  password: string;
}

export const validateLoginForm = (data: LoginFormData): ValidationResult<LoginFormData> => {
  const errors: Record<string, string> = {};
  
  const emailResult = validateEmail(data.email);
  if (!emailResult.success && emailResult.errors) {
    errors.email = emailResult.errors.email;
  }
  
  const passwordResult = validatePassword(data.password);
  if (!passwordResult.success && passwordResult.errors) {
    errors.password = passwordResult.errors.password;
  }
  
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data };
};

// Register form validation
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const validateRegisterForm = (data: RegisterFormData): ValidationResult<RegisterFormData> => {
  const errors: Record<string, string> = {};
  
  const nameResult = validateName(data.name);
  if (!nameResult.success && nameResult.errors) {
    errors.name = nameResult.errors.name;
  }
  
  const emailResult = validateEmail(data.email);
  if (!emailResult.success && emailResult.errors) {
    errors.email = emailResult.errors.email;
  }
  
  const passwordResult = validatePassword(data.password);
  if (!passwordResult.success && passwordResult.errors) {
    errors.password = passwordResult.errors.password;
  }
  
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }
  
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data };
};

// Card data validation
export interface CardFormData {
  title: string;
  description: string;
  bio?: string;
}

export const validateCardForm = (data: CardFormData): ValidationResult<CardFormData> => {
  const errors: Record<string, string> = {};
  
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'El título es requerido';
  } else if (data.title.length > 100) {
    errors.title = 'El título no puede tener más de 100 caracteres';
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.description = 'La descripción es requerida';
  } else if (data.description.length > 200) {
    errors.description = 'La descripción no puede tener más de 200 caracteres';
  }
  
  if (data.bio && data.bio.length > 500) {
    errors.bio = 'La biografía no puede tener más de 500 caracteres';
  }
  
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data };
};

// Link validation
export interface LinkFormData {
  title: string;
  url: string;
  description?: string;
}

export const validateLinkForm = (data: LinkFormData): ValidationResult<LinkFormData> => {
  const errors: Record<string, string> = {};
  
  const titleResult = validateName(data.title);
  if (!titleResult.success && titleResult.errors) {
    errors.title = titleResult.errors.name;
  }
  
  const urlResult = validateUrl(data.url);
  if (!urlResult.success && urlResult.errors) {
    errors.url = urlResult.errors.url;
  }
  
  if (data.description && data.description.length > 150) {
    errors.description = 'La descripción no puede tener más de 150 caracteres';
  }
  
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data };
};

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim();
  
  // Add https:// if no protocol is specified
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
};