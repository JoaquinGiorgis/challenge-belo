import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import authService from '../../services/authService.js'
import { prisma } from '../setup.js'

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}))

import bcrypt from 'bcrypt'
const mockedBcrypt = bcrypt as any

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const userData = {
        email: 'test@example.com',
        nombre: 'Test User',
        password: 'Test123!'
      }

      const mockUser = {
        id: 'user-id',
        email: userData.email,
        nombre: userData.nombre,
        password: 'hashed-password',
        saldo: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Mock de Prisma
      prisma.user.findUnique.mockResolvedValue(null) // No existe
      prisma.user.create.mockResolvedValue(mockUser)
      mockedBcrypt.hash.mockResolvedValue('hashed-password')

      const result = await authService.register(userData)

      expect(result).toMatchObject({
        email: userData.email,
        nombre: userData.nombre,
        saldo: 0
      })
      expect(result.id).toBeDefined()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      })
      expect(prisma.user.create).toHaveBeenCalled()
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(userData.password, 12)
    })

    it('debería fallar si el email ya existe', async () => {
      const userData = {
        email: 'test@example.com',
        nombre: 'Test User',
        password: 'Test123!'
      }

      const existingUser = {
        id: 'existing-id',
        email: userData.email,
        nombre: 'Existing User',
        password: 'hashed-password',
        saldo: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prisma.user.findUnique.mockResolvedValue(existingUser)

      await expect(authService.register(userData)).rejects.toThrow('El email ya está registrado')
    })

    it('debería validar el formato del email', async () => {
      const userData = {
        email: 'invalid-email',
        nombre: 'Test User',
        password: 'Test123!'
      }

      // Limpiar mocks para que no interfieran con la validación
      jest.clearAllMocks()
      
      await expect(authService.register(userData)).rejects.toThrow()
    })

    it('debería validar la contraseña', async () => {
      const userData = {
        email: 'test@example.com',
        nombre: 'Test User',
        password: 'weak'
      }

      // Limpiar mocks para que no interfieran con la validación
      jest.clearAllMocks()
      
      await expect(authService.register(userData)).rejects.toThrow()
    })
  })

  describe('login', () => {
    it('debería hacer login exitosamente con credenciales válidas', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test123!'
      }

      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        nombre: 'Test User',
        password: 'hashed-password',
        saldo: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)
      mockedBcrypt.compare.mockResolvedValue(true)

      const result = await authService.login(loginData)

      expect(result).toMatchObject({
        email: loginData.email,
        nombre: 'Test User',
        saldo: 0
      })
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email }
      })
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password)
    })

    it('debería fallar con email incorrecto', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'Test123!'
      }

      prisma.user.findUnique.mockResolvedValue(null)

      await expect(authService.login(loginData)).rejects.toThrow('Credenciales inválidas')
    })

    it('debería fallar con contraseña incorrecta', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword!'
      }

      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        nombre: 'Test User',
        password: 'hashed-password',
        saldo: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)
      mockedBcrypt.compare.mockResolvedValue(false)

      await expect(authService.login(loginData)).rejects.toThrow('Credenciales inválidas')
    })
  })

  describe('getUserById', () => {
    it('debería obtener un usuario por ID', async () => {
      const userId = 'user-id'
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        nombre: 'Test User',
        password: 'hashed-password',
        saldo: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await authService.getUserById(userId)

      expect(result).toMatchObject({
        id: userId,
        email: 'test@example.com',
        nombre: 'Test User',
        saldo: 0
      })
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nombre: true,
          saldo: true,
          createdAt: true,
          updatedAt: true
        }
      })
    })

    it('debería fallar si el usuario no existe', async () => {
      const userId = 'non-existent-id'

      prisma.user.findUnique.mockResolvedValue(null)

      await expect(authService.getUserById(userId)).rejects.toThrow('Usuario no encontrado')
    })
  })
})