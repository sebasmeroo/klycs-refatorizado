import { describe, it, expect } from 'vitest'
import { 
  validateEmail, 
  validatePassword, 
  validateName,
  validateLoginForm,
  validateRegisterForm,
  sanitizeString,
  sanitizeEmail 
} from '@/utils/validation'

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = validateEmail('test@example.com')
      expect(result.success).toBe(true)
      expect(result.data).toBe('test@example.com')
    })

    it('should reject invalid email', () => {
      const result = validateEmail('invalid-email')
      expect(result.success).toBe(false)
      expect(result.errors?.email).toBe('Email inválido')
    })

    it('should reject empty email', () => {
      const result = validateEmail('')
      expect(result.success).toBe(false)
      expect(result.errors?.email).toBe('El email es requerido')
    })
  })

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = validatePassword('password123')
      expect(result.success).toBe(true)
    })

    it('should reject short password', () => {
      const result = validatePassword('123')
      expect(result.success).toBe(false)
      expect(result.errors?.password).toContain('al menos 6 caracteres')
    })

    it('should reject password without letter and number', () => {
      const result = validatePassword('password')
      expect(result.success).toBe(false)
      expect(result.errors?.password).toContain('al menos una letra y un número')
    })
  })

  describe('validateName', () => {
    it('should validate normal name', () => {
      const result = validateName('John Doe')
      expect(result.success).toBe(true)
      expect(result.data).toBe('John Doe')
    })

    it('should reject short name', () => {
      const result = validateName('J')
      expect(result.success).toBe(false)
    })

    it('should reject long name', () => {
      const result = validateName('a'.repeat(51))
      expect(result.success).toBe(false)
    })
  })

  describe('validateLoginForm', () => {
    it('should validate correct login form', () => {
      const result = validateLoginForm({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid login form', () => {
      const result = validateLoginForm({
        email: 'invalid-email',
        password: '123'
      })
      expect(result.success).toBe(false)
      expect(result.errors?.email).toBeDefined()
      expect(result.errors?.password).toBeDefined()
    })
  })

  describe('validateRegisterForm', () => {
    it('should validate correct register form', () => {
      const result = validateRegisterForm({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      })
      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const result = validateRegisterForm({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123'
      })
      expect(result.success).toBe(false)
      expect(result.errors?.confirmPassword).toBe('Las contraseñas no coinciden')
    })
  })

  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeString('<script>alert("xss")</script>Hello')
      expect(result).toBe('alert("xss")Hello')
    })

    it('should remove javascript protocols', () => {
      const result = sanitizeString('javascript:alert("xss")')
      expect(result).toBe('alert("xss")')
    })

    it('should trim whitespace', () => {
      const result = sanitizeString('  hello world  ')
      expect(result).toBe('hello world')
    })
  })

  describe('sanitizeEmail', () => {
    it('should convert to lowercase and trim', () => {
      const result = sanitizeEmail('  TEST@EXAMPLE.COM  ')
      expect(result).toBe('test@example.com')
    })
  })
})