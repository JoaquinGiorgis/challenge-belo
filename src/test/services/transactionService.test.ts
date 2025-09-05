import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import transactionService from '../../services/transactionService.js'
import { prisma } from '../setup.js'

// Mock Decimal
const mockDecimal = (value: number) => ({
  toNumber: () => value,
  toString: () => value.toString(),
  plus: (other: any) => mockDecimal(value + (typeof other === 'number' ? other : other.toNumber())),
  minus: (other: any) => mockDecimal(value - (typeof other === 'number' ? other : other.toNumber())),
  equals: (other: any) => value === (typeof other === 'number' ? other : other.toNumber()),
  lt: (other: any) => value < (typeof other === 'number' ? other : other.toNumber()),
  lte: (other: any) => value <= (typeof other === 'number' ? other : other.toNumber()),
  gt: (other: any) => value > (typeof other === 'number' ? other : other.toNumber()),
  gte: (other: any) => value >= (typeof other === 'number' ? other : other.toNumber())
})

describe('TransactionService', () => {
  const user1Id = 'user1-id'
  const user2Id = 'user2-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTransaction', () => {
    it('debería crear una transacción automática para montos <= 50,000', async () => {
      const mockUser1 = {
        id: user1Id,
        email: 'user1@test.com',
        nombre: 'User One',
        password: 'hashed',
        saldo: mockDecimal(100000),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const mockUser2 = {
        id: user2Id,
        email: 'user2@test.com',
        nombre: 'User Two',
        password: 'hashed',
        saldo: mockDecimal(50000),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const mockTransaction = {
        id: 'transaction-id',
        origenId: user1Id,
        destinoId: user2Id,
        monto: mockDecimal(10000),
        estado: 'CONFIRMADA' as const,
        fecha: new Date()
      }

      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser1) // Origen
        .mockResolvedValueOnce(mockUser2) // Destino

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(prisma)
      })

      prisma.transaction.create.mockResolvedValue(mockTransaction)
      prisma.user.update.mockResolvedValue(mockUser1)

      const result = await transactionService.createTransaction(user1Id, user2Id, 10000)

      expect(result.estado).toBe('CONFIRMADA')
      expect(result.monto.toNumber()).toBe(10000)
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('debería crear una transacción pendiente para montos > 50,000', async () => {
      const mockUser1 = {
        id: user1Id,
        email: 'user1@test.com',
        nombre: 'User One',
        password: 'hashed',
        saldo: mockDecimal(100000),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const mockUser2 = {
        id: user2Id,
        email: 'user2@test.com',
        nombre: 'User Two',
        password: 'hashed',
        saldo: mockDecimal(50000),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const mockTransaction = {
        id: 'transaction-id',
        origenId: user1Id,
        destinoId: user2Id,
        monto: mockDecimal(60000),
        estado: 'PENDIENTE' as const,
        fecha: new Date()
      }

      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser1) // Origen
        .mockResolvedValueOnce(mockUser2) // Destino

      prisma.transaction.create.mockResolvedValue(mockTransaction)

      const result = await transactionService.createTransaction(user1Id, user2Id, 60000)

      expect(result.estado).toBe('PENDIENTE')
      expect(result.monto.toNumber()).toBe(60000)
    })

    it('debería fallar si el usuario origen no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(transactionService.createTransaction('non-existent', user2Id, 1000))
        .rejects.toThrow('Usuario origen no encontrado')
    })

    it('debería fallar si el usuario destino no existe', async () => {
      const mockUser1 = {
        id: user1Id,
        email: 'user1@test.com',
        nombre: 'User One',
        password: 'hashed',
        saldo: mockDecimal(100000),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser1) // Origen existe
        .mockResolvedValueOnce(null) // Destino no existe

      await expect(transactionService.createTransaction(user1Id, 'non-existent', 1000))
        .rejects.toThrow('Usuario destino no encontrado')
    })

    it('debería fallar si el saldo es insuficiente', async () => {
      const mockUser1 = {
        id: user1Id,
        email: 'user1@test.com',
        nombre: 'User One',
        password: 'hashed',
        saldo: mockDecimal(1000), // Saldo insuficiente
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const mockUser2 = {
        id: user2Id,
        email: 'user2@test.com',
        nombre: 'User Two',
        password: 'hashed',
        saldo: mockDecimal(50000),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser1) // Origen
        .mockResolvedValueOnce(mockUser2) // Destino

      await expect(transactionService.createTransaction(user1Id, user2Id, 2000))
        .rejects.toThrow('Saldo insuficiente')
    })

    it('debería fallar si se intenta transferir a sí mismo', async () => {
      await expect(transactionService.createTransaction(user1Id, user1Id, 1000))
        .rejects.toThrow('No puedes transferir dinero a ti mismo')
    })
  })

  describe('updateTransactionStatus', () => {
    const transactionId = 'transaction-id'

    it('debería aprobar una transacción pendiente', async () => {
      const mockUser1 = {
        id: user1Id,
        email: 'user1@test.com',
        nombre: 'User One',
        password: 'hashed',
        saldo: mockDecimal(100000),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const mockUser2 = {
        id: user2Id,
        email: 'user2@test.com',
        nombre: 'User Two',
        password: 'hashed',
        saldo: mockDecimal(50000),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const mockTransaction = {
        id: transactionId,
        origenId: user1Id,
        destinoId: user2Id,
        monto: mockDecimal(60000),
        estado: 'PENDIENTE' as const,
        fecha: new Date(),
        origen: mockUser1,
        destino: mockUser2
      }

      prisma.transaction.findUnique.mockResolvedValue(mockTransaction)
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser1) // Origen
        .mockResolvedValueOnce(mockUser2) // Destino

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(prisma)
      })

      prisma.transaction.update.mockResolvedValue({
        ...mockTransaction,
        estado: 'CONFIRMADA' as const
      })

      const result = await transactionService.updateTransactionStatus(
        transactionId,
        'CONFIRMADA',
        user1Id
      )

      expect(result.estado).toBe('CONFIRMADA')
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('debería rechazar una transacción pendiente', async () => {
      const mockTransaction = {
        id: transactionId,
        origenId: user1Id,
        destinoId: user2Id,
        monto: mockDecimal(60000),
        estado: 'PENDIENTE' as const,
        fecha: new Date()
      }

      prisma.transaction.findUnique.mockResolvedValue(mockTransaction)
      prisma.transaction.update.mockResolvedValue({
        ...mockTransaction,
        estado: 'RECHAZADA' as const
      })

      const result = await transactionService.updateTransactionStatus(
        transactionId,
        'RECHAZADA',
        user1Id
      )

      expect(result.estado).toBe('RECHAZADA')
    })

    it('debería fallar si la transacción no existe', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null)

      await expect(transactionService.updateTransactionStatus(
        'non-existent',
        'CONFIRMADA',
        user1Id
      )).rejects.toThrow('Transacción no encontrada')
    })

    it('debería fallar si la transacción no está pendiente', async () => {
      const mockTransaction = {
        id: transactionId,
        origenId: user1Id,
        destinoId: user2Id,
        monto: mockDecimal(60000),
        estado: 'CONFIRMADA' as const,
        fecha: new Date()
      }

      prisma.transaction.findUnique.mockResolvedValue(mockTransaction)

      await expect(transactionService.updateTransactionStatus(
        transactionId,
        'CONFIRMADA',
        user1Id
      )).rejects.toThrow('Solo se pueden modificar transacciones pendientes')
    })
  })

  describe('getAllUserTransactions', () => {
    it('debería obtener todas las transacciones de un usuario', async () => {
      const mockTransactions = [
        {
          id: 'transaction1',
          origenId: user1Id,
          destinoId: user2Id,
          monto: mockDecimal(10000),
          estado: 'CONFIRMADA' as const,
          fecha: new Date(),
          origen: {
            id: user1Id,
            email: 'user1@test.com',
            nombre: 'User One'
          },
          destino: {
            id: user2Id,
            email: 'user2@test.com',
            nombre: 'User Two'
          }
        }
      ]

      prisma.transaction.findMany.mockResolvedValue(mockTransactions)
      prisma.transaction.count.mockResolvedValue(1)

      const result = await transactionService.getAllUserTransactions(user1Id)

      expect(result.transacciones).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
      expect(result.transacciones[0].tipo).toBe('ENVIADA')
    })

    it('debería filtrar por estado', async () => {
      const mockTransactions = [
        {
          id: 'transaction1',
          origenId: user1Id,
          destinoId: user2Id,
          monto: mockDecimal(10000),
          estado: 'PENDIENTE' as const,
          fecha: new Date(),
          origen: {
            id: user1Id,
            email: 'user1@test.com',
            nombre: 'User One'
          },
          destino: {
            id: user2Id,
            email: 'user2@test.com',
            nombre: 'User Two'
          }
        }
      ]

      prisma.transaction.findMany.mockResolvedValue(mockTransactions)
      prisma.transaction.count.mockResolvedValue(1)

      const result = await transactionService.getAllUserTransactions(user1Id, {
        estado: 'PENDIENTE'
      })

      expect(result.transacciones).toHaveLength(1)
      expect(result.transacciones[0].estado).toBe('PENDIENTE')
    })
  })
})