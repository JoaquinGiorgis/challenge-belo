import { describe, it, expect } from '@jest/globals'
import { createTransactionSchema, adminTransactionQuerySchema } from '../../schemas/transaction.js'

describe('Transaction Schemas', () => {
  describe('createTransactionSchema', () => {
    it('debería validar datos correctos', () => {
      const validData = {
        destinoId: 'user-destination-id',
        monto: 10000
      }

      const result = createTransactionSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('debería fallar sin destinoId', () => {
      const invalidData = {
        monto: 10000
      }

      expect(() => createTransactionSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar sin monto', () => {
      const invalidData = {
        destinoId: 'user-destination-id'
      }

      expect(() => createTransactionSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar con monto negativo', () => {
      const invalidData = {
        destinoId: 'user-destination-id',
        monto: -1000
      }

      expect(() => createTransactionSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar con monto cero', () => {
      const invalidData = {
        destinoId: 'user-destination-id',
        monto: 0
      }

      expect(() => createTransactionSchema.parse(invalidData)).toThrow()
    })

    it('debería fallar con destinoId inválido', () => {
      const invalidData = {
        destinoId: '',
        monto: 10000
      }

      expect(() => createTransactionSchema.parse(invalidData)).toThrow()
    })
  })

  describe('adminTransactionQuerySchema', () => {
    it('debería validar datos correctos', () => {
      const validData = {
        userId: 'user-id',
        page: '1',
        limit: '10',
        estado: 'PENDIENTE'
      }

      const result = adminTransactionQuerySchema.parse(validData)
      expect(result).toEqual({
        userId: 'user-id',
        page: 1,
        limit: 10,
        estado: 'PENDIENTE'
      })
    })

    it('debería fallar sin userId', () => {
      const invalidData = {
        page: '1',
        limit: '10'
      }

      expect(() => adminTransactionQuerySchema.parse(invalidData)).toThrow()
    })

    it('debería usar valores por defecto para page y limit', () => {
      const data = {
        userId: 'user-id'
      }

      const result = adminTransactionQuerySchema.parse(data)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('debería validar estado correcto', () => {
      const validData = {
        userId: 'user-id',
        estado: 'CONFIRMADA'
      }

      const result = adminTransactionQuerySchema.parse(validData)
      expect(result.estado).toBe('CONFIRMADA')
    })

    it('debería fallar con estado inválido', () => {
      const invalidData = {
        userId: 'user-id',
        estado: 'INVALIDO'
      }

      expect(() => adminTransactionQuerySchema.parse(invalidData)).toThrow()
    })
  })
})
