import { describe, it, expect } from '@jest/globals'
import { registerSchema, loginSchema } from '../../schemas/auth.js'

describe('Auth Schemas', () => {
  describe('registerSchema', () => {
    it('debería validar datos correctos', () => {
      const validData = {
        email: 'test@example.com',
        nombre: 'Test User',
        password: 'Test123!'
      }

      const result = registerSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('debería fallar con email inválido', () => {
      const invalidData = {
        email: 'invalid-email',
        nombre: 'Test User',
        password: 'Test123!'
      }

      expect(() => registerSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar con nombre muy corto', () => {
      const invalidData = {
        email: 'test@example.com',
        nombre: 'T',
        password: 'Test123!'
      }

      expect(() => registerSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar con contraseña débil', () => {
      const invalidData = {
        email: 'test@example.com',
        nombre: 'Test User',
        password: 'weak'
      }

      expect(() => registerSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar sin mayúscula en contraseña', () => {
      const invalidData = {
        email: 'test@example.com',
        nombre: 'Test User',
        password: 'test123!'
      }

      expect(() => registerSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar sin minúscula en contraseña', () => {
      const invalidData = {
        email: 'test@example.com',
        nombre: 'Test User',
        password: 'TEST123!'
      }

      expect(() => registerSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar sin número en contraseña', () => {
      const invalidData = {
        email: 'test@example.com',
        nombre: 'Test User',
        password: 'TestTest!'
      }

      expect(() => registerSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar sin carácter especial en contraseña', () => {
      const invalidData = {
        email: 'test@example.com',
        nombre: 'Test User',
        password: 'Test1234'
      }

      expect(() => registerSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar con contraseña muy corta', () => {
      const invalidData = {
        email: 'test@example.com',
        nombre: 'Test User',
        password: 'Test1!'
      }

      expect(() => registerSchema.parse(invalidData)).toThrow()
    })
  })

  describe('loginSchema', () => {
    it('debería validar datos correctos', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Test123!'
      }

      const result = loginSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('debería fallar con email inválido', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Test123!'
      }

      expect(() => loginSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar sin email', () => {
      const invalidData = {
        password: 'Test123!'
      }

      expect(() => loginSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar sin contraseña', () => {
      const invalidData = {
        email: 'test@example.com'
      }

      expect(() => loginSchema.parse(invalidData)).toThrow()
    })
  })
})
